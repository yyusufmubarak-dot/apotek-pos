/**
 * Data Awal & Stok Default Apotek
 * Termasuk barcode real EAN-13 Indonesia (awalan 899...)
 */

const DEFAULT_SETTINGS = {
  namaApotek: "Apotek Medika Sejahtera",
  slogan: "Melayani dengan Sepenuh Hati & Sahabat Kesehatan Anda",
  alamat: "Jl. Merdeka No. 88, Kota Anda",
  telepon: "0812-3456-7890",
  sipa: "SIPA: 446/1029/DINKES/2024",
  apoteker: "apt. Siti Nurhaliza, S.Farm.",
  catatanStruk: "Terima kasih atas kunjungan Anda. Semoga lekas sembuh!",
  pajakPersen: 0, // 0 = nonaktif
  autoOpenCashierScan: true
};

const INITIAL_MEDICINES = [
  {
    id: "med-1",
    barcode: "8992753210103",
    nama: "Panadol Biru 500 mg",
    kategori: "Obat Bebas",
    satuan: "Blister",
    hargaBeli: 11500,
    hargaJual: 14500,
    stok: 35,
    stokMinimal: 10,
    tglKadaluarsa: "2027-08-15",
    produsen: "GSK",
    rak: "Rak A-01",
    createdAt: "2026-01-10T08:00:00Z"
  },
  {
    id: "med-2",
    barcode: "8999908001201",
    nama: "Promag Tablet Kunyah",
    kategori: "Obat Bebas",
    satuan: "Blister",
    hargaBeli: 8500,
    hargaJual: 11000,
    stok: 24,
    stokMinimal: 8,
    tglKadaluarsa: "2027-05-20",
    produsen: "Kalbe Farma",
    rak: "Rak A-02",
    createdAt: "2026-01-10T08:00:00Z"
  },
  {
    id: "med-3",
    barcode: "8991389221019",
    nama: "Tolak Angin Cair Herbal",
    kategori: "Herbal",
    satuan: "Sachet",
    hargaBeli: 3400,
    hargaJual: 4500,
    stok: 120,
    stokMinimal: 20,
    tglKadaluarsa: "2028-03-10",
    produsen: "Sido Muncul",
    rak: "Etalase Depan",
    createdAt: "2026-01-10T08:00:00Z"
  },
  {
    id: "med-4",
    barcode: "8998866100112",
    nama: "Bodrex Sakit Kepala",
    kategori: "Obat Bebas",
    satuan: "Strip",
    hargaBeli: 4500,
    hargaJual: 6500,
    stok: 4, // Stok menipis!
    stokMinimal: 10,
    tglKadaluarsa: "2027-11-18",
    produsen: "Tempo Scan",
    rak: "Rak A-01",
    createdAt: "2026-01-10T08:00:00Z"
  },
  {
    id: "med-5",
    barcode: "8992770010041",
    nama: "Betadine Antiseptic Solution 15 ml",
    kategori: "Obat Bebas Terbatas",
    satuan: "Botol",
    hargaBeli: 14500,
    hargaJual: 18500,
    stok: 16,
    stokMinimal: 5,
    tglKadaluarsa: "2026-12-15", // Mendekati kadaluarsa!
    produsen: "Mundipharma",
    rak: "Rak C-03 (P3K)",
    createdAt: "2026-01-10T08:00:00Z"
  },
  {
    id: "med-6",
    barcode: "8993005110198",
    nama: "Sanmol Sirup 60 ml",
    kategori: "Obat Bebas",
    satuan: "Botol",
    hargaBeli: 19000,
    hargaJual: 24000,
    stok: 12,
    stokMinimal: 5,
    tglKadaluarsa: "2027-09-01",
    produsen: "Sanbe Farma",
    rak: "Rak B-01 (Anak)",
    createdAt: "2026-01-10T08:00:00Z"
  },
  {
    id: "med-7",
    barcode: "8991002100877",
    nama: "Amoxicillin 500 mg Kaplet",
    kategori: "Obat Keras",
    satuan: "Strip",
    hargaBeli: 6000,
    hargaJual: 11000,
    stok: 50,
    stokMinimal: 15,
    tglKadaluarsa: "2028-01-15",
    produsen: "Kimia Farma",
    rak: "Lemari Khusus Resep",
    createdAt: "2026-01-10T08:00:00Z"
  },
  {
    id: "med-8",
    barcode: "8997012345678",
    nama: "Hansaplast Plester Kain Elastis",
    kategori: "Alat Kesehatan",
    satuan: "Amplop",
    hargaBeli: 5000,
    hargaJual: 7500,
    stok: 40,
    stokMinimal: 10,
    tglKadaluarsa: "2029-06-30",
    produsen: "Beiersdorf",
    rak: "Etalase Depan",
    createdAt: "2026-01-10T08:00:00Z"
  }
];

const SAMPLE_TRANSACTIONS = [
  {
    id: "TRX-20261103-0001",
    waktu: "2026-11-03T10:15:00",
    items: [
      { id: "med-1", barcode: "8992753210103", nama: "Panadol Biru 500 mg", hargaJual: 14500, hargaBeli: 11500, qty: 1, subtotal: 14500 },
      { id: "med-3", barcode: "8991389221019", nama: "Tolak Angin Cair Herbal", hargaJual: 4500, hargaBeli: 3400, qty: 3, subtotal: 13500 }
    ],
    totalItem: 4,
    subtotal: 28000,
    diskon: 0,
    totalAkhir: 28000,
    metodeBayar: "Tunai",
    nominalBayar: 50000,
    kembalian: 22000,
    keuntungan: (14500 - 11500) + (13500 - (3400 * 3)), // 3000 + 3300 = 6300
    kasir: "Kasir 1"
  }
];
