import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
const logoUrl = `${import.meta.env.BASE_URL}logo-yayasan.svg`;

function PublicSite() {
  const [profile, setProfile] = useState(null);
  const [articles, setArticles] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("artikel");
    Promise.all([
      supabase.from("foundation_profile").select("*").order("updated_at", { ascending: false }).limit(1),
      supabase.from("articles").select("id,title,subtitle,slug,content,cover_image_url,references_text,published_at,created_at").eq("status", "published").order("published_at", { ascending: false }),
      supabase.from("announcements").select("id,title,content,type,banner_image_url,is_active,start_date,end_date,created_at").eq("is_active", true).order("created_at", { ascending: false })
    ]).then(([p, a, n]) => {
      if (p.error || a.error || n.error) throw (p.error || a.error || n.error);
      setProfile(p.data?.[0] || null); setArticles(a.data || []); setAnnouncements(n.data || []);
      if (slug) setSelected((a.data || []).find(x => x.slug === slug) || null);
    }).catch(e => setError(e.message || "Gagal memuat website.")).finally(() => setLoading(false));
  }, []);

  const goArticle = (article) => { window.history.pushState({}, "", `?artikel=${encodeURIComponent(article.slug)}`); setSelected(article); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const home = () => { window.history.pushState({}, "", window.location.pathname); setSelected(null); window.scrollTo({ top: 0, behavior: "smooth" }); };

  if (loading) return <div style={styles.center}>Memuat website…</div>;
  if (error) return <div style={styles.center}><h2>Website belum dapat dimuat</h2><p>{error}</p></div>;

  return <div style={styles.page}>
    <header style={styles.header}>
      <button onClick={home} style={styles.brand} aria-label="Beranda Yayasan">
        <img src={logoUrl} alt="Logo Yayasan Bina Tandang Nurul Falah" style={styles.headerLogo}/>
        <span><b>{profile?.name || "Yayasan Bina Tandang Nurul Falah"}</b><small style={styles.tagline}>{profile?.tagline || "Berkarya, mengabdi, dan memberi manfaat"}</small></span>
      </button>
      <nav><a href="#profil" style={styles.nav}>Profil</a><a href="#artikel" style={styles.nav}>Artikel</a><a href="#pengumuman" style={styles.nav}>Pengumuman</a></nav>
    </header>

    {announcements.length > 0 && <div style={styles.ticker}><strong>Pengumuman:</strong><span>{announcements[0].content || announcements[0].title}</span></div>}

    {selected ? <main style={styles.main}><button onClick={home} style={styles.back}>← Kembali</button><article><div style={styles.kicker}>ARTIKEL</div><h1 style={styles.articleTitle}>{selected.title}</h1>{selected.subtitle && <p style={styles.subtitle}>{selected.subtitle}</p>}{selected.cover_image_url && <img src={selected.cover_image_url} alt="" style={styles.cover}/>}<div style={styles.content}>{selected.content.split(/\n+/).map((p,i)=><p key={i}>{p}</p>)}</div>{selected.references_text && <div style={styles.references}><b>Referensi</b><p>{selected.references_text}</p></div>}</article></main> : <>
      <section style={styles.hero}><div style={styles.heroInner}><div><div style={styles.kicker}>YAYASAN</div><h1 style={styles.heroTitle}>{profile?.name || "Yayasan Bina Tandang Nurul Falah"}</h1><p style={styles.heroText}>{profile?.short_description || "Membangun kebaikan melalui pelayanan dan kegiatan yang bermanfaat bagi masyarakat."}</p><a href="#profil" style={styles.cta}>Kenal Lebih Dekat →</a></div><div style={styles.heroLogo}><img src={logoUrl} alt="Logo Yayasan Bina Tandang Nurul Falah" style={styles.heroLogoImage}/></div></div></section>
      <main style={styles.main}>
        <section id="profil" style={styles.section}><div style={styles.kicker}>TENTANG KAMI</div><h2 style={styles.heading}>Profil Yayasan</h2><p>{profile?.full_description || profile?.short_description || "Profil yayasan akan ditampilkan di sini."}</p><div style={styles.grid2}><div><h3>Visi</h3><p>{profile?.vision || "—"}</p></div><div><h3>Misi</h3><p>{profile?.mission || "—"}</p></div></div>{profile?.address && <p><b>Alamat:</b> {profile.address}</p>}</section>
        <section id="artikel" style={styles.section}><div className="anchor"></div><div style={styles.kicker}>PUBLIKASI</div><h2 style={styles.heading}>Artikel Terbaru</h2>{articles.length === 0 ? <p>Belum ada artikel yang diterbitkan.</p> : <div style={styles.cards}>{articles.map(a => <article key={a.id} style={styles.card}>{a.cover_image_url && <img src={a.cover_image_url} alt="" style={styles.thumb}/>}<div style={styles.cardBody}><div style={styles.date}>{new Date(a.published_at || a.created_at).toLocaleDateString("id-ID", { day:"numeric", month:"long", year:"numeric" })}</div><h3>{a.title}</h3>{a.subtitle && <p>{a.subtitle}</p>}<button onClick={() => goArticle(a)} style={styles.read}>Baca artikel →</button></div></article>)}</div>}</section>
        <section id="pengumuman" style={styles.section}><div style={styles.kicker}>INFORMASI</div><h2 style={styles.heading}>Pengumuman</h2>{announcements.length === 0 ? <p>Tidak ada pengumuman aktif.</p> : <div style={styles.announcements}>{announcements.map(n => <div key={n.id} style={styles.announcement}>{n.banner_image_url && <img src={n.banner_image_url} alt="" style={styles.banner}/>}<div><b>{n.title}</b><p>{n.content}</p></div></div>)}</div>}</section>
      </main></>}

    <footer style={styles.footer}><div><img src={logoUrl} alt="Logo" style={styles.footerLogo}/><div><b>{profile?.name || "Yayasan Bina Tandang Nurul Falah"}</b><p>{profile?.short_description || ""}</p></div></div><div>{profile?.phone && <p>☎ {profile.phone}</p>}{profile?.email && <p>✉ {profile.email}</p>}</div></footer>
  </div>;
}

