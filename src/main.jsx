import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import "./style.css";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

const emptyArticle = { title: "", subtitle: "", slug: "", content: "", status: "draft", cover_image_url: "", references_text: "" };

function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [articles, setArticles] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [article, setArticle] = useState(emptyArticle);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { if (session) loadDashboard(); }, [session]);

  async function loadDashboard() {
    const [{ data: a, error: ae }, { data: n, error: ne }] = await Promise.all([
      supabase.from("articles").select("id,title,status,slug,created_at,updated_at").order("created_at", { ascending: false }),
      supabase.from("announcements").select("id,title,is_active,created_at").order("created_at", { ascending: false })
    ]);
    if (ae || ne) setMessage((ae || ne).message);
    setArticles(a || []); setAnnouncements(n || []);
  }

  async function login(event) {
    event.preventDefault(); setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage(error.message);
  }

  async function saveArticle(event) {
    event.preventDefault(); setSaving(true); setMessage("");
    const payload = { ...article, published_at: article.status === "published" ? new Date().toISOString() : null, created_by: session.user.id };
    const result = editingId
      ? await supabase.from("articles").update(payload).eq("id", editingId)
      : await supabase.from("articles").insert(payload);
    setSaving(false);
    if (result.error) { setMessage(result.error.message); return; }
    setArticle(emptyArticle); setEditingId(null); await loadDashboard(); setMessage("Artikel berhasil disimpan.");
  }

  function editArticle(item) {
    setEditingId(item.id);
    setArticle({ title: item.title || "", subtitle: item.subtitle || "", slug: item.slug || "", content: item.content || "", status: item.status || "draft", cover_image_url: item.cover_image_url || "", references_text: item.references_text || "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteArticle(id) {
    if (!confirm("Hapus artikel ini?")) return;
    const { error } = await supabase.from("articles").delete().eq("id", id);
    if (error) setMessage(error.message); else await loadDashboard();
  }

  if (!session) return <main className="login"><section className="card"><h1>Admin Yayasan</h1><p>Yayasan Bina Tandang Nurul Falah</p><form onSubmit={login}><input type="email" placeholder="Email admin" value={email} onChange={e => setEmail(e.target.value)} required /><input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required /><button>Masuk</button></form>{message && <p className="error">{message}</p>}</section></main>;

  return <main>
    <header><div><h1>Dashboard CMS</h1><p>Yayasan Bina Tandang Nurul Falah</p></div><button onClick={() => supabase.auth.signOut()}>Keluar</button></header>
    {message && <div className="notice">{message}</div>}
    <section className="stats"><div className="card"><strong>{articles.length}</strong><span>Artikel</span></div><div className="card"><strong>{announcements.length}</strong><span>Pengumuman</span></div></section>
    <section className="card editor"><h2>{editingId ? "Edit artikel" : "Artikel baru"}</h2><form onSubmit={saveArticle}>
      <input placeholder="Judul" value={article.title} onChange={e => setArticle({ ...article, title: e.target.value })} required />
      <input placeholder="Slug, contoh: kegiatan-yayasan" value={article.slug} onChange={e => setArticle({ ...article, slug: e.target.value })} required />
      <input placeholder="Subjudul" value={article.subtitle} onChange={e => setArticle({ ...article, subtitle: e.target.value })} />
      <input placeholder="URL gambar sampul (opsional)" value={article.cover_image_url} onChange={e => setArticle({ ...article, cover_image_url: e.target.value })} />
      <textarea placeholder="Isi artikel" rows="10" value={article.content} onChange={e => setArticle({ ...article, content: e.target.value })} required />
      <textarea placeholder="Referensi" rows="3" value={article.references_text} onChange={e => setArticle({ ...article, references_text: e.target.value })} />
      <select value={article.status} onChange={e => setArticle({ ...article, status: e.target.value })}><option value="draft">Draft</option><option value="published">Terbit</option></select>
      <div className="actions"><button disabled={saving}>{saving ? "Menyimpan…" : "Simpan artikel"}</button>{editingId && <button type="button" className="secondary" onClick={() => { setEditingId(null); setArticle(emptyArticle); }}>Batal</button>}</div>
    </form></section>
    <section className="card"><h2>Daftar artikel</h2>{articles.length === 0 ? <p>Belum ada artikel.</p> : <ul>{articles.map(item => <li key={item.id}><div><b>{item.title}</b><small>{item.status} · /{item.slug}</small></div><div className="actions"><button onClick={() => editArticle(item)}>Edit</button><button className="danger" onClick={() => deleteArticle(item.id)}>Hapus</button></div></li>)}</ul>}</section>
  </main>;
}

createRoot(document.getElementById("root")).render(<App />);
