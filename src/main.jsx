import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import "./style.css";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
const emptyArticle = { title: "", subtitle: "", slug: "", content: "", status: "draft", cover_image_url: "", references_text: "" };
const emptyAnnouncement = { title: "", content: "", type: "text", banner_image_url: "", is_active: true };
const emptyProfile = { name: "Yayasan Bina Tandang Nurul Falah", tagline: "", short_description: "", full_description: "", vision: "", mission: "", address: "", phone: "", email: "", social_links: "{}" };

function App() {
  const [session, setSession] = useState(null), [email, setEmail] = useState(""), [password, setPassword] = useState(""), [message, setMessage] = useState("");
  const [recoveryMode, setRecoveryMode] = useState(false), [resetMode, setResetMode] = useState(false), [newPassword, setNewPassword] = useState(""), [confirmPassword, setConfirmPassword] = useState(""), [resetEmail, setResetEmail] = useState(""), [updatingPassword, setUpdatingPassword] = useState(false), [sendingReset, setSendingReset] = useState(false);
  const [tab, setTab] = useState("articles"), [articles, setArticles] = useState([]), [announcements, setAnnouncements] = useState([]);
  const [article, setArticle] = useState(emptyArticle), [announcement, setAnnouncement] = useState(emptyAnnouncement), [profile, setProfile] = useState(emptyProfile);
  const [editingId, setEditingId] = useState(null), [editingAnnouncementId, setEditingAnnouncementId] = useState(null), [profileId, setProfileId] = useState(null), [saving, setSaving] = useState(false), [uploading, setUploading] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("error=access_denied")) {
      const params = new URLSearchParams(hash.slice(1));
      setMessage(params.get("error_description") ? decodeURIComponent(params.get("error_description")).replace(/\+/g, " ") : "Link reset password tidak valid atau sudah kedaluwarsa.");
    }
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "SIGNED_IN") { setMessage(""); }
      if (event === "SIGNED_OUT") { setMessage(""); setRecoveryMode(false); setResetMode(false); }
      if (event === "PASSWORD_RECOVERY") { setRecoveryMode(true); setResetMode(false); setMessage(""); }
    });
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => { if (session && !recoveryMode) loadDashboard(); }, [session, recoveryMode]);

  async function loadDashboard() {
    const [{ data: a, error: ae }, { data: n, error: ne }, { data: p, error: pe }] = await Promise.all([
      supabase.from("articles").select("id,title,status,slug,created_at,updated_at,subtitle,content,cover_image_url,references_text").order("created_at", { ascending: false }),
      supabase.from("announcements").select("id,title,content,type,banner_image_url,is_active,start_date,end_date,created_at,updated_at").order("created_at", { ascending: false }),
      supabase.from("foundation_profile").select("*").order("updated_at", { ascending: false }).limit(1)
    ]);
    const error = ae || ne || pe; if (error) setMessage(error.message); setArticles(a || []); setAnnouncements(n || []);
    if (p?.[0]) { setProfileId(p[0].id); setProfile({ ...emptyProfile, ...p[0], social_links: typeof p[0].social_links === "string" ? p[0].social_links : JSON.stringify(p[0].social_links || {}, null, 2) }); }
  }

  async function login(e) { e.preventDefault(); setMessage(""); const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) setMessage(error.message); }

  async function sendResetEmail(e) {
    e.preventDefault();
    setMessage("");
    setSendingReset(true);
    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, { redirectTo });
    setSendingReset(false);
    if (error) { setMessage(error.message); return; }
    setMessage("Link reset password sudah dikirim. Periksa email admin Anda.");
  }

  async function updatePassword(e) {
    e.preventDefault();
    setMessage("");
    if (newPassword.length < 8) { setMessage("Password baru minimal 8 karakter."); return; }
    if (newPassword !== confirmPassword) { setMessage("Konfirmasi password tidak sama."); return; }
    setUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setUpdatingPassword(false);
    if (error) { setMessage(error.message); return; }
    setNewPassword(""); setConfirmPassword(""); setRecoveryMode(false); setMessage("Password berhasil diperbarui. Anda sekarang masuk ke dashboard.");
    window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
  }

  async function uploadFile(file, bucket, prefix) {
    if (!file) return null;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) { setMessage("Format gambar harus JPG, PNG, WEBP, atau GIF."); return null; }
    if (file.size > 10 * 1024 * 1024) { setMessage("Ukuran gambar maksimal 10 MB."); return null; }
    setUploading(true); setMessage("");
    const ext = file.name.split(".").pop().toLowerCase();
    const path = `${session.user.id}/${prefix}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
    if (error) { setUploading(false); setMessage(error.message); return null; }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    setUploading(false); return data.publicUrl;
  }

  async function handleArticleImage(e) { const url = await uploadFile(e.target.files?.[0], "MediaArtikel", "cover"); if (url) setArticle(a => ({ ...a, cover_image_url: url })); e.target.value = ""; }
  async function handleBannerImage(e) { const url = await uploadFile(e.target.files?.[0], "BannerPengumuman", "banner"); if (url) setAnnouncement(a => ({ ...a, banner_image_url: url })); e.target.value = ""; }

  async function saveArticle(e) {
    e.preventDefault(); setSaving(true); setMessage(""); const payload = { ...article, published_at: article.status === "published" ? new Date().toISOString() : null, created_by: session.user.id };
    const result = editingId ? await supabase.from("articles").update(payload).eq("id", editingId) : await supabase.from("articles").insert(payload); setSaving(false);
    if (result.error) { setMessage(result.error.message); return; } setArticle(emptyArticle); setEditingId(null); await loadDashboard(); setMessage("Artikel berhasil disimpan.");
  }
  async function saveAnnouncement(e) {
    e.preventDefault(); setSaving(true); setMessage(""); const result = editingAnnouncementId ? await supabase.from("announcements").update(announcement).eq("id", editingAnnouncementId) : await supabase.from("announcements").insert(announcement); setSaving(false);
    if (result.error) { setMessage(result.error.message); return; } setAnnouncement(emptyAnnouncement); setEditingAnnouncementId(null); await loadDashboard(); setMessage("Pengumuman berhasil disimpan.");
  }
  async function saveProfile(e) {
    e.preventDefault(); setSaving(true); setMessage(""); let social_links; try { social_links = JSON.parse(profile.social_links || "{}"); } catch { setSaving(false); setMessage("Social links harus berupa JSON yang valid."); return; }
    const payload = { ...profile, social_links, updated_at: new Date().toISOString() }; delete payload.id; delete payload.created_at;
    const result = profileId ? await supabase.from("foundation_profile").update(payload).eq("id", profileId) : await supabase.from("foundation_profile").insert(payload); setSaving(false);
    if (result.error) { setMessage(result.error.message); return; } await loadDashboard(); setMessage("Profil yayasan berhasil disimpan.");
  }
  function editArticle(item) { setEditingId(item.id); setArticle({ title: item.title || "", subtitle: item.subtitle || "", slug: item.slug || "", content: item.content || "", status: item.status || "draft", cover_image_url: item.cover_image_url || "", references_text: item.references_text || "" }); setTab("articles"); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function editAnnouncement(item) { setEditingAnnouncementId(item.id); setAnnouncement({ title: item.title || "", content: item.content || "", type: item.type || "text", banner_image_url: item.banner_image_url || "", is_active: item.is_active ?? true }); }
  async function deleteArticle(id) { if (!confirm("Hapus artikel ini?")) return; const { error } = await supabase.from("articles").delete().eq("id", id); if (error) setMessage(error.message); else { await loadDashboard(); setMessage("Artikel dihapus."); } }
  async function deleteAnnouncement(id) { if (!confirm("Hapus pengumuman ini?")) return; const { error } = await supabase.from("announcements").delete().eq("id", id); if (error) setMessage(error.message); else { await loadDashboard(); setMessage("Pengumuman dihapus."); } }

  if (recoveryMode) return <main className="login"><section className="card"><h1>Reset Password</h1><p>Yayasan Bina Tandang Nurul Falah</p><form onSubmit={updatePassword}><input type="password" placeholder="Password baru" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength="8" required /><input type="password" placeholder="Ulangi password baru" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength="8" required /><button disabled={updatingPassword}>{updatingPassword ? "Memperbarui…" : "Simpan Password Baru"}</button></form>{message && <p className="error">{message}</p>}<p style={{ fontSize: "0.9rem", marginTop: "1rem" }}>Gunakan minimal 8 karakter.</p></section></main>;
  if (resetMode) return <main className="login"><section className="card"><h1>Lupa Password</h1><p>Masukkan email admin untuk menerima link reset password.</p><form onSubmit={sendResetEmail}><input type="email" placeholder="Email admin" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required /><button disabled={sendingReset}>{sendingReset ? "Mengirim…" : "Kirim Link Reset"}</button></form>{message && <p className={message.includes("sudah dikirim") ? "notice" : "error"}>{message}</p>}<button type="button" className="secondary" onClick={() => { setResetMode(false); setMessage(""); }}>Kembali ke Login</button></section></main>;
  if (!session) return <main className="login"><section className="card"><h1>Admin Yayasan</h1><p>Yayasan Bina Tandang Nurul Falah</p><form onSubmit={login}><input type="email" placeholder="Email admin" value={email} onChange={e => setEmail(e.target.value)} required /><input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required /><button>Masuk</button></form><button type="button" className="secondary" onClick={() => { setResetMode(true); setResetEmail(email); setMessage(""); }}>Lupa password?</button>{message && <p className="error">{message}</p>}</section></main>;

  return <main>
    <header><div><h1>Dashboard CMS</h1><p>Yayasan Bina Tandang Nurul Falah</p></div><button onClick={() => supabase.auth.signOut()}>Keluar</button></header>
    {message && <div className="notice">{message}</div>}
    {uploading && <div className="notice">Mengunggah gambar…</div>}
    <nav className="tabs"><button className={tab === "articles" ? "active" : ""} onClick={() => setTab("articles")}>Artikel</button><button className={tab === "announcements" ? "active" : ""} onClick={() => setTab("announcements")}>Pengumuman</button><button className={tab === "profile" ? "active" : ""} onClick={() => setTab("profile")}>Profil Yayasan</button></nav>
    <section className="stats"><div className="card"><strong>{articles.length}</strong><span>Artikel</span></div><div className="card"><strong>{announcements.length}</strong><span>Pengumuman</span></div></section>

    {tab === "articles" && <>
      <section className="card editor"><h2>{editingId ? "Edit artikel" : "Artikel baru"}</h2><form onSubmit={saveArticle}><input placeholder="Judul" value={article.title} onChange={e => setArticle({ ...article, title: e.target.value })} required /><input placeholder="Slug, contoh: kegiatan-yayasan" value={article.slug} onChange={e => setArticle({ ...article, slug: e.target.value })} required /><input placeholder="Subjudul" value={article.subtitle} onChange={e => setArticle({ ...article, subtitle: e.target.value })} /><label>Gambar sampul<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleArticleImage} disabled={uploading} /></label>{article.cover_image_url && <img className="preview" src={article.cover_image_url} alt="Sampul" />}<textarea placeholder="Isi artikel" rows="10" value={article.content} onChange={e => setArticle({ ...article, content: e.target.value })} required /><textarea placeholder="Referensi" rows="3" value={article.references_text} onChange={e => setArticle({ ...article, references_text: e.target.value })} /><select value={article.status} onChange={e => setArticle({ ...article, status: e.target.value })}><option value="draft">Draft</option><option value="published">Terbit</option></select><div className="actions"><button disabled={saving || uploading}>{saving ? "Menyimpan…" : "Simpan artikel"}</button>{editingId && <button type="button" className="secondary" onClick={() => { setEditingId(null); setArticle(emptyArticle); }}>Batal</button>}</div></form></section>
      <section className="card"><h2>Daftar artikel</h2>{articles.length === 0 ? <p>Belum ada artikel.</p> : <ul>{articles.map(item => <li key={item.id}><div><b>{item.title}</b><small>{item.status} · /{item.slug}</small></div><div className="actions"><button onClick={() => editArticle(item)}>Edit</button><button className="danger" onClick={() => deleteArticle(item.id)}>Hapus</button></div></li>)}</ul>}</section>
    </>}

    {tab === "announcements" && <>
      <section className="card editor"><h2>{editingAnnouncementId ? "Edit pengumuman" : "Pengumuman baru"}</h2><form onSubmit={saveAnnouncement}><input placeholder="Judul" value={announcement.title} onChange={e => setAnnouncement({ ...announcement, title: e.target.value })} required /><textarea placeholder="Isi pengumuman" rows="6" value={announcement.content} onChange={e => setAnnouncement({ ...announcement, content: e.target.value })} /><select value={announcement.type} onChange={e => setAnnouncement({ ...announcement, type: e.target.value })}><option value="text">Teks</option><option value="running_text">Running text</option><option value="banner">Banner</option></select><label>Gambar banner<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleBannerImage} disabled={uploading} /></label>{announcement.banner_image_url && <img className="preview" src={announcement.banner_image_url} alt="Banner" />}<label><input type="checkbox" checked={announcement.is_active} onChange={e => setAnnouncement({ ...announcement, is_active: e.target.checked })} /> Aktif</label><div className="actions"><button disabled={saving || uploading}>{saving ? "Menyimpan…" : "Simpan pengumuman"}</button>{editingAnnouncementId && <button type="button" className="secondary" onClick={() => { setEditingAnnouncementId(null); setAnnouncement(emptyAnnouncement); }}>Batal</button>}</div></form></section>
      <section className="card"><h2>Daftar pengumuman</h2>{announcements.length === 0 ? <p>Belum ada pengumuman.</p> : <ul>{announcements.map(item => <li key={item.id}><div><b>{item.title}</b><small>{item.type} · {item.is_active ? "Aktif" : "Nonaktif"}</small></div><div className="actions"><button onClick={() => editAnnouncement(item)}>Edit</button><button className="danger" onClick={() => deleteAnnouncement(item.id)}>Hapus</button></div></li>)}</ul>}</section>
    </>}

    {tab === "profile" && <section className="card editor"><h2>Profil Yayasan</h2><form onSubmit={saveProfile}><input placeholder="Nama yayasan" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} required /><input placeholder="Tagline" value={profile.tagline} onChange={e => setProfile({ ...profile, tagline: e.target.value })} /><textarea placeholder="Deskripsi singkat" rows="4" value={profile.short_description} onChange={e => setProfile({ ...profile, short_description: e.target.value })} /><textarea placeholder="Deskripsi lengkap" rows="6" value={profile.full_description} onChange={e => setProfile({ ...profile, full_description: e.target.value })} /><textarea placeholder="Visi" rows="4" value={profile.vision} onChange={e => setProfile({ ...profile, vision: e.target.value })} /><textarea placeholder="Misi" rows="6" value={profile.mission} onChange={e => setProfile({ ...profile, mission: e.target.value })} /><textarea placeholder="Alamat" rows="3" value={profile.address} onChange={e => setProfile({ ...profile, address: e.target.value })} /><input placeholder="Telepon" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} /><input type="email" placeholder="Email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} /><textarea placeholder='Social links JSON, contoh: {"facebook":"...","instagram":"..."}' rows="5" value={profile.social_links} onChange={e => setProfile({ ...profile, social_links: e.target.value })} /><button disabled={saving}>{saving ? "Menyimpan…" : "Simpan profil"}</button></form></section>}
  </main>;
}
createRoot(document.getElementById("root")).render(<App />);
