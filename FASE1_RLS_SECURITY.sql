-- ============================================
-- FASE 1: SECURITY - ROW LEVEL SECURITY (RLS)
-- ============================================
-- Jalankan script ini di Supabase SQL Editor
-- untuk mengaktifkan keamanan database

-- 1. ENABLE RLS PADA SEMUA TABEL
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE foundation_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- 2. POLICIES UNTUK PUBLIC ACCESS (READ-ONLY)
-- Articles: Public bisa baca, admin bisa tulis
CREATE POLICY "Public can view articles" ON articles
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage articles" ON articles
  FOR ALL 
  USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- Programs: Public bisa baca, admin bisa tulis
CREATE POLICY "Public can view programs" ON programs
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage programs" ON programs
  FOR ALL 
  USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- Events: Public bisa baca, admin bisa tulis
CREATE POLICY "Public can view events" ON events
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage events" ON events
  FOR ALL 
  USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- Testimonials: Public bisa baca, admin bisa tulis
CREATE POLICY "Public can view testimonials" ON testimonials
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage testimonials" ON testimonials
  FOR ALL 
  USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- Contact Messages: Hanya admin yang bisa baca
CREATE POLICY "Admins can view contact messages" ON contact_messages
  FOR ALL 
  USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- Foundation Profile: Public bisa baca, admin bisa update
CREATE POLICY "Public can view foundation profile" ON foundation_profile
  FOR SELECT USING (true);

CREATE POLICY "Admins can update foundation profile" ON foundation_profile
  FOR UPDATE 
  USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- Site Settings: Public bisa baca, admin bisa update
CREATE POLICY "Public can view site settings" ON site_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can update site settings" ON site_settings
  FOR ALL 
  USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- Categories: Public bisa baca, admin bisa tulis
CREATE POLICY "Public can view article categories" ON article_categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage article categories" ON article_categories
  FOR ALL 
  USING (auth.uid() IN (SELECT user_id FROM admin_users));

CREATE POLICY "Public can view program categories" ON program_categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage program categories" ON program_categories
  FOR ALL 
  USING (auth.uid() IN (SELECT user_id FROM admin_users));

CREATE POLICY "Public can view event categories" ON event_categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage event categories" ON event_categories
  FOR ALL 
  USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- Gallery Albums: Public bisa baca, admin bisa tulis
CREATE POLICY "Public can view gallery albums" ON gallery_albums
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage gallery albums" ON gallery_albums
  FOR ALL 
  USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- Announcements: Public bisa baca, admin bisa tulis
CREATE POLICY "Public can view announcements" ON announcements
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage announcements" ON announcements
  FOR ALL 
  USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- 3. POLICIES UNTUK ADMIN_USERS TABEL
CREATE POLICY "Admin users can view admin_users" ON admin_users
  FOR SELECT 
  USING (auth.uid() IN (SELECT user_id FROM admin_users));

CREATE POLICY "Service role can manage admin_users" ON admin_users
  FOR ALL 
  USING (auth.jwt()->>'role' = 'service_role');

-- 4. BUCKET STORAGE POLICIES
-- Update policies untuk storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('article-images', 'article-images', true),
  ('program-images', 'program-images', true),
  ('testimonials', 'testimonials', true),
  ('admin-avatars', 'admin-avatars', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Policy untuk article-images (public read, admin write)
CREATE POLICY "Public can view article images" ON storage.objects
  FOR SELECT 
  USING (bucket_id = 'article-images');

CREATE POLICY "Admins can upload article images" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'article-images' AND 
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

CREATE POLICY "Admins can delete article images" ON storage.objects
  FOR DELETE 
  USING (
    bucket_id = 'article-images' AND 
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- Policy untuk program-images
CREATE POLICY "Public can view program images" ON storage.objects
  FOR SELECT 
  USING (bucket_id = 'program-images');

CREATE POLICY "Admins can upload program images" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'program-images' AND 
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

CREATE POLICY "Admins can delete program images" ON storage.objects
  FOR DELETE 
  USING (
    bucket_id = 'program-images' AND 
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- Policy untuk testimonials
CREATE POLICY "Public can view testimonial images" ON storage.objects
  FOR SELECT 
  USING (bucket_id = 'testimonials');

CREATE POLICY "Admins can upload testimonial images" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'testimonials' AND 
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- Policy untuk admin-avatars (private)
CREATE POLICY "Admins can view avatars" ON storage.objects
  FOR SELECT 
  USING (
    bucket_id = 'admin-avatars' AND 
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

CREATE POLICY "Admins can upload avatars" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'admin-avatars' AND 
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- ============================================
-- CATATAN PENTING:
-- 1. Pastikan tabel admin_users sudah ada
-- 2. Insert minimal 1 admin user sebelum enable RLS
-- 3. Test anonymous access setelah enable RLS
-- ============================================
