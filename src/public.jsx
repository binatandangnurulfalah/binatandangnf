import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import "./style.css";
import "./enhancements.css";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
const logoUrl = `${import.meta.env.BASE_URL}logo-yayasan.svg`;
const foundationName = "Yayasan Bina Tandang Nurul Falah";
const formatDate = (date) => new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(date));

function PublicSite() {
  const [profile, setProfile] = useState(null);
  const [articles, setArticles] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("artikel");
    Promise.all([
      supabase.from("foundation_profile").select("*").order("updated_at", { ascending: false }).limit(1),
      supabase.from("articles").select("id,title,subtitle,slug,content,cover_image_url,references_text,published_at,created_at").eq("status", "published").order("published_at", { ascending: false }),
      supabase.from("announcements").select("id,title,content,type,banner_image_url,is_active,start_date,end_date,created_at").eq("is_active", true).order("created_at", { ascending: false })
    ]).then(([profileResult, articleResult, announcementResult]) => {
      if (profileResult.error || articleResult.error || announcementResult.error) throw (profileResult.error || articleResult.error || announcementResult.error);
      const loadedArticles = articleResult.data || [];
      setProfile(profileResult.data?.[0] || null);
      setArticles(loadedArticles);
      setAnnouncements(announcementResult.data || []);
      if (slug) setSelected(loadedArticles.find((article) => article.slug === slug) || null);
    }).catch((loadError) => setError(loadError.message || "Gagal memuat website.")).finally(() => setLoading(false));
  }, []);

  const goArticle = (article) => {
    window.history.pushState({}, "", `?artikel=${encodeURIComponent(article.slug)}`);
    setSelected(article);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goHome = () => {
    window.history.pushState({}, "", window.location.pathname);
    setSelected(null);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const name = profile?.name || foundationName;
  const socialLinks = profile?.social_links && typeof profile.social_links === "object" ? Object.entries(profile.social_links).filter(([, value]) => value) : [];

  if (loading) return <main className="site-state" aria-live="polite"><span className="spinner" aria-hidden="true" /><p>Memuat informasi yayasan…</p></main>;
  if (error) return <main className="site-state"><div className="state-card"><p className="eyebrow">TERJADI KENDALA</p><h1>Website belum dapat dimuat</h1><p>{error}</p><button className="button button-primary" onClick={() => window.location.reload()}>Coba lagi</button></div></main>;

  return <div className="site-shell">
    <a className="skip-link" href="#content">Lewati ke konten utama</a>
    <header className="site-header">
      <div className="site-header-inner">
        <button type="button" onClick={goHome} className="site-brand" aria-label="Kembali ke beranda">
          <img src={logoUrl} alt="" className="brand-logo" />
          <span><strong>{name}</strong><small>{profile?.tagline || "Berkarya, mengabdi, dan memberi manfaat"}</small></span>
        </button>
        <button type="button" className="menu-toggle" aria-expanded={menuOpen} aria-controls="site-navigation" onClick={() => setMenuOpen((open) => !open)}><span aria-hidden="true">☰</span><span>{menuOpen ? "Tutup" : "Menu"}</span></button>
        <nav id="site-navigation" className={`site-nav ${menuOpen ? "is-open" : ""}`} aria-label="Navigasi utama">
          <a href="#profil" onClick={() => setMenuOpen(false)}>Profil</a>
          <a href="#artikel" onClick={() => setMenuOpen(false)}>Artikel</a>
          <a href="#pengumuman" onClick={() => setMenuOpen(false)}>Pengumuman</a>
          {profile?.email && <a className="nav-contact" href={`mailto:${profile.email}`}>Hubungi kami</a>}
        </nav>
      </div>
    </header>

    {announcements.length > 0 && <aside className="announcement-strip" aria-label="Pengumuman terkini"><div><span className="announcement-label">Informasi terbaru</span><p>{announcements[0].content || announcements[0].title}</p><a href="#pengumuman">Lihat semua <span aria-hidden="true">→</span></a></div></aside>}

    {selected ? <main id="content" className="article-page">
      <button type="button" className="text-button" onClick={goHome}>← Kembali ke semua artikel</button>
      <article className="article-detail">
        <p className="eyebrow">ARTIKEL YAYASAN</p>
        <h1>{selected.title}</h1>
        {selected.subtitle && <p className="article-lead">{selected.subtitle}</p>}
        <p className="article-date">Dipublikasikan {formatDate(selected.published_at || selected.created_at)}</p>
        {selected.cover_image_url && <img src={selected.cover_image_url} alt={`Ilustrasi ${selected.title}`} className="article-cover" />}
        <div className="article-content">{selected.content.split(/\n+/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
        {selected.references_text && <aside className="references"><h2>Referensi</h2><p>{selected.references_text}</p></aside>}
      </article>
    </main> : <main id="content">
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="eyebrow">YAYASAN UNTUK KEBERMANFAATAN</p>
            <h1>{name}</h1>
            <p>{profile?.short_description || "Membangun kebaikan melalui pelayanan dan kegiatan yang bermanfaat bagi masyarakat."}</p>
            <div className="hero-actions"><a className="button button-light" href="#profil">Kenal lebih dekat <span aria-hidden="true">→</span></a>{profile?.email && <a className="button button-ghost" href={`mailto:${profile.email}`}>Hubungi kami</a>}</div>
          </div>
          <div className="hero-emblem"><div><img src={logoUrl} alt={`Logo ${name}`} /></div></div>
        </div>
        <div className="hero-metrics" aria-label="Ringkasan aktivitas yayasan"><div><strong>{articles.length}</strong><span>Artikel terbit</span></div><div><strong>{announcements.length}</strong><span>Informasi aktif</span></div><div><strong>∞</strong><span>Harapan untuk manfaat</span></div></div>
      </section>
      <div className="content-container">
        <section id="profil" className="content-section profile-section">
          <div className="section-intro"><p className="eyebrow">TENTANG KAMI</p><h2>Menumbuhkan manfaat, bersama masyarakat.</h2></div>
          <div className="profile-copy"><p>{profile?.full_description || profile?.short_description || "Profil yayasan akan ditampilkan di sini."}</p>{profile?.address && <p className="contact-line"><span aria-hidden="true">⌖</span><strong>Alamat</strong> {profile.address}</p>}</div>
          <div className="value-grid"><article className="value-card"><p className="eyebrow">ARAH KAMI</p><h3>Visi</h3><p>{profile?.vision || "—"}</p></article><article className="value-card"><p className="eyebrow">LANGKAH KAMI</p><h3>Misi</h3><p>{profile?.mission || "—"}</p></article></div>
        </section>
        <section id="artikel" className="content-section">
          <div className="section-heading"><div><p className="eyebrow">PUBLIKASI</p><h2>Cerita dan kabar terbaru</h2></div><p>Informasi, cerita, dan kegiatan dari yayasan.</p></div>
          {articles.length === 0 ? <div className="empty-state"><h3>Belum ada artikel</h3><p>Artikel yang diterbitkan akan muncul di halaman ini.</p></div> : <div className="article-grid">{articles.map((article, index) => <article className={`article-card ${index === 0 ? "article-card-featured" : ""}`} key={article.id}>{article.cover_image_url ? <img src={article.cover_image_url} alt="" className="article-thumbnail" /> : <div className="article-placeholder" aria-hidden="true" />}<div className="article-card-body"><p className="article-date">{formatDate(article.published_at || article.created_at)}</p><h3>{article.title}</h3>{article.subtitle && <p>{article.subtitle}</p>}<button type="button" className="text-button" onClick={() => goArticle(article)}>Baca artikel <span aria-hidden="true">→</span></button></div></article>)}</div>}
        </section>
        <section id="pengumuman" className="content-section">
          <div className="section-heading"><div><p className="eyebrow">INFORMASI</p><h2>Pengumuman</h2></div><p>Jangan lewatkan agenda dan informasi penting dari yayasan.</p></div>
          {announcements.length === 0 ? <div className="empty-state"><h3>Belum ada pengumuman aktif</h3><p>Informasi terbaru dari yayasan akan tampil di sini.</p></div> : <div className="announcement-list">{announcements.map((announcement) => <article className="announcement-card" key={announcement.id}>{announcement.banner_image_url && <img src={announcement.banner_image_url} alt="" />}<div><p className="eyebrow">INFORMASI YAYASAN</p><h3>{announcement.title}</h3><p>{announcement.content}</p></div></article>)}</div>}
        </section>
      </div>
    </main>}
    <footer className="site-footer"><div className="footer-inner"><div className="footer-brand"><img src={logoUrl} alt="" /><div><strong>{name}</strong><p>{profile?.short_description || ""}</p></div></div><div className="footer-contact"><p className="eyebrow">HUBUNGI KAMI</p>{profile?.phone && <a href={`tel:${profile.phone}`}>{profile.phone}</a>}{profile?.email && <a href={`mailto:${profile.email}`}>{profile.email}</a>}{socialLinks.map(([label, url]) => <a href={url} target="_blank" rel="noreferrer" key={label}>{label}</a>)}</div></div><p className="footer-bottom">© {new Date().getFullYear()} {name} · Bersama menebar manfaat.</p></footer>
  </div>;
}

createRoot(document.getElementById("root")).render(<PublicSite />);

