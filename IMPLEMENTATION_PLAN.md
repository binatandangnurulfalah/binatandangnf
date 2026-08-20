# 📋 RENCANA UPDATE BERTAHAP - YAYASAN BINATANDANG NF

Berdasarkan audit lengkap, berikut adalah rencana update yang diklasifikasikan berdasarkan prioritas dan tahapan implementasi.

---

## 🎯 ROADMAP IMPLEMENTASI

### **FASE 1: CRITICAL FIXES** (Hari 1-3)
*Status: Harus segera dilakukan sebelum production*

#### 1.1 Ganti Konten DEMO dengan Konten Asli 🔴
**File**: Admin CMS (`/admin.html`)  
**Effort**: 2-4 jam  
**Impact**: HIGH

**Checklist**:
- [ ] Update 5 artikel DEMO → konten asli yayasan
- [ ] Ganti judul artikel (hapus prefix `[DEMO]`)
- [ ] Update events dengan agenda nyata
- [ ] Tambah minimal 1 pengumuman aktif
- [ ] Upload cover images untuk gallery albums
- [ ] Verifikasi semua link social media

**Cara**:
```bash
1. Buka https://yayasan-binatandang.vercel.app/admin.html
2. Login dengan kredensial admin
3. Navigasi ke tab "Artikel"
4. Edit setiap artikel → ganti konten
5. Simpan dan preview
```

---

#### 1.2 Security Hardening - RLS Policies 🔴
**File**: Supabase SQL Editor  
**Effort**: 1 jam  
**Impact**: HIGH

**SQL Script** (jalankan di Supabase Dashboard → SQL Editor):

```sql
-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

-- Articles
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published articles"
ON articles FOR SELECT
USING (published = true);

CREATE POLICY "Admins can manage all articles"
ON articles FOR ALL
USING (auth.uid() IN (
  SELECT user_id FROM admin_users WHERE is_admin = true
));

-- Programs
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active programs"
ON programs FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage all programs"
ON programs FOR ALL
USING (auth.uid() IN (
  SELECT user_id FROM admin_users WHERE is_admin = true
));

-- Events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published events"
ON events FOR SELECT
USING (is_published = true);

CREATE POLICY "Admins can manage all events"
ON events FOR ALL
USING (auth.uid() IN (
  SELECT user_id FROM admin_users WHERE is_admin = true
));

-- Announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active announcements"
ON announcements FOR SELECT
USING (is_active = true AND 
       (start_date IS NULL OR start_date <= NOW()) AND
       (end_date IS NULL OR end_date >= NOW()));

CREATE POLICY "Admins can manage all announcements"
ON announcements FOR ALL
USING (auth.uid() IN (
  SELECT user_id FROM admin_users WHERE is_admin = true
));

-- Gallery Albums
ALTER TABLE gallery_albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published albums"
ON gallery_albums FOR SELECT
USING (is_published = true);

CREATE POLICY "Admins can manage all albums"
ON gallery_albums FOR ALL
USING (auth.uid() IN (
  SELECT user_id FROM admin_users WHERE is_admin = true
));

-- Foundation Profile (read-only for public)
ALTER TABLE foundation_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view foundation profile"
ON foundation_profile FOR SELECT
USING (true);

CREATE POLICY "Admins can update foundation profile"
ON foundation_profile FOR UPDATE
USING (auth.uid() IN (
  SELECT user_id FROM admin_users WHERE is_admin = true
));

-- Site Settings
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view site settings"
ON site_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can manage site settings"
ON site_settings FOR ALL
USING (auth.uid() IN (
  SELECT user_id FROM admin_users WHERE is_admin = true
));

-- Contact Messages (admin only)
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view contact messages"
ON contact_messages FOR SELECT
USING (auth.uid() IN (
  SELECT user_id FROM admin_users WHERE is_admin = true
));

CREATE POLICY "Public can send contact messages"
ON contact_messages FOR INSERT
WITH CHECK (true);

-- ============================================
-- VERIFY ADMIN FUNCTION EXISTS
-- ============================================

-- Cek apakah function is_admin() ada
-- Jika belum, buat function berikut:

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_programs_active ON programs(is_active);
CREATE INDEX IF NOT EXISTS idx_events_published ON events(is_published);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_gallery_published ON gallery_albums(is_published);
```

**Testing**:
```bash
# Test anonymous access (should work for published content)
curl "https://msymqqryppgohsjmdbeo.supabase.co/rest/v1/articles?published=eq.true" \
  -H "apikey: YOUR_ANON_KEY"

# Test without auth (should fail for write operations)
curl -X POST "https://msymqqryppgohsjmdbeo.supabase.co/rest/v1/articles" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"title":"Test"}'
# Should return: "new row violates row-level security policy"
```

---

#### 1.3 Verify Admin Authentication 🔴
**File**: `/src/admin.jsx`, Supabase Database  
**Effort**: 30 menit  
**Impact**: HIGH

