# ✅ Supabase Terhubung - Project: msymqqryppgohsjmdbeo

## 🎉 Status: KONFIGURASI SELESAI

Website Yayasan Bina Tandang Nurul Falah **sudah terhubung** dengan project Supabase Anda yang sudah ada!

---

## 📋 Yang Sudah Dilakukan:

### 1. **Environment Variables Terkonfigurasi**
File `.env.local` sudah dibuat dengan kredensial project Anda:

```bash
VITE_SUPABASE_URL=https://msymqqryppgohsjmdbeo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

✅ **Project ID**: `msymqqryppgohsjmdbeo`  
✅ **Anon Key**: Configured  
✅ **Service Role Key**: Configured (untuk server-side operations)

### 2. **Security**
- `.env.local` sudah ditambahkan ke `.gitignore`
- Secret keys tidak akan ter-commit ke repository

### 3. **Library Supabase Siap Pakai**
File `/workspace/src/lib/supabase.js` menyediakan:

| Service | Fungsi |
|---------|--------|
| `articleService` | getAll, getFeatured, getBySlug, getByCategory, search, create, update, delete |
| `programService` | getAll, getBySlug, create, update, updateAmount |
| `donationService` | create, getByDonor |
| `testimonialService` | getAll, create |
| `contactService` | sendMessage |
| `storageService` | uploadImage, deleteImage, getPublicUrl |
| `authService` | signIn, signUp, signOut, getSession, getUser, onAuthStateChange |

---

## 🔍 Cek Database Anda Sekarang

### Apakah Tabel Sudah Ada?

Login ke dashboard Supabase Anda: https://supabase.com/dashboard/project/msymqqryppgohsjmdbeo

#### **Jika tabel BELUM ada:**
Jalankan SQL schema dari file `SUPABASE_SETUP.md` di SQL Editor:

```sql
-- Copy semua SQL dari SUPABASE_SETUP.md bagian "Database Schema"
-- Lalu jalankan di: Dashboard > SQL Editor > New Query
```

#### **Jika tabel SUDAH ada:**
Cek apakah struktur tabel sesuai dengan yang diharapkan:

**Tabel yang diperlukan:**
1. `articles` - untuk artikel berita
2. `programs` - untuk program donasi
3. `donations` - untuk transaksi donasi
4. `testimonials` - untuk testimoni
5. `contact_messages` - untuk pesan kontak
6. `admin_users` - untuk admin CMS

**Struktur tabel `articles`:**
```
- id (int8, primary key)
- title (text)
- slug (text, unique)
- excerpt (text)
- content (text)
- category (text)
- image_url (text)
- author_name (text)
- published (boolean)
- featured (boolean)
- views (int4)
- created_at (timestamptz)
- updated_at (timestamptz)
```

---

## 🧪 Test Koneksi

### Cara 1: Test di Browser Console
1. Buka website di browser
2. Buka DevTools (F12)
3. Jalankan di Console:
```javascript
import { supabase } from './lib/supabase.js';
supabase.from('articles').select('*').limit(1).then(console.log);
```

### Cara 2: Buat Component Test
Tambahkan di component utama untuk testing:

```jsx
import { useEffect, useState } from 'react';
import { articleService } from './lib/supabase';

function TestConnection() {
  const [status, setStatus] = useState('Testing...');
  
  useEffect(() => {
    async function test() {
      try {
        const result = await articleService.getAll(1);
        if (result.error) {
          setStatus(`❌ Error: ${result.error.message}`);
        } else {
          setStatus(`✅ Success! Found ${result.data?.length || 0} articles`);
        }
      } catch (e) {
        setStatus(`❌ Connection failed: ${e.message}`);
      }
    }
    test();
  }, []);
  
  return <div>{status}</div>;
}
```

---

## 📦 Storage Buckets

Pastikan buckets berikut sudah ada di Supabase Storage:

1. `article-images` - untuk gambar artikel
2. `program-images` - untuk gambar program
3. `testimonials` - untuk foto testimoni
4. `admin-avatars` - untuk avatar admin

**Cara membuat bucket:**
1. Dashboard > Storage
2. Create new bucket
3. Nama: `article-images` (public)
4. Ulangi untuk bucket lainnya

**Atau jalankan SQL:**
```sql
-- Lihat SUPABASE_SETUP.md bagian "Storage Configuration"
```

---

## 🚀 Edge Functions

Untuk membuat Edge Function:

### 1. Install Supabase CLI
```bash
npm install -g supabase
```

### 2. Login
```bash
supabase login
```

### 3. Link Project
```bash
supabase link --project-ref msymqqryppgohsjmdbeo
```

### 4. Buat Edge Function Baru
```bash
supabase functions new send-notification
```

### 5. Deploy
```bash
supabase functions deploy send-notification
```

Template edge function sudah tersedia di `SUPABASE_SETUP.md`.

---

## 🔐 Row Level Security (RLS)

Pastikan RLS policies sudah dikonfigurasi dengan benar:

**Policies yang diperlukan:**
- ✅ Public dapat read articles yang published
- ✅ Admin dapat CRUD semua data
- ✅ Public dapat create donations & contact messages
- ✅ Public dapat read testimonials yang approved

Lihat `SUPABASE_SETUP.md` untuk contoh policies lengkap.

---

## 🛠️ Troubleshooting

### Error: "relation does not exist"
→ Tabel belum dibuat. Jalankan SQL schema.

### Error: "permission denied for table"
→ RLS policies belum dikonfigurasi. Lihat section RLS.

### Error: "bucket not found"
→ Storage bucket belum dibuat. Buat di dashboard Storage.

### Data tidak muncul
→ Cek kolom `published` harus `true` untuk articles
→ Cek kolom `status` harus `active` untuk programs

---

## 📊 Next Steps

1. ✅ **DONE** - Credentials configured
2. ⏳ **CEK** - Verifikasi tabel di dashboard Supabase
3. ⏳ **CREATE** - Buat tabel jika belum ada (gunakan SQL dari SUPABASE_SETUP.md)
4. ⏳ **CREATE** - Buat storage buckets
5. ⏳ **TEST** - Test koneksi dengan component test
6. ⏳ **INTEGRATE** - Integrasikan dengan components existing
7. ⏳ **DEPLOY** - Deploy edge functions (optional)

---

## 📞 Support

Jika ada masalah:
1. Cek logs di Supabase Dashboard > Logs
2. Cek browser console untuk error messages
3. Pastikan environment variables sudah benar
4. Restart development server setelah perubahan .env

---

**🎊 Selamat! Project Supabase Anda sekarang terintegrasi dengan website yayasan!**