const styles = {
  page:{minHeight:"100vh",background:"#f7f5ef",color:"#18322a",fontFamily:"system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"},
  header:{position:"sticky",top:0,zIndex:5,display:"flex",justifyContent:"space-between",alignItems:"center",gap:24,padding:"14px 6vw",background:"rgba(255,255,255,.96)",backdropFilter:"blur(12px)",borderBottom:"1px solid #e6e2d8"},
  brand:{border:0,background:"none",padding:0,fontWeight:800,fontSize:"1.05rem",color:"#18322a",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:12},
  headerLogo:{width:48,height:48,objectFit:"contain",flex:"0 0 auto"},
  tagline:{display:"block",fontSize:".8rem",color:"#68766f",marginTop:4,fontWeight:400},
  nav:{marginLeft:18,color:"#315449",textDecoration:"none",fontSize:".9rem"},
  ticker:{padding:"10px 6vw",background:"#e8efe9",display:"flex",gap:10,alignItems:"center",fontSize:".9rem"},
  hero:{background:"linear-gradient(135deg,#18322a,#315c4d)",color:"white"},
  heroInner:{maxWidth:1100,margin:"auto",padding:"90px 6vw",display:"grid",gridTemplateColumns:"1fr 220px",gap:40,alignItems:"center"},
  kicker:{fontSize:".75rem",letterSpacing:".16em",fontWeight:800,opacity:.7},
  heroTitle:{fontSize:"clamp(2.2rem,5vw,4.6rem)",lineHeight:1.02,margin:"12px 0 18px",maxWidth:800},
  heroText:{fontSize:"1.1rem",lineHeight:1.7,maxWidth:700,opacity:.9},
  cta:{display:"inline-block",marginTop:16,padding:"12px 18px",borderRadius:999,background:"white",color:"#18322a",textDecoration:"none",fontWeight:700},
  heroLogo:{width:220,height:220,border:"1px solid rgba(255,255,255,.35)",borderRadius:28,display:"grid",placeItems:"center",background:"rgba(255,255,255,.04)"},
  heroLogoImage:{width:"78%",height:"78%",objectFit:"contain"},
  main:{maxWidth:1100,margin:"auto",padding:"56px 6vw"},
  section:{padding:"50px 0",scrollMarginTop:90},
  heading:{fontSize:"clamp(1.8rem,3vw,2.7rem)",margin:"8px 0 18px"},
  grid2:{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:24,margin:"28px 0"},
  cards:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:22},
  card:{background:"white",borderRadius:20,overflow:"hidden",border:"1px solid #e5e1d8",boxShadow:"0 8px 30px rgba(24,50,42,.06)"},
  thumb:{width:"100%",height:190,objectFit:"cover"},
  cardBody:{padding:22},
  date:{fontSize:".75rem",color:"#7b867f",textTransform:"uppercase",letterSpacing:".08em"},
  read:{border:0,background:"none",padding:0,color:"#315c4d",fontWeight:800,cursor:"pointer"},
  announcements:{display:"grid",gap:14},
  announcement:{background:"white",border:"1px solid #e5e1d8",borderRadius:16,padding:18,display:"flex",gap:18},
  banner:{width:180,maxHeight:120,objectFit:"cover",borderRadius:12},
  footer:{padding:"45px 6vw",background:"#18322a",color:"white",display:"flex",justifyContent:"space-between",gap:30},
  footerLogo:{width:64,height:64,objectFit:"contain",background:"white",borderRadius:16,padding:6,marginBottom:12},
  articleTitle:{fontSize:"clamp(2rem,5vw,4rem)",lineHeight:1.05,margin:"10px 0"},
  subtitle:{fontSize:"1.15rem",color:"#68766f"},
  cover:{width:"100%",maxHeight:520,objectFit:"cover",borderRadius:24,margin:"25px 0"},
  content:{fontSize:"1.08rem",lineHeight:1.9,maxWidth:780},
  references:{marginTop:35,padding:20,background:"#eeece5",borderRadius:16},
  back:{border:0,background:"none",cursor:"pointer",color:"#315c4d",fontWeight:800,padding:0},
  center:{minHeight:"100vh",display:"grid",placeItems:"center",padding:30,textAlign:"center"}
};

createRoot(document.getElementById("root")).render(<PublicSite />);
