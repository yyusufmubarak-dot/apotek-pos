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
      { id: "med-1", barcode: "8992753210103", nama: "Panadol Biru 500 mg", hargaJual: 14500, hargaBeli: 11500, qty: 2, subtotal: 29000 },
      { id: "med-3", barcode: "8991389221019", nama: "Tolak Angin Cair Herbal", hargaJual: 4500, hargaBeli: 3400, qty: 4, subtotal: 18000 }
    ],
    totalItem: 6,
    subtotal: 47000,
    diskon: 0,
    totalAkhir: 47000,
    metodeBayar: "Tunai",
    nominalBayar: 50000,
    kembalian: 3000,
    keuntungan: ((14500 - 11500) * 2) + ((4500 - 3400) * 4), // 6000 + 4400 = 10400
    kasir: "Kasir 1"
  },
  {
    id: "TRX-20261102-0042",
    waktu: "2026-11-02T16:20:00",
    items: [
      { id: "med-2", barcode: "8999908001201", nama: "Promag Tablet Kunyah", hargaJual: 11000, hargaBeli: 8500, qty: 3, subtotal: 33000 },
      { id: "med-6", barcode: "8993005110198", nama: "Sanmol Sirup 60 ml", hargaJual: 24000, hargaBeli: 19000, qty: 1, subtotal: 24000 }
    ],
    totalItem: 4,
    subtotal: 57000,
    diskon: 2000,
    totalAkhir: 55000,
    metodeBayar: "QRIS",
    nominalBayar: 55000,
    kembalian: 0,
    keuntungan: ((11000 - 8500) * 3) + ((24000 - 19000) * 1) - 2000, // 7500 + 5000 - 2000 = 10500
    kasir: "Kasir 1"
  },
  {
    id: "TRX-20261101-0089",
    waktu: "2026-11-01T14:10:00",
    items: [
      { id: "med-5", barcode: "8992770010041", nama: "Betadine Antiseptic Solution 15 ml", hargaJual: 18500, hargaBeli: 14500, qty: 2, subtotal: 37000 },
      { id: "med-8", barcode: "8997012345678", nama: "Hansaplast Plester Kain", hargaJual: 7500, hargaBeli: 5000, qty: 3, subtotal: 22500 }
    ],
    totalItem: 5,
    subtotal: 59500,
    diskon: 0,
    totalAkhir: 59500,
    metodeBayar: "Tunai",
    nominalBayar: 100000,
    kembalian: 40500,
    keuntungan: ((18500 - 14500) * 2) + ((7500 - 5000) * 3), // 8000 + 7500 = 15500
    kasir: "Kasir 1"
  },
  {
    id: "TRX-20261031-0112",
    waktu: "2026-10-31T11:45:00",
    items: [
      { id: "med-1", barcode: "8992753210103", nama: "Panadol Biru 500 mg", hargaJual: 14500, hargaBeli: 11500, qty: 3, subtotal: 43500 },
      { id: "med-4", barcode: "8998866100112", nama: "Bodrex Sakit Kepala", hargaJual: 6500, hargaBeli: 4500, qty: 4, subtotal: 26000 }
    ],
    totalItem: 7,
    subtotal: 69500,
    diskon: 0,
    totalAkhir: 69500,
    metodeBayar: "Transfer",
    nominalBayar: 69500,
    kembalian: 0,
    keuntungan: ((14500 - 11500) * 3) + ((6500 - 4500) * 4), // 9000 + 8000 = 17000
    kasir: "Kasir 1"
  },
  {
    id: "TRX-20261030-0077",
    waktu: "2026-10-30T19:30:00",
    items: [
      { id: "med-7", barcode: "8991002100877", nama: "Amoxicillin 500 mg Kaplet", hargaJual: 11000, hargaBeli: 6000, qty: 3, subtotal: 33000 },
      { id: "med-3", barcode: "8991389221019", nama: "Tolak Angin Cair Herbal", hargaJual: 4500, hargaBeli: 3400, qty: 5, subtotal: 22500 }
    ],
    totalItem: 8,
    subtotal: 55500,
    diskon: 0,
    totalAkhir: 55500,
    metodeBayar: "Tunai",
    nominalBayar: 60000,
    kembalian: 4500,
    keuntungan: ((11000 - 6000) * 3) + ((4500 - 3400) * 5), // 15000 + 5500 = 20500
    kasir: "Kasir 1"
  },
  {
    id: "TRX-20261029-0051",
    waktu: "2026-10-29T15:20:00",
    items: [
      { id: "med-2", barcode: "8999908001201", nama: "Promag Tablet Kunyah", hargaJual: 11000, hargaBeli: 8500, qty: 4, subtotal: 44000 }
    ],
    totalItem: 4,
    subtotal: 44000,
    diskon: 0,
    totalAkhir: 44000,
    metodeBayar: "Tunai",
    nominalBayar: 50000,
    kembalian: 6000,
    keuntungan: (11000 - 8500) * 4, // 10000
    kasir: "Kasir 1"
  },
  {
    id: "TRX-20261028-0033",
    waktu: "2026-10-28T09:15:00",
    items: [
      { id: "med-1", barcode: "8992753210103", nama: "Panadol Biru 500 mg", hargaJual: 14500, hargaBeli: 11500, qty: 4, subtotal: 58000 }
    ],
    totalItem: 4,
    subtotal: 58000,
    diskon: 0,
    totalAkhir: 58000,
    metodeBayar: "QRIS",
    nominalBayar: 58000,
    kembalian: 0,
    keuntungan: (14500 - 11500) * 4, // 12000
    kasir: "Kasir 1"
  }
];
