/**
 * Kamus Referensi Obat & Produk Farmasi Populer Indonesia
 * Digunakan untuk auto-sugesti nama, kategori, satuan, estimasi harga beli & harga jual
 * saat kasir/pemilik scan barcode baru yang belum terdaftar.
 */

const DRUG_DATABASE_REFERENCE = [
  // Analgesik & Antipiretik (Pereda Nyeri & Demam)
  {
    nama: "Paracetamol 500 mg",
    kategori: "Obat Bebas",
    satuan: "Strip",
    hargaBeli: 4000,
    hargaJual: 6000,
    produsen: "Kimia Farma",
    keterangan: "Pereda demam dan sakit kepala (isi 10 kaplet)"
  },
  {
    nama: "Panadol Biru 500 mg",
    kategori: "Obat Bebas",
    satuan: "Blister",
    hargaBeli: 11500,
    hargaJual: 14500,
    produsen: "GSK",
    keterangan: "Paracetamol murni pereda nyeri & demam (isi 10 kaplet)"
  },
  {
    nama: "Panadol Merah (Extra)",
    kategori: "Obat Bebas",
    satuan: "Blister",
    hargaBeli: 13000,
    hargaJual: 16500,
    produsen: "GSK",
    keterangan: "Paracetamol + Kafein untuk sakit kepala membandel"
  },
  {
    nama: "Sanmol 500 mg Kaplet",
    kategori: "Obat Bebas",
    satuan: "Strip",
    hargaBeli: 3500,
    hargaJual: 5500,
    produsen: "Sanbe Farma",
    keterangan: "Paracetamol 500mg isi 4 kaplet"
  },
  {
    nama: "Sanmol Sirup 60 ml",
    kategori: "Obat Bebas",
    satuan: "Botol",
    hargaBeli: 19000,
    hargaJual: 24000,
    produsen: "Sanbe Farma",
    keterangan: "Paracetamol sirup penurun panas anak"
  },
  {
    nama: "Bodrex Sakit Kepala",
    kategori: "Obat Bebas",
    satuan: "Strip",
    hargaBeli: 4500,
    hargaJual: 6500,
    produsen: "Tempo Scan Pacific",
    keterangan: "Pereda sakit kepala (isi 4 tablet)"
  },
  {
    nama: "Bodrex Migra",
    kategori: "Obat Bebas",
    satuan: "Strip",
    hargaBeli: 4800,
    hargaJual: 7000,
    produsen: "Tempo Scan Pacific",
    keterangan: "Khusus sakit kepala sebelah / migrain"
  },
  {
    nama: "Bodrexin Anak",
    kategori: "Obat Bebas",
    satuan: "Strip",
    hargaBeli: 3000,
    hargaJual: 4500,
    produsen: "Tempo Scan Pacific",
    keterangan: "Aspirin tablet kunyah rasa jeruk untuk anak"
  },
  {
    nama: "Biogesic 500 mg",
    kategori: "Obat Bebas",
    satuan: "Strip",
    hargaBeli: 4000,
    hargaJual: 6000,
    produsen: "Darya-Varia",
    keterangan: "Paracetamol aman untuk lambung (isi 4 tablet)"
  },
  {
    nama: "Ibuprofen 400 mg",
    kategori: "Obat Bebas Terbatas",
    satuan: "Strip",
    hargaBeli: 5000,
    hargaJual: 8000,
    produsen: "Generic",
    keterangan: "Antiinflamasi & pereda nyeri sendi/gigi (10 tablet)"
  },
  {
    nama: "Feminax Tablet",
    kategori: "Obat Bebas",
    satuan: "Strip",
    hargaBeli: 3500,
    hargaJual: 5000,
    produsen: "Konimex",
    keterangan: "Pereda nyeri haid & kram perut"
  },
  {
    nama: "Asam Mefenamat 500 mg",
    kategori: "Obat Keras",
    satuan: "Strip",
    hargaBeli: 6000,
    hargaJual: 10000,
    produsen: "Generic",
    keterangan: "Pereda sakit gigi dan nyeri berat (10 kaplet)"
  },

  // Lambung & Maag
  {
    nama: "Promag Tablet Kunyah",
    kategori: "Obat Bebas",
    satuan: "Blister",
    hargaBeli: 8500,
    hargaJual: 11000,
    produsen: "Kalbe Farma",
    keterangan: "Antasida pereda sakit maag & kembung (isi 10 tablet)"
  },
  {
    nama: "Promag Cair Sachet",
    kategori: "Obat Bebas",
    satuan: "Sachet",
    hargaBeli: 2200,
    hargaJual: 3000,
    produsen: "Kalbe Farma",
    keterangan: "Antasida cair suspensi 7ml"
  },
  {
    nama: "Mylanta Suspensi 50 ml",
    kategori: "Obat Bebas",
    satuan: "Botol",
    hargaBeli: 17500,
    hargaJual: 22000,
    produsen: "Johnson & Johnson",
    keterangan: "Obat sakit maag cair cepat redakan asam lambung"
  },
  {
    nama: "Mylanta Tablet",
    kategori: "Obat Bebas",
    satuan: "Strip",
    hargaBeli: 8500,
    hargaJual: 11500,
    produsen: "Johnson & Johnson",
    keterangan: "Antasida tablet kunyah (isi 10 tablet)"
  },
  {
    nama: "Polysilane Tablet Kunyah",
    kategori: "Obat Bebas",
    satuan: "Strip",
    hargaBeli: 9000,
    hargaJual: 12500,
    produsen: "Pharos",
    keterangan: "Dimethicone + Antasida pereda asam lambung & gas"
  },
  {
    nama: "Omeprazole 20 mg",
    kategori: "Obat Keras",
    satuan: "Strip",
    hargaBeli: 7000,
    hargaJual: 12000,
    produsen: "Generic",
    keterangan: "Penghambat pompa proton asam lambung (10 kapsul)"
  },
  {
    nama: "Lansoprazole 30 mg",
    kategori: "Obat Keras",
    satuan: "Strip",
    hargaBeli: 12000,
    hargaJual: 18000,
    produsen: "Generic",
    keterangan: "Tukak lambung dan GERD (isi 10 kapsul)"
  },

  // Flu, Batuk & Alergi
  {
    nama: "Decolgen Tablet",
    kategori: "Obat Bebas Terbatas",
    satuan: "Strip",
    hargaBeli: 3000,
    hargaJual: 4500,
    produsen: "Darya-Varia",
    keterangan: "Pereda flu, bersin, hidung tersumbat (isi 4 tablet)"
  },
  {
    nama: "Mixagrip Flu & Batuk",
    kategori: "Obat Bebas Terbatas",
    satuan: "Strip",
    hargaBeli: 3200,
    hargaJual: 5000,
    produsen: "Dankos Farma",
    keterangan: "Kombinasi flu dan batuk berdahak/kering"
  },
  {
    nama: "Procold Flu",
    kategori: "Obat Bebas Terbatas",
    satuan: "Strip",
    hargaBeli: 3500,
    hargaJual: 5000,
    produsen: "Kalbe Farma",
    keterangan: "Pereda demam, pusing, bersin dan flu"
  },
  {
    nama: "OBH Tropica Plus Anak Rasa Stroberi",
    kategori: "Obat Bebas Terbatas",
    satuan: "Botol",
    hargaBeli: 18000,
    hargaJual: 23500,
    produsen: "Tropica",
    keterangan: "Sirup batuk flu anak 60 ml"
  },
  {
    nama: "OBH Combi Batuk Berdahak 100 ml",
    kategori: "Obat Bebas",
    satuan: "Botol",
    hargaBeli: 16500,
    hargaJual: 21000,
    produsen: "Combiphar",
    keterangan: "Sirup obat batuk hitam pengencer dahak"
  },
  {
    nama: "OBH Combi Batuk & Flu Menthol 100 ml",
    kategori: "Obat Bebas Terbatas",
    satuan: "Botol",
    hargaBeli: 19500,
    hargaJual: 25000,
    produsen: "Combiphar",
    keterangan: "Sirup batuk flu melegakan tenggorokan"
  },
  {
    nama: "Komix Herbal Peppermint Sachet",
    kategori: "Herbal",
    satuan: "Sachet",
    hargaBeli: 2000,
    hargaJual: 3000,
    produsen: "Bintang Toedjoe",
    keterangan: "Obat batuk herbal sachet 15 ml"
  },
  {
    nama: "Siladex Mucolytic & Expectorant 60 ml",
    kategori: "Obat Bebas Terbatas",
    satuan: "Botol",
    hargaBeli: 15000,
    hargaJual: 19500,
    produsen: "Konimex",
    keterangan: "Bromhexine pengencer dahak batuk"
  },
  {
    nama: "Cetirizine 10 mg",
    kategori: "Obat Bebas Terbatas",
    satuan: "Strip",
    hargaBeli: 4500,
    hargaJual: 7500,
    produsen: "Generic",
    keterangan: "Antihistamin anti alergi dan gatal (isi 10 tablet)"
  },
  {
    nama: "CTM (Chlorpheniramine Maleate) 4 mg",
    kategori: "Obat Bebas Terbatas",
    satuan: "Strip",
    hargaBeli: 1500,
    hargaJual: 3000,
    produsen: "Generic",
    keterangan: "Pereda alergi gatal dan bersin (isi 10 tablet)"
  },

  // Diare & Pencernaan
  {
    nama: "Entrostop Tablet",
    kategori: "Obat Bebas",
    satuan: "Blister",
    hargaBeli: 9500,
    hargaJual: 13000,
    produsen: "Kalbe Farma",
    keterangan: "Attapulgite pereda diare non-spesifik (isi 12 tablet)"
  },
  {
    nama: "Diapet Kapsul",
    kategori: "Herbal",
    satuan: "Strip",
    hargaBeli: 3200,
    hargaJual: 4500,
    produsen: "Soho",
    keterangan: "Ekstrak daun jambu biji pereda diare (isi 4 kapsul)"
  },
  {
    nama: "Diapet NR (Nyaman Rerata)",
    kategori: "Herbal",
    satuan: "Strip",
    hargaBeli: 3800,
    hargaJual: 5500,
    produsen: "Soho",
    keterangan: "Pereda diare dan kram perut"
  },
  {
    nama: "Oralit Sachet (Garam Rehidrasi)",
    kategori: "Obat Bebas",
    satuan: "Sachet",
    hargaBeli: 1000,
    hargaJual: 1800,
    produsen: "Phapros",
    keterangan: "Pencegah dehidrasi akibat diare & muntah"
  },
  {
    nama: "Dulcolax Tablet 5 mg",
    kategori: "Obat Bebas Terbatas",
    satuan: "Strip",
    hargaBeli: 6500,
    hargaJual: 9000,
    produsen: "Sanofi",
    keterangan: "Bisacodyl pencahar pereda sembelit/susah BAB (isi 4 tablet)"
  },
  {
    nama: "Microlax Enema 5 ml",
    kategori: "Obat Bebas Terbatas",
    satuan: "Tube",
    hargaBeli: 24000,
    hargaJual: 30000,
    produsen: "Johnson & Johnson",
    keterangan: "Pencahar cair aplikator dubur bekerja 5-15 menit"
  },

  // Pertolongan Pertama, Luka & Kulit
  {
    nama: "Betadine Antiseptic Solution 15 ml",
    kategori: "Obat Bebas Terbatas",
    satuan: "Botol",
    hargaBeli: 14500,
    hargaJual: 18500,
    produsen: "Mundipharma",
    keterangan: "Povidone Iodine 10% cairan pembersih luka"
  },
  {
    nama: "Betadine Antiseptic Solution 30 ml",
    kategori: "Obat Bebas Terbatas",
    satuan: "Botol",
    hargaBeli: 26000,
    hargaJual: 33000,
    produsen: "Mundipharma",
    keterangan: "Povidone Iodine pembersih luka botol sedang"
  },
  {
    nama: "Betadine Antiseptic Ointment Salep 5 gr",
    kategori: "Obat Bebas Terbatas",
    satuan: "Tube",
    hargaBeli: 13000,
    hargaJual: 17500,
    produsen: "Mundipharma",
    keterangan: "Salep luka bakar & gores antiseptik"
  },
  {
    nama: "Hansaplast Plester Kain Elastis",
    kategori: "Alat Kesehatan",
    satuan: "Amplop",
    hargaBeli: 5000,
    hargaJual: 7500,
    produsen: "Beiersdorf",
    keterangan: "Plester penutup luka isi 10 strip"
  },
  {
    nama: "Hansaplast Rol Kain 1.25 cm x 1 m",
    kategori: "Alat Kesehatan",
    satuan: "Rol",
    hargaBeli: 6000,
    hargaJual: 8500,
    produsen: "Beiersdorf",
    keterangan: "Plester rol fiksasi perban"
  },
  {
    nama: "Kassa Steril Husada 16x16 cm",
    kategori: "Alat Kesehatan",
    satuan: "Box",
    hargaBeli: 8000,
    hargaJual: 11000,
    produsen: "Husada",
    keterangan: "Kasa pembalut steril isi 10 lembar"
  },
  {
    nama: "Rivanol Cairan Antiseptik 100 ml",
    kategori: "Obat Bebas",
    satuan: "Botol",
    hargaBeli: 4000,
    hargaJual: 6000,
    produsen: "Molex Ayus",
    keterangan: "Cairan kompres dan cuci luka"
  },
  {
    nama: "Minyak Kayu Putih Cap Lang 60 ml",
    kategori: "Herbal",
    satuan: "Botol",
    hargaBeli: 21000,
    hargaJual: 26000,
    produsen: "Eagle Indo Pharma",
    keterangan: "Minyak kayu putih murni penghangat tubuh"
  },
  {
    nama: "Minyak Kayu Putih Cap Lang 120 ml",
    kategori: "Herbal",
    satuan: "Botol",
    hargaBeli: 38000,
    hargaJual: 46000,
    produsen: "Eagle Indo Pharma",
    keterangan: "Minyak kayu putih ukuran besar"
  },
  {
    nama: "Minyak Telon Lang Plus 60 ml",
    kategori: "Herbal",
    satuan: "Botol",
    hargaBeli: 17000,
    hargaJual: 22000,
    produsen: "Eagle Indo Pharma",
    keterangan: "Minyak telon bayi anti nyamuk"
  },
  {
    nama: "Salonpas Koyo Pereda Nyeri",
    kategori: "Obat Bebas",
    satuan: "Sachet",
    hargaBeli: 6500,
    hargaJual: 8500,
    produsen: "Hisamitsu",
    keterangan: "Koyo hangat pereda pegal & otot (isi 10 lembar)"
  },
  {
    nama: "Counterpain Salep 15 gr",
    kategori: "Obat Bebas",
    satuan: "Tube",
    hargaBeli: 26000,
    hargaJual: 33000,
    produsen: "Taisho",
    keterangan: "Krim pereda nyeri sendi dan terkilir"
  },
  {
    nama: "Voltaren Emulgel 10 gr",
    kategori: "Obat Bebas Terbatas",
    satuan: "Tube",
    hargaBeli: 42000,
    hargaJual: 52000,
    produsen: "Novartis",
    keterangan: "Diclofenac gel anti nyeri sendi dan inflamasi"
  },
  {
    nama: "Kalpanax Krim 5 gr",
    kategori: "Obat Bebas",
    satuan: "Tube",
    hargaBeli: 13000,
    hargaJual: 17000,
    produsen: "Kalbe Farma",
    keterangan: "Miconazole salep jamur panu, kadas, kurap"
  },
  {
    nama: "Salep 88 Anti Jamur",
    kategori: "Obat Bebas",
    satuan: "Pot",
    hargaBeli: 11000,
    hargaJual: 15000,
    produsen: "Meccaya",
    keterangan: "Salep legendaris gatal jamur dan kutu air"
  },
  {
    nama: "Hydrocortisone Salep 1% 5 gr",
    kategori: "Obat Keras",
    satuan: "Tube",
    hargaBeli: 6000,
    hargaJual: 10000,
    produsen: "Generic",
    keterangan: "Kortikosteroid oles pereda radang alergi kulit"
  },

  // Vitamin, Herbal & Suplemen
  {
    nama: "Tolak Angin Cair Herbal",
    kategori: "Herbal",
    satuan: "Sachet",
    hargaBeli: 3400,
    hargaJual: 4500,
    produsen: "Sido Muncul",
    keterangan: "Herbal masuk angin, mual, kembung (isi 15 ml)"
  },
  {
    nama: "Tolak Angin Flu Sachet",
    kategori: "Herbal",
    satuan: "Sachet",
    hargaBeli: 3600,
    hargaJual: 5000,
    produsen: "Sido Muncul",
    keterangan: "Herbal khusus gejala flu dan meriang"
  },
  {
    nama: "Enervon-C Strip",
    kategori: "Suplemen",
    satuan: "Strip",
    hargaBeli: 5000,
    hargaJual: 7500,
    produsen: "Darya-Varia",
    keterangan: "Multivitamin C + B Kompleks (isi 4 tablet)"
  },
  {
    nama: "Neurobion Forte Pink",
    kategori: "Obat Bebas",
    satuan: "Blister",
    hargaBeli: 41000,
    hargaJual: 50000,
    produsen: "Merck / P&G",
    keterangan: "Vitamin B1, B6, B12 dosis tinggi neuropati (10 tablet)"
  },
  {
    nama: "Imboost Force Kaplet",
    kategori: "Suplemen",
    satuan: "Strip",
    hargaBeli: 72000,
    hargaJual: 88000,
    produsen: "Soho",
    keterangan: "Echinacea + Zinc daya tahan tubuh (10 kaplet)"
  },
  {
    nama: "Sangobion Kapsul",
    kategori: "Obat Bebas",
    satuan: "Strip",
    hargaBeli: 17000,
    hargaJual: 22000,
    produsen: "Merck / P&G",
    keterangan: "Zat besi + mineral penambah darah anemia (10 kapsul)"
  },
  {
    nama: "CDR Effervescent Jeruk 10 Tablet",
    kategori: "Suplemen",
    satuan: "Tube",
    hargaBeli: 43000,
    hargaJual: 53000,
    produsen: "Bayer",
    keterangan: "Kalsium + Vitamin D + C larut air kesehatan tulang"
  },

  // Antibiotik & Resep Dokter Umum (Obat Keras)
  {
    nama: "Amoxicillin 500 mg",
    kategori: "Obat Keras",
    satuan: "Strip",
    hargaBeli: 6000,
    hargaJual: 11000,
    produsen: "Generic",
    keterangan: "Antibiotik spektrum luas (isi 10 kaplet - harus resep)"
  },
  {
    nama: "Cefadroxil 500 mg",
    kategori: "Obat Keras",
    satuan: "Strip",
    hargaBeli: 12000,
    hargaJual: 19000,
    produsen: "Generic",
    keterangan: "Antibiotik infeksi saluran nafas/kulit (10 kapsul)"
  },
  {
    nama: "Dexamethasone 0.5 mg",
    kategori: "Obat Keras",
    satuan: "Strip",
    hargaBeli: 2000,
    hargaJual: 4000,
    produsen: "Generic",
    keterangan: "Kortikosteroid antiradang dan antialergi (10 tablet)"
  },
  {
    nama: "Amlodipine 5 mg",
    kategori: "Obat Keras",
    satuan: "Strip",
    hargaBeli: 3500,
    hargaJual: 7000,
    produsen: "Generic",
    keterangan: "Obat antihipertensi / penurun tekanan darah (10 tablet)"
  },
  {
    nama: "Metformin 500 mg",
    kategori: "Obat Keras",
    satuan: "Strip",
    hargaBeli: 3500,
    hargaJual: 7000,
    produsen: "Generic",
    keterangan: "Obat antidiabetes tipe 2 (10 tablet)"
  },
  {
    nama: "Simvastatin 10 mg",
    kategori: "Obat Keras",
    satuan: "Strip",
    hargaBeli: 4000,
    hargaJual: 8000,
    produsen: "Generic",
    keterangan: "Obat penurun kolesterol (10 tablet)"
  },

  // Alat Kesehatan & Lainnya
  {
    nama: "Termometer Digital Badan",
    kategori: "Alat Kesehatan",
    satuan: "Pcs",
    hargaBeli: 22000,
    hargaJual: 35000,
    produsen: "OneMed",
    keterangan: "Pengukur suhu tubuh digital ujung lentur"
  },
  {
    nama: "Masker Medis 3 Ply (Box isi 50)",
    kategori: "Alat Kesehatan",
    satuan: "Box",
    hargaBeli: 16000,
    hargaJual: 25000,
    produsen: "Sensi / OneMed",
    keterangan: "Masker bedah 3 lapis earloop"
  },
  {
    nama: "Alkohol 70% 100 ml",
    kategori: "Alat Kesehatan",
    satuan: "Botol",
    hargaBeli: 5000,
    hargaJual: 8000,
    produsen: "OneMed",
    keterangan: "Antiseptik dan disinfektan kulit/alat"
  },
  {
    nama: "Testpack Kehamilan Strip (HCG)",
    kategori: "Alat Kesehatan",
    satuan: "Pcs",
    hargaBeli: 4000,
    hargaJual: 9000,
    produsen: "OneMed / Sensitif",
    keterangan: "Uji kehamilan cepat akurasi tinggi"
  }
];

// Helper pencari referensi obat berdasarkan keyword
function searchDrugReference(query) {
  if (!query || query.trim().length === 0) return [];
  const q = query.toLowerCase().trim();
  return DRUG_DATABASE_REFERENCE.filter(item => {
    return item.nama.toLowerCase().includes(q) ||
           item.kategori.toLowerCase().includes(q) ||
           (item.produsen && item.produsen.toLowerCase().includes(q)) ||
           (item.keterangan && item.keterangan.toLowerCase().includes(q));
  }).slice(0, 8); // Ambil maks 8 saran teratas
}
