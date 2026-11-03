# Sistem Kasir & Manajemen Stok Apotek (Barcode POS)

Aplikasi kasir berbasis web khusus apotek / toko obat dengan pemindai barcode kamera real-time, deteksi cerdas barcode belum terdaftar, penyesuaian harga oleh pemilik, cetak struk thermal, dan manajemen kadaluarsa (ED).

---

## 🚀 Cara Menjalankan Aplikasi

Aplikasi ini bersifat **standalone (tanpa instalasi rumit)** dan bisa langsung dijalankan:

### Opsi 1: Langsung Buka di Browser (Paling Cepat)
Cukup buka file `index.html` dengan cara:
- Klik ganda (double-click) file `index.html` di File Explorer, atau
- Buka browser (Chrome, Edge, Firefox), lalu tekan `Ctrl + O` dan pilih file `index.html`.

### Opsi 2: Menggunakan Local Web Server (Direkomendasikan untuk Izin Kamera HP/Webcam)
Buka terminal PowerShell pada folder ini, lalu jalankan salah satu perintah:
```bash
# Menggunakan Python
python -m http.server 3000

# Atau menggunakan Node.js / npx
npx serve .
```
Lalu buka di browser: `http://localhost:3000`

---

## 🎯 Cara Kerja Fitur "Barcode Belum Terdaftar" (Permintaan Utama)

1. **Arahkan Kamera ke Barcode Obat**:
   - Klik **"Buka Kamera"** pada panel Scanner di tab Kasir.
   - Pindai barcode kemasan obat (atau ketik nomor barcode di form manual).
2. **Jika Barcode Belum Terdaftar di Apotek**:
   - Sistem mengeluarkan bunyi alarm nada ganda (`Alert Chime`).
   - Jendela **"Barang Belum Masuk di Data!"** otomatis terbuka dengan menampilkan kode barcode yang baru saja di-scan.
   - **Rekomendasi Cepat / Autocomplete**:
     - Anda dapat mengeklik salah satu pill saran obat (misal: *Paracetamol, Panadol, Promag, Amoxicillin, Betadine, dll.*), atau mulai mengetik nama obat.
     - Sistem otomatis mengisi **Nama Obat, Kategori, Satuan Kemasan, Estimasi Harga Beli (Modal), dan Estimasi Harga Jual**.
3. **Penyesuaian oleh Pemilik**:
   - Pemilik apotek bebas menyesuaikan:
     - **Harga Jual** (Margin laba dan persentase dihitung otomatis secara real-time).
     - **Harga Beli** (Modal).
     - **Jumlah Stok Masuk**.
     - **Tanggal Kadaluarsa (Expired Date)**.
     - **Letak Rak / Etalase**.
4. **Simpan & Langsung Masuk Kasir**:
   - Klik tombol **"Simpan & Tambah ke Kasir"**.
   - Barang langsung tercatat permanen di katalog stok obat dan seketika masuk ke keranjang transaksi saat itu, sehingga kasir tidak perlu scan ulang!

---

## 🧪 Barcode Contoh untuk Uji Coba Langsung (Tanpa Kamera Fisik)

Anda juga bisa mencoba simulator dengan mengeklik tombol **"Contoh Barcode Tes"** di pojok kanan atas aplikasi:

### 1. Barcode Baru (Belum Terdaftar - Uji Coba Fitur Utama):
- `8999908009999` (Kode obat baru #1)
- `8992345678901` (Kode obat baru #2)

### 2. Barcode yang Sudah Terdaftar di Stok Contoh:
- `8992753210103` → Panadol Biru 500 mg (Rp 14.500)
- `8999908001201` → Promag Tablet Kunyah (Rp 11.000)
- `8991389221019` → Tolak Angin Cair Herbal (Rp 4.500)
- `8998866100112` → Bodrex Sakit Kepala (Rp 6.500 - *Stok Menipis*)
- `8992770010041` → Betadine Antiseptic 15 ml (Rp 18.500 - *Mendekati ED*)
- `8993005110198` → Sanmol Sirup 60 ml (Rp 24.000)
- `8991002100877` → Amoxicillin 500 mg (Rp 11.000 - *Obat Keras*)
- `8997012345678` → Hansaplast Plester Kain (Rp 7.500)

---

## ✨ Fitur Lengkap Aplikasi

1. **Kasir (POS)**:
   - Scanner barcode kamera dengan garis laser animasi & viewfinder reticle.
   - Suara beep pemindai otomatis menggunakan Web Audio API (tanpa file mp3 eksternal).
   - Pengaturan kuantitas obat (+/-), peringatan jika stok menipis atau mendekati tanggal kadaluarsa.
   - Pilihan diskon (Nominal Rp atau Persen %).
   - Pembayaran Tunai (dengan tombol cepat nominal 10k, 20k, 50k, 100k, Uang Pas & kalkulasi kembalian otomatis), QRIS, atau Transfer Bank.
2. **Cetak Struk Thermal**:
   - Format standar struk printer kasir 58mm / 80mm.
   - Sudah dilengkapi CSS `@media print` sehingga saat ditekan cetak, hanya struk yang dicetak bersih tanpa tombol/elemen antarmuka website.
3. **Katalog Obat & Manajemen Stok**:
   - Filter golongan obat: Obat Bebas, Obat Bebas Terbatas, Obat Keras (K), Herbal/Jamu, Suplemen, Alat Kesehatan.
   - Indikator peringatan stok menipis (≤ 10) dan mendekati kadaluarsa (< 90 hari).
   - Export & Import data katalog dalam format JSON untuk cadangan data (backup).
4. **Riwayat Penjualan & Laba**:
   - Rekap omzet penjualan, estimasi laba bersih (profit = harga jual - harga beli), dan cetak ulang struk lama.
5. **Pengaturan Apotek**:
   - Kustomisasi Nama Apotek, Nomor SIPA/SIA, Apoteker Penanggung Jawab, Alamat, dan Pesan Penutup Struk.
