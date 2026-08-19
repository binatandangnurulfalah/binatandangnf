import { mkdir, writeFile } from "node:fs/promises";

const logoUrl = "https://msymqqryppgohsjmdbeo.supabase.co/storage/v1/object/public/LogoYayasan/LogoYayasan.svg?v=2";
const output = "public/logo-yayasan.svg";

const response = await fetch(logoUrl);
if (!response.ok) {
  throw new Error(`Gagal mengambil logo yayasan: ${response.status} ${response.statusText}`);
}

const svg = await response.text();
if (!svg.includes("<svg")) {
  throw new Error("Asset logo yang diterima bukan SVG yang valid.");
}

await mkdir("public", { recursive: true });
await writeFile(output, svg, "utf8");
console.log(`Logo yayasan disematkan ke ${output}`);