**Checklist**:
- [ ] Pastikan tabel `admin_users` ada di database
- [ ] Verifikasi function `is_admin()` bisa dipanggil
- [ ] Test login dengan akun admin
- [ ] Test akses tanpa login (harus redirect ke login)

**Verification Query**:
```sql
-- Cek tabel admin_users
SELECT * FROM admin_users;

-- Cek function is_admin
SELECT is_admin(); -- Harus return true jika logged in sebagai admin
```

---

### **FASE 2: PERFORMANCE & UX** (Minggu 1-2)
*Status: Penting untuk user experience*

#### 2.1 Lazy Loading Images 🟡
**File**: `/src/public.jsx`  
**Effort**: 1 jam  
**Impact**: MEDIUM

**Implementation**:
```jsx
// Di public.jsx, tambahkan loading="lazy" ke semua img tags:

// Hero section
<img src={logoUrl} alt={`Logo ${name}`} loading="lazy" />

// Article cards
{a.cover_image_url && (
  <img 
    src={a.cover_image_url} 
    alt="" 
    className="article-thumbnail"
    loading="lazy"
  />
)}

// Program cards
{p.image_url && (
  <img src={p.image_url} alt="" loading="lazy" />
)}

// Event cards
{e.image_url && (
  <img src={e.image_url} alt="" loading="lazy" />
)}

// Gallery
{cover && (
  <img src={cover} alt="" loading="lazy" />
)}
```

---

#### 2.2 Pagination untuk Artikel 🟡
**File**: `/src/public.jsx`  
**Effort**: 2 jam  
**Impact**: MEDIUM

**Implementation**:
```jsx
// Tambahkan state baru
const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 9;

// Hitung pagination
const totalPages = Math.ceil(filtered.length / itemsPerPage);
const paginatedArticles = filtered.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
);

// Reset page saat filter berubah
useEffect(() => {
  setCurrentPage(1);
}, [query, category]);

// Render pagination controls
{totalPages > 1 && (
  <div className="pagination">
    <button 
      onClick={() => setCurrentPage(p => p - 1)}
      disabled={currentPage === 1}
    >
      ← Prev
    </button>
    <span>Page {currentPage} of {totalPages}</span>
    <button 
      onClick={() => setCurrentPage(p => p + 1)}
      disabled={currentPage === totalPages}
    >
      Next →
    </button>
  </div>
)}
```

**CSS**:
```css
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
  padding: 1rem;
}

.pagination button {
  padding: 0.5rem 1rem;
  border: 1px solid var(--forest-green);
  background: white;
  color: var(--forest-green);
  border-radius: 8px;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

---

#### 2.3 Bundle Size Optimization 🟡
**File**: Build config, CSS files  
**Effort**: 3-4 jam  
**Impact**: MEDIUM

**Actions**:
1. **Analyze bundle**:
```bash
npm run build -- --statsfile stats.json
npx vite-bundle-visualizer
```

2. **Split CSS**:
   - Pindahkan critical CSS ke inline
   - Load non-critical CSS asynchronously

3. **Tree shaking**:
   - Pastikan hanya code yang digunakan yang di-bundle
   - Remove unused CSS classes

4. **Code splitting**:
   - Split vendor chunks
   - Lazy load heavy components

---

#### 2.4 SEO Meta Tags 🟡
**File**: `/src/public.jsx`, `index.html`  
**Effort**: 1-2 jam  
**Impact**: HIGH

**Implementation di index.html**:
```html
<head>
  <!-- Primary Meta Tags -->
  <title>Yayasan Bina Tandang Nurul Falah - Pendidikan Islam Berkualitas</title>
  <meta name="title" content="Yayasan Bina Tandang Nurul Falah" />
  <meta name="description" content="Membina generasi Qurani, berilmu, dan berakhlak mulia melalui pendidikan Islam berkualitas di Sumedang." />
  <meta name="keywords" content="yayasan islam, pondok pesantren, pendidikan islam, sumedang, tahfiz, RA nurul falah" />
  <meta name="author" content="Yayasan Bina Tandang Nurul Falah" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://yayasan-binatandang.vercel.app/" />
  <meta property="og:title" content="Yayasan Bina Tandang Nurul Falah" />
  <meta property="og:description" content="Membina generasi Qurani, berilmu, dan berakhlak mulia." />
  <meta property="og:image" content="https://yayasan-binatandang.vercel.app/og-image.jpg" />
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:url" content="https://yayasan-binatandang.vercel.app/" />
  <meta property="twitter:title" content="Yayasan Bina Tandang Nurul Falah" />
  <meta property="twitter:description" content="Membina generasi Qurani, berilmu, dan berakhlak mulia." />
  <meta property="twitter:image" content="https://yayasan-binatandang.vercel.app/og-image.jpg" />
  
  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  
  <!-- Canonical -->
  <link rel="canonical" href="https://yayasan-binatandang.vercel.app/" />
  
  <!-- Robots -->
  <meta name="robots" content="index, follow" />
