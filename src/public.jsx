import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import './styles.css';
import { t, setLanguage, initI18n } from './lib/i18n.js';

const db = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
const logo = `${import.meta.env.BASE_URL}logo-yayasan.svg`;
const money = n => n == null ? '' : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

// Navigation items with i18n keys
const navItems = [
  { id: 'profil', key: 'nav_about' },
  { id: 'program', key: 'nav_programs' },
  { id: 'pesantren', key: 'Pesantren' },
  { id: 'pendidikan', key: 'nav_education' },
  { id: 'koperasi', key: 'nav_coop' },
  { id: 'kegiatan', key: 'nav_activities' },
  { id: 'artikel', key: 'nav_articles' },
  { id: 'kontak', key: 'nav_contact' }
];

function App() {
  const [d, setD] = useState({ profile: {}, units: [], profiles: [], programs: [], education: [], products: [], articles: [], events: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [active, setActive] = useState('home');
  const [search, setSearch] = useState('');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [lang, setLang] = useState(() => localStorage.getItem('preferred_language') || 'id');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initialize theme and language
  useEffect(() => {
    initI18n();
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', newMode ? 'dark' : 'light');
  }, [darkMode]);

  // Change language
  const changeLang = useCallback((newLang) => {
    setLang(newLang);
    setLanguage(newLang);
  }, []);

  // Fetch data
  useEffect(() => {
    (async () => {
      try {
        const q = await Promise.all([
          db.from('foundation_profile').select('*').limit(1).maybeSingle(),
          db.from('units').select('*').eq('is_active', true).order('order_index'),
          db.from('unit_profiles').select('*'),
          db.from('programs').select('*, program_categories(name), units(name, slug)').eq('is_active', true).order('order_index'),
          db.from('education_units').select('*').eq('is_active', true).order('order_index'),
          db.from('products').select('*, product_categories(name)').eq('is_available', true).order('order_index'),
          db.from('articles').select('id, title, subtitle, slug, content, cover_image_url, published_at, category_id, article_categories(name), units(name, slug)').eq('status', 'published').order('published_at', { ascending: false }).limit(12),
          db.from('events').select('*, event_categories(name), units(name, slug)').eq('is_published', true).order('start_at').limit(12)
        ]);
        const bad = q.find(x => x.error);
        if (bad) throw bad.error;
        setD({ profile: q[0].data || {}, units: q[1].data || [], profiles: q[2].data || [], programs: q[3].data || [], education: q[4].data || [], products: q[5].data || [], articles: q[6].data || [], events: q[7].data || [] });
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const go = useCallback((id) => {
    setActive(id);
    setMobileMenuOpen(false);
    history.replaceState({}, '', id === 'home' ? location.pathname : `#${id}`);
    scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const unit = useCallback((s) => d.units.find(x => x.slug === s), [d.units]);
  const up = useCallback((s) => d.profiles.find(x => x.unit_id === unit(s)?.id), [d.profiles, unit]);
  
  const articles = useMemo(() => 
    d.articles.filter(a => `${a.title} ${a.subtitle || ''} ${a.content}`.toLowerCase().includes(search.toLowerCase())),
    [d.articles, search]
  );

  if (loading) return <div className="state"><div className="spinner" />{t('loading')}</div>;
  if (error) return <div className="state"><h1>{t('error')}</h1><p>{error}</p></div>;
  
  const p = d.profile;

  return (
    <>
      <header className="top">
        <button className="brand" onClick={() => go('home')}>
          <img src={logo} alt={p.name || 'Logo Yayasan'} loading="lazy" />
          <span>
            <b>{p.name || t('nav_home')}</b>
            <small>{p.tagline || t('hero_subtitle')}</small>
          </span>
        </button>
        
        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          {navItems.map(item => (
            <button key={item.id} onClick={() => go(item.id)}>
              {t(item.key)}
            </button>
          ))}
          <button className="donate-btn" onClick={() => window.location.href = '#donasi'}>
            {t('nav_donate')}
          </button>
        </nav>

        {/* Controls */}
        <div className="controls">
          {/* Language Selector */}
          <select 
            className="lang-select" 
            value={lang} 
            onChange={(e) => changeLang(e.target.value)}
            aria-label={t('lang_select')}
          >
            <option value="id">🇮🇩 ID</option>
            <option value="en">🇬🇧 EN</option>
            <option value="ar">🇸🇦 AR</option>
          </select>

          {/* Dark Mode Toggle */}
          <button 
            className="theme-toggle" 
            onClick={toggleDarkMode}
            aria-label={t('dark_mode_toggle')}
            title={t('dark_mode_toggle')}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>

          {/* Mobile Menu Button */}
          <button 
            className={`mobile-menu-btn ${mobileMenuOpen ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={t('a11y_menu')}
            aria-expanded={mobileMenuOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="mobile-nav">
            {navItems.map(item => (
              <button key={item.id} onClick={() => go(item.id)}>
                {t(item.key)}
              </button>
            ))}
            <button className="donate-btn" onClick={() => go('donasi')}>
              {t('nav_donate')}
            </button>
          </nav>
        )}
      </header>

      {active === 'home' ? 
        <Home d={d} go={go} logo={logo} t={t} /> : 
        <Page active={active} d={d} p={p} go={go} search={search} setSearch={setSearch} articles={articles} logo={logo} t={t} />
      }

      <footer id="kontak">
        <div>
          <img src={logo} alt={p.name || 'Logo Yayasan'} loading="lazy" />
          <h3>{p.name || t('nav_home')}</h3>
          <p>{p.short_description}</p>
        </div>
        <div>
          <b>{t('nav_contact')}</b>
          <p>{p.address || t('contact_address_placeholder')}</p>
          <p>{p.phone}</p>
          <p>{p.email}</p>
        </div>
        <div>
          <b>{t('nav_programs')}</b>
          <button onClick={() => go('pesantren')}>{t('Pesantren')}</button>
          <button onClick={() => go('pendidikan')}>{t('nav_education')}</button>
          <button onClick={() => go('koperasi')}>{t('nav_coop')}</button>
        </div>
      </footer>
    </>
  );
}
function Home({d,go,logo}){return <><section className="hero"><div><span className="eyebrow">YAYASAN · PENDIDIKAN ISLAM · PEMBERDAYAAN</span><h1>{d.profile.name||'Yayasan Bina Tandang Nurul Falah'}</h1><p>{d.profile.short_description||'Membangun generasi Qurani, berilmu, berakhlak mulia, mandiri, dan bermanfaat bagi umat.'}</p><div className="actions"><button onClick={()=>go('profil')}>Kenal Lebih Dekat →</button><button className="ghost" onClick={()=>go('program')}>Lihat Program</button></div></div><div className="hero-logo"><img src={logo}/></div></section><section className="container"><Title e="PROGRAM YAYASAN" h="Tiga pilar yang tumbuh bersama." t="Yayasan menaungi pesantren, pendidikan, dan koperasi sebagai ekosistem pembinaan yang saling menguatkan."/><div className="cards three">{['pondok-pesantren','pendidikan','koperasi-pesantren'].map(s=><article className="unit-card" key={s}><span className="unit-icon">{s[0]==='p'&&s!=='pendidikan'?'🕌':s==='pendidikan'?'🎓':'🛒'}</span><small>{d.units.find(u=>u.slug===s)?.name}</small><h3>{d.profiles.find(x=>x.unit_id===d.units.find(u=>u.slug===s)?.id)?.tagline||d.units.find(u=>u.slug===s)?.description}</h3><button onClick={()=>go(s==='pondok-pesantren'?'pesantren':s.split('-')[0])}>Lihat unit →</button></article>)}</div></section><section className="container"><Title e="KEGIATAN" h="Aktivitas lintas unit."/><div className="cards two">{d.events.slice(0,4).map(e=><article className="content-card" key={e.id}><small>{new Date(e.start_at).toLocaleDateString('id-ID',{dateStyle:'long'})} · {e.units?.name||'Yayasan'}</small><h3>{e.title}</h3><p>{e.description}</p></article>)}</div><button className="link" onClick={()=>go('kegiatan')}>Lihat semua kegiatan →</button></section><section className="container"><Title e="PUBLIKASI" h="Berita & wawasan Islam."/><div className="cards three">{d.articles.slice(0,3).map(a=><article className="content-card" key={a.id}>{a.cover_image_url&&<img src={a.cover_image_url}/>}<small>{a.article_categories?.name||'Artikel'} · {a.units?.name||'Yayasan'}</small><h3>{a.title}</h3><p>{a.subtitle||a.content.slice(0,130)+'…'}</p></article>)}</div><button className="link" onClick={()=>go('artikel')}>Baca semua artikel →</button></section></>}
function Title({e,h,t}){return <div className="title"><span className="eyebrow">{e}</span><h2>{h}</h2>{t&&<p>{t}</p>}</div>}
function Page({active,d,p,go,search,setSearch,articles,logo}){const labels={profil:['PROFIL YAYASAN','Tentang Yayasan Bina Tandang Nurul Falah'],program:['PROGRAM YAYASAN','Tiga unit utama dalam ekosistem yayasan.'],pesantren:['PONDOK PESANTREN','Pendidikan, pembinaan, dan kehidupan santri.'],pendidikan:['PENDIDIKAN','Pendidikan formal dan pengembangan peserta didik.'],koperasi:['KOPERASI PESANTREN','Produk dan pemberdayaan ekonomi pesantren.'],kegiatan:['KEGIATAN','Agenda lintas yayasan dan unit.'],artikel:['BERITA & ARTIKEL','Publikasi, pengumuman, dan wawasan.'],kontak:['KONTAK','Hubungi Yayasan Bina Tandang Nurul Falah.']};const [e,h]=labels[active]||labels.profil;return <main className="container page"><button className="back" onClick={()=>go('home')}>← Beranda</button><Title e={e} h={h}/>{active==='profil'&&<div className="rich"><p>{p.full_description||p.short_description}</p><div className="cards two"><article><span className="eyebrow">VISI</span><p>{p.vision||'—'}</p></article><article><span className="eyebrow">MISI</span><p>{p.mission||'—'}</p></article></div></div>}{active==='program'&&<div className="cards three">{['pondok-pesantren','pendidikan','koperasi-pesantren'].map(s=><article className="unit-card" key={s}><h3>{d.units.find(u=>u.slug===s)?.name}</h3><p>{d.units.find(u=>u.slug===s)?.description}</p><button onClick={()=>go(s==='pondok-pesantren'?'pesantren':s.split('-')[0])}>Buka unit →</button></article>)}</div>}{['pesantren','pendidikan','koperasi'].includes(active)&&<UnitPage active={active} d={d} logo={logo}/>} {active==='kegiatan'&&<div className="cards two">{d.events.map(e=><article className="content-card" key={e.id}><small>{new Date(e.start_at).toLocaleString('id-ID',{dateStyle:'long',timeStyle:'short'})} · {e.units?.name||'Yayasan'}</small><h3>{e.title}</h3><p>{e.description}</p><b>{e.location||'Lokasi diumumkan kemudian'}</b></article>)}</div>}{active==='artikel'&&<><input className="search" value={search} onChange={x=>setSearch(x.target.value)} placeholder="Cari artikel…"/><div className="cards three">{articles.map(a=><article className="content-card" key={a.id}>{a.cover_image_url&&<img src={a.cover_image_url}/>}<small>{a.article_categories?.name||'Artikel'} · {a.units?.name||'Yayasan'}</small><h3>{a.title}</h3><p>{a.subtitle||a.content.slice(0,160)+'…'}</p></article>)}</div></>}{active==='kontak'&&<div className="contact-grid"><div><h3>Alamat</h3><p>{p.address||'Belum diatur'}</p></div><div><h3>Telepon / WhatsApp</h3><p>{p.phone||'Belum diatur'}</p></div><div><h3>Email</h3><p>{p.email||'Belum diatur'}</p></div></div>}</main>}
function UnitPage({active,d,logo}){const slug=active==='pesantren'?'pondok-pesantren':active==='pendidikan'?'pendidikan':'koperasi-pesantren',u=d.units.find(x=>x.slug===slug),up=d.profiles.find(x=>x.unit_id===u?.id);return <div className="unit-page"><div className="rich"><p>{up?.full_description||up?.short_description||u?.description}</p><div className="cards two"><article><span className="eyebrow">VISI</span><p>{up?.vision||'—'}</p></article><article><span className="eyebrow">MISI</span><p>{up?.mission||'—'}</p></article></div></div>{active==='pendidikan'&&<><h2>Unit pendidikan</h2><div className="cards three">{d.education.map(x=><article className="content-card" key={x.id}><small>{x.level||'Pendidikan'}</small><h3>{x.name}</h3><p>{x.description}</p></article>)}</div></>}{active==='pesantren'&&<><h2>Program pesantren</h2><div className="cards three">{d.programs.filter(x=>x.units?.slug===slug).map(x=><article className="content-card" key={x.id}><small>{x.program_categories?.name||'Program'}</small><h3>{x.title}</h3><p>{x.short_description}</p></article>)}</div></>}{active==='koperasi'&&<><h2>Produk koperasi</h2><div className="cards three">{d.products.map(x=><article className="product"><img src={x.image_url||logo}/><small>{x.product_categories?.name||'Produk'}</small><h3>{x.name}</h3><p>{x.short_description}</p><b>{money(x.price)} / {x.unit_label||'pcs'}</b></article>)}</div></>}</div>}
createRoot(document.getElementById('root')).render(<App/>);
