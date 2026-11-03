# ANTI-SLOP DESIGN SYSTEM & UI BLUEPRINT
*Synthesized from top GitHub repositories, design engineer frameworks, and production-grade architectures.*

---

## 🏛️ 1. Daftar Repositori & Framework Rujukan di GitHub

1. **`UIZZE/anti-ui-slop`** (via `github/awesome-copilot`)
   - **Prinsip Utama**: Menghentikan "AI slop" generik; menuntut *Product Grounding* (desain berbasis kebutuhan nyata industri), *Design Contract* (kejelasan peran tiap elemen layar), dan *Hard Finish Gate* (verifikasi state kosong, loading, interaksi aktif, dan error).
2. **`Nutlope/hallmark`** (Hallmark Design Skill)
   - **Prinsip Utama**: Melarang trope AI klise (gradient ungu radial acak, card di dalam card tanpa hierarki, grid harga 3 kolom kaku). Menekankan *Modular Scale*, kontras tinggi, dan *Design DNA* yang otentik.
3. **`satnaing/shadcn-admin`**
   - **Prinsip Utama**: Standar arsitektur dashboard enterprise dan POS modern berbasis Radix + Tailwind. Mengutamakan *Data-Dense Layouts*, tabel data berdensitas tinggi, typography tabular (`font-mono tabular-nums`), dan navigasi keyboard yang mulus.
4. **`LeoStehlik/no-slop-ui`**
   - **Prinsip Utama**: Mengeliminasi *gradient abuse* dan *blurry glassmorphism*. Menggantinya dengan garis batas hairline 1px tegas (`border-slate-800/80` / `border-slate-200`), *solid surfaces*, dan rasio kontras WCAG AAA.
5. **`tremorlabs/tremor`**
   - **Prinsip Utama**: Visualisasi metrik finansial tingkat Bloomberg/Stripe. Menampilkan KPI card berdensitas tinggi, indikator delta keuntungan (`+183%` dalam pill terstruktur), dan hierarki angka moneter yang tegas.
6. **`magicuidesign/magicui` & `aceternity/aceternity-ui`**
   - **Prinsip Utama**: *Tactile Micro-interactions*, efek pendar fokus halus pada elemen aktif, transisi modal yang tidak mengentak (*cubic-bezier easing*), dan umpan balik tombol yang responsif.
7. **`dubinc/dub` & `chronark/highstorm`**
   - **Prinsip Utama**: Estetika minimalis Vercel/Linear: latar netral slate gelap dengan aksen warna fungsional domain medis (Emerald & Teal untuk farmasi), tanpa dekorasi warna-warni yang tidak perlu.
8. **`scanaislop/aislot` & `Impeccable` (Paul Bakaus)**
   - **Prinsip Utama**: *Visual Audit Gate*: Menjaga konsistensi padding sistem (kelipatan 4px/8px), mencegah text wrapping bertumpuk pada nama produk panjang, dan memastikan layout responsif dari mobile hingga monitor kasir lebar.

---

## 📐 2. Aturan Visual Anti-Slop (Implementasi Farmasi POS)

### A. Palet Warna & Kontras Fungsional
- **Background Utama**: Slate ultra-deep `#0b0f19` (gelap elegan, bukan hitam mati `#000000` atau ungu neon).
- **Surface Cards**: `#111827` (Slate-900) dengan border hairline 1px `#1f2937` (Slate-800).
- **Aksen Medis Primer**: Emerald `#10b981` (kesehatan, penjualan aktif, stok cukup).
- **Aksen KIE Medis**: Teal & Cyan `#06b6d4` (indikasi klinis, edukasi pasien farmasi).
- **Peringatan & ED**: Amber `#f59e0b` (stok menipis) & Crimson/Rose `#f43f5e` (mendekati kadaluarsa).
- **Dilarang**: Gradient pelangi/ungu liar yang tidak memiliki fungsi semantik.

### B. Tipografi & Tabular Numerals
- **Display & UI**: *Plus Jakarta Sans* / *Inter* dengan tracking ketat (`tracking-tight`).
- **Angka Moneter & Barcode**: Wajib menggunakan `font-mono tabular-nums font-semibold` agar angka Rupiah dan barcode tidak bergoyang saat nilai berubah.
- **Hierarki Jelas**: Judul Section (14-16px bold), Label Metadata (11-12px medium slate-400), Pill Indikasi (10-11px semibold).

### C. Densitas Informasi & Ergonomi Kasir
- Kasir adalah antarmuka berkecepatan tinggi: tombol aksi harus memiliki target sentuh minimal 36px, shortcut keyboard jelas (`Ctrl+K` untuk cari, `F2` untuk bayar), dan informasi obat (nama, barcode, indikasi, dosis) langsung terbaca dalam 1 kali pandang tanpa harus klik berkali-kali.
- Keranjang belanja harus memisahkan secara visual: Info Obat $\rightarrow$ Indikasi KIE $\rightarrow$ Kontrol Jumlah $\rightarrow$ Subtotal.

### D. Hard Finish Gates
1. Tidak boleh ada teks yang terpotong aneh (*overflow-hidden* tanpa *truncate*).
2. Input field harus memiliki ring fokus jelas (`focus:ring-2 focus:ring-emerald-500/50`).
3. Loading & Empty State harus informatif dan memiliki visual ikonik yang relevan, bukan layar kosong.