</head>
```

**Dynamic Meta Updates di React**:
```jsx
useEffect(() => {
  // Update title when article selected
  if (selected) {
    document.title = `${selected.title} - Yayasan Bina Tandang Nurul Falah`;
    
    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', selected.subtitle || selected.excerpt);
    }
  } else {
    document.title = 'Yayasan Bina Tandang Nurul Falah';
  }
}, [selected]);
```

---

### **FASE 3: ENHANCEMENTS** (Minggu 3-4)
*Status: Sebaiknya ditambahkan untuk kualitas lebih baik*

#### 3.1 Analytics Setup 🟢
**Effort**: 1 jam  
**Impact**: MEDIUM

**Options**:
1. **Google Analytics** (Free):
```html
<!-- Add to index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

2. **Plausible Analytics** (Privacy-focused, Paid):
```html
<script defer data-domain="yayasan-binatandang.vercel.app" src="https://plausible.io/js/script.js"></script>
```

3. **Supabase Edge Function** (Custom):
```javascript
// Track page views in database
await supabase.from('page_views').insert({
  path: window.location.pathname,
  referrer: document.referrer,
  user_agent: navigator.userAgent
});
```

---

#### 3.2 Sitemap.xml 🟢
**Effort**: 30 menit  
**Impact**: MEDIUM

**Generate sitemap** (manual atau script):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://yayasan-binatandang.vercel.app/</loc>
    <lastmod>2026-08-20</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://yayasan-binatandang.vercel.app/#profil</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <!-- Add more URLs -->
</urlset>
```

**Submit to Google Search Console**:
1. Buat akun di https://search.google.com/search-console
2. Verifikasi ownership domain
3. Submit sitemap.xml

---

#### 3.3 Error Monitoring 🟢
**Effort**: 2 jam  
**Impact**: MEDIUM

**Sentry Setup**:
```bash
npm install @sentry/react @sentry/tracing
```

```jsx
// src/main.jsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  integrations: [
    new Sentry.BrowserTracing(),
  ],
  tracesSampleRate: 1.0,
  environment: "production"
});

// Error boundary
<Sentry.ErrorBoundary fallback={<p>Error occurred</p>}>
  <App />
</Sentry.ErrorBoundary>
```

---

### **FASE 4: ADVANCED FEATURES** (Month 2+)
*Status: Nice to have untuk future development*

#### 4.1 Dark Mode 🔵
**Effort**: 4-6 jam  
**Impact**: LOW-MEDIUM

**Implementation**:
```css
/* In style.css */
:root {
  --bg-primary: #ffffff;
  --text-primary: #1a1a1a;
  /* ... light mode colors */
}

[data-theme="dark"] {
  --bg-primary: #1a1a1a;
  --text-primary: #ffffff;
  /* ... dark mode colors */
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg-primary: #1a1a1a;
    --text-primary: #ffffff;
  }
}
```

```jsx
// Toggle button
const [theme, setTheme] = useState('light');

useEffect(() => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}, [theme]);
```

---

#### 4.2 Progressive Web App (PWA) 🔵
**Effort**: 6-8 jam  
**Impact**: MEDIUM

**Steps**:
1. Add manifest.json
2. Create service worker
3. Add install prompt
4. Test offline functionality

---

#### 4.3 Multi-language Support 🔵
**Effort**: 8-12 jam  
**Impact**: LOW

**Libraries**:
- react-i18next
- FormatJS

---

## 📊 TRACKING PROGRESS

### Template Progress Tracker:

```markdown
## Progress Update - [DATE]

### Completed:
- [ ] Task 1
- [ ] Task 2

### In Progress:
- [ ] Task 3

### Blocked:
- [ ] Task 4 (reason)

### Next Steps:
1. ...
2. ...
```

---

## 🎯 SUCCESS METRICS

Setelah semua implementasi, targetkan:

| Metric | Current | Target | Tool |
|--------|---------|--------|------|
| Lighthouse Performance | ? | 90+ | Chrome DevTools |
| Lighthouse Accessibility | ? | 95+ | Chrome DevTools |
| Lighthouse SEO | ? | 95+ | Chrome DevTools |
| First Contentful Paint | ? | <1.5s | PageSpeed Insights |
| Time to Interactive | ? | <3.5s | PageSpeed Insights |
| Bundle Size (gzipped) | 138 KB | <100 KB | Vite build |
| RLS Coverage | 0% | 100% | Supabase dashboard |
| Demo Content | 100% | 0% | Manual check |

---

## 📞 SUPPORT & DOCUMENTATION

- **Supabase Docs**: https://supabase.com/docs
- **React Docs**: https://react.dev
- **Vite Docs**: https://vitejs.dev
- **Web.dev**: https://web.dev (performance best practices)

---

**Last Updated**: 2026-08-20  
**Version**: 1.0  
**Status**: Ready for Implementation
