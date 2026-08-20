# Supabase Configuration Guide

## 1. Setup Supabase Project

### Langkah 1: Buat Project di Supabase
1. Kunjungi [supabase.com](https://supabase.com)
2. Login/Register dengan GitHub/Email
3. Klik "New Project"
4. Isi detail project:
   - **Name**: `yayasan-nurul-falah`
   - **Database Password**: (simpan dengan aman)
   - **Region**: Pilih yang terdekat (Asia Southeast)

### Langkah 2: Dapatkan Credentials
Setelah project dibuat:
1. Masuk ke **Settings** → **API**
2. Copy nilai berikut:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon/Public Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Langkah 3: Buat Environment Variables
Buat file `.env.local` di root project:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

⚠️ **PENTING**: Jangan commit `.env.local` ke Git! Sudah ada di `.gitignore`.

---

## 2. Database Schema

Jalankan SQL berikut di **Supabase SQL Editor**:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabel Articles
CREATE TABLE articles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  category VARCHAR(100),
  author_name VARCHAR(100),
  author_title VARCHAR(100),
  image_url TEXT,
  featured BOOLEAN DEFAULT false,
  published BOOLEAN DEFAULT true,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel Donations
CREATE TABLE donations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  donor_name VARCHAR(255) NOT NULL,
  donor_email VARCHAR(255),
  donor_phone VARCHAR(50),
  amount DECIMAL(12, 2) NOT NULL,
  message TEXT,
  campaign_type VARCHAR(100),
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  transaction_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel Programs
CREATE TABLE programs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  long_description TEXT,
  target_amount DECIMAL(12, 2),
  current_amount DECIMAL(12, 2) DEFAULT 0,
  beneficiary_count INTEGER DEFAULT 0,
  image_url TEXT,
  category VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel Testimonials
CREATE TABLE testimonials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(100),
  content TEXT NOT NULL,
  avatar_url TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel Contact Messages
CREATE TABLE contact_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  subject VARCHAR(255),
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'unread',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel Admin Users (untuk CMS)
CREATE TABLE admin_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'editor',
  avatar_url TEXT,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes untuk performa
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_featured ON articles(featured);
CREATE INDEX idx_articles_published ON articles(published);
CREATE INDEX idx_programs_status ON programs(status);
CREATE INDEX idx_donations_status ON donations(payment_status);
CREATE INDEX idx_contact_status ON contact_messages(status);

-- Row Level Security (RLS) Policies
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy: Public can read published articles
CREATE POLICY "Public can read published articles" ON articles
  FOR SELECT USING (published = true);

-- Policy: Public can read active programs
CREATE POLICY "Public can read active programs" ON programs
  FOR SELECT USING (status = 'active');

-- Policy: Public can read testimonials
CREATE POLICY "Public can read testimonials" ON testimonials
  FOR SELECT USING (true);

-- Policy: Anyone can insert donations
CREATE POLICY "Anyone can insert donations" ON donations
  FOR INSERT WITH CHECK (true);

-- Policy: Anyone can insert contact messages
CREATE POLICY "Anyone can insert contact messages" ON contact_messages
  FOR INSERT WITH CHECK (true);

-- Policy: Authenticated users can manage all (for CMS)
CREATE POLICY "Authenticated users can manage all" ON articles
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage programs" ON programs
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage testimonials" ON testimonials
  FOR ALL USING (auth.role() = 'authenticated');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating updated_at
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 3. Storage Buckets

Jalankan di **Supabase SQL Editor** atau buat via Dashboard:

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('article-images', 'article-images', true),
  ('program-images', 'program-images', true),
  ('testimonials', 'testimonials', true),
  ('admin-avatars', 'admin-avatars', true);

-- Set policies for public read access
CREATE POLICY "Public Access" ON storage.objects FOR SELECT
  USING (bucket_id IN ('article-images', 'program-images', 'testimonials'));

CREATE POLICY "Auth Upload" ON storage.objects FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Auth Update" ON storage.objects FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Auth Delete" ON storage.objects FOR DELETE
  USING (auth.role() = 'authenticated');
```

---

## 4. Edge Functions (Optional)

### Install Supabase CLI
```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-ref
```

### Contoh Edge Function: Send Email Notification

Buat folder `supabase/functions/send-notification`:

```typescript
// supabase/functions/send-notification/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { type, data } = await req.json();
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Handle different notification types
    if (type === 'new_donation') {
      // Send email via Resend/SendGrid/etc
      console.log('New donation received:', data);
      // TODO: Integrate with email service
    }

    if (type === 'contact_message') {
      console.log('New contact message:', data);
      // TODO: Send notification to admin
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
```

Deploy function:
```bash
supabase functions deploy send-notification
```

---

## 5. Seed Data (Optional)

Jalankan di **SQL Editor** untuk mengisi data awal:

```sql
-- Insert sample articles
INSERT INTO articles (title, slug, excerpt, content, category, author_name, author_title, featured) VALUES
('Program Beasiswa Santri Berprestasi', 'beasiswa-santri-berprestasi', 'Membantu santri berprestasi melanjutkan pendidikan...', '<p>Konten lengkap artikel...</p>', 'Pendidikan', 'Ahmad Fauzi', 'Direktur Yayasan', true),
('Laporan Keuangan Transparan 2024', 'laporan-keuangan-2024', 'Transparansi penggunaan dana donasi...', '<p>Konten lengkap artikel...</p>', 'Laporan', 'Siti Aminah', 'Bendahara', false),
('Kegiatan Ramadhan Bersama Yatim', 'ramadhan-bersama-yatim', 'Berbagi kebahagiaan di bulan suci...', '<p>Konten lengkap artikel...</p>', 'Kegiatan', 'Hasan Abdullah', 'Koordinator Program', true);

-- Insert sample programs
INSERT INTO programs (title, slug, description, target_amount, current_amount, beneficiary_count, category, status) VALUES
('Beasiswa 1000 Santri', 'beasiswa-1000-santri', 'Memberikan beasiswa penuh untuk 1000 santri yatim', 500000000, 125000000, 250, 'Pendidikan', 'active'),
('Bangun Asrama Putri', 'bangun-asrama-putri', 'Pembangunan asrama untuk santri putri', 300000000, 75000000, 0, 'Infrastruktur', 'active'),
('Sedekah Jum''at Berkah', 'sedekah-jumat-berkah', 'Program rutin setiap jumat untuk dhuafa', 50000000, 12000000, 150, 'Sosial', 'active');

-- Insert sample testimonials
INSERT INTO testimonials (name, role, content, rating) VALUES
('Muhammad Rizki', 'Alumni Santri', 'Alhamdulillah berkat beasiswa dari yayasan, saya bisa lulus dari pondok dan sekarang kuliah di UGM.', 5),
('Fatimah Zahra', 'Donatur Tetap', 'Saya percaya dengan transparansi yayasan ini. Setiap laporan jelas dan bisa dipertanggungjawabkan.', 5),
('Usman bin Affan', 'Orang Tua Santri', 'Terima kasih atas perhatian kepada anak kami. Akhlaknya semakin baik, hafalan Quran juga bertambah.', 5);
```

---

## 6. Next Steps

Setelah setup selesai:

1. ✅ Update `.env.local` dengan credentials
2. ✅ Jalankan SQL schema di Supabase Dashboard
3. ✅ Buat storage buckets
4. ✅ Test koneksi dengan component yang sudah disediakan
5. ✅ (Optional) Deploy edge functions
6. ✅ (Optional) Isi seed data

Untuk integrasi dengan React components, file `src/lib/supabase.js` sudah siap digunakan!

🎉 **Selamat! Supabase Anda sudah siap digunakan!**
