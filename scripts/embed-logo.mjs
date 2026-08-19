import { access } from "node:fs/promises";

// Logo yayasan sudah disimpan di repository agar proses build/deploy
// tidak bergantung pada Supabase atau koneksi internet eksternal.
const embeddedLogo = "public/logo-yayasan.svg";

try {
  await access(embeddedLogo);
  console.log(`Logo yayasan lokal siap: ${embeddedLogo}`);
} catch {
  throw new Error(
    `Logo yayasan lokal tidak ditemukan: ${embeddedLogo}. ` +
    "Pastikan asset logo resmi tersimpan di repository sebelum build."
  );
}
