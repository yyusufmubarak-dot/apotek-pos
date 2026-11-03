/**
 * =========================================================================
 * EXCEL & SPREADSHEET UNIVERSAL ENGINE (excel-util.js)
 * 1. Export Excel (.xlsx) dengan SheetJS: Stok Obat & Riwayat Penjualan.
 * 2. Smart Flexible Importer: Auto-detect kolom bagaimanapun formatnya
 *    (mendukung format Excel apotek, software POS lama, Google Sheets, dll).
 * =========================================================================
 */

// Format Kamus Sinonim Kolom (Fuzzy Column Matcher)
const COLUMN_SYNONYMS = {
  barcode: [
    'barcode', 'kode_barcode', 'kode_barang', 'kode', 'plu', 'sku', 'id',
    'item_code', 'bar_code', 'code', 'nomor_barcode', 'kategori_barcode'
  ],
  nama: [
    'nama', 'nama_barang', 'nama_obat', 'produk', 'item', 'deskripsi',
    'description', 'product', 'nama_produk', 'item_name', 'nama_item', 'title'
  ],
  kategori: [
    'kategori', 'category', 'sub_kategori', 'golongan', 'jenis', 'type',
    'kelompok', 'group', 'klasifikasi'
  ],
  satuan: [
    'satuan', 'satuan_1', 'unit', 'kemasan', 'uom', 'satuan_dasar', 'satuan_kecil'
  ],
  hargaBeli: [
    'hpp', 'harga_beli', 'beli', 'modal', 'cost', 'pokok', 'harga_pokok',
    'harga_modal', 'buying_price', 'harga_beli_satuan'
  ],
  hargaJual: [
    'harga_toko_1', 'harga_toko', 'harga_jual', 'jual', 'harga', 'price',
    'tarif', 'retail', 'selling_price', 'harga_satuan', 'harga_konsumen'
  ],
  stok: [
    'toko', 'stok', 'stock', 'qty', 'jumlah', 'kuantitas', 'saldo',
    'stok_akhir', 'quantity', 'sisa'
  ],
  tglKadaluarsa: [
    'tgl_kadaluarsa', 'kadaluarsa', 'expired', 'ed', 'exp_date', 'exp',
    'tgl_ed', 'tanggal_ed', 'tanggal_beli', 'expiry'
  ],
  produsen: [
    'supplier', 'pbf', 'distributor', 'pabrik', 'produsen', 'brand', 'merk', 'vendor'
  ],
  rak: [
    'lokasi', 'rak', 'posisi', 'tempat', 'lemari', 'shelf', 'location'
  ]
};

// Normalisasi nama kolom: hilangkan spasi, garis bawah, strip, dan lowercase
function normalizeHeaderName(str) {
  if (!str) return '';
  return String(str).toLowerCase().replace(/[\s\-_.]/g, '');
}

// -------------------------------------------------------------------------
// 1. EXPORT STOK OBAT KE EXCEL (.XLSX)
// -------------------------------------------------------------------------
function exportMedicinesToExcel() {
  if (typeof XLSX === 'undefined') {
    showToast("Library Excel sedang dimuat, coba sesaat lagi.", "warning");
    return;
  }

  if (!medicines || medicines.length === 0) {
    showToast("Belum ada data obat untuk diekspor.", "info");
    return;
  }

  // Siapkan data baris Excel
  const rows = medicines.map((m, idx) => {
    const margin = m.hargaBeli > 0 ? (((m.hargaJual - m.hargaBeli) / m.hargaBeli) * 100).toFixed(1) : 0;
    return {
      "No": idx + 1,
      "Kode Barcode": m.barcode,
      "Nama Obat / Produk": m.nama,
      "Golongan / Kategori": m.kategori,
      "Satuan": m.satuan,
      "Harga Modal (HPP)": m.hargaBeli,
      "Harga Jual Toko": m.hargaJual,
      "Margin Laba (%)": margin + "%",
      "Stok Toko": m.stok,
      "Tanggal ED (Kadaluarsa)": m.tglKadaluarsa || '-',
      "PBF / Produsen": m.produsen || '-',
      "Lokasi Rak": m.rak || '-'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Lebar kolom otomatis agar rapi saat dibuka di Microsoft Excel
  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 16 }, // Barcode
    { wch: 38 }, // Nama
    { wch: 20 }, // Kategori
    { wch: 12 }, // Satuan
    { wch: 16 }, // HPP
    { wch: 16 }, // Harga Jual
    { wch: 14 }, // Margin
    { wch: 12 }, // Stok
    { wch: 18 }, // ED
    { wch: 22 }, // Produsen
    { wch: 12 }  // Rak
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Katalog Stok Apotek");

  const today = new Date().toISOString().split('T')[0];
  const filename = `Apotek_Master_Obat_${today}.xlsx`;

  XLSX.writeFile(workbook, filename);
  showToast(`✅ Berhasil mengekspor ${medicines.length} obat ke file ${filename}`, "success");
}

// -------------------------------------------------------------------------
// 2. EXPORT LAPORAN PENJUALAN & LABA KE EXCEL (.XLSX)
// -------------------------------------------------------------------------
function exportTransactionsToExcel() {
  if (typeof XLSX === 'undefined') {
    showToast("Library Excel sedang dimuat, coba sesaat lagi.", "warning");
    return;
  }

  if (!transactions || transactions.length === 0) {
    showToast("Belum ada riwayat transaksi penjualan untuk diekspor.", "info");
    return;
  }

  // Sheet 1: Ringkasan Invoice
  const summaryRows = transactions.map((t, idx) => ({
    "No": idx + 1,
    "No. Invoice": t.id,
    "Waktu Transaksi": new Date(t.waktu).toLocaleString('id-ID'),
    "Metode Bayar": t.metodeBayar,
    "Jumlah Item": t.items ? t.items.length : 0,
    "Subtotal": t.subtotal,
    "Diskon": t.diskonNominal || 0,
    "Total Bayar": t.grandTotal,
    "Uang Diterima": t.uangDiterima || t.grandTotal,
    "Kembalian": t.kembalian || 0,
    "Estimasi Laba Bersih": t.totalLaba || 0
  }));

  // Sheet 2: Rincian Tiap Obat Terjual
  const itemRows = [];
  transactions.forEach(t => {
    if (Array.isArray(t.items)) {
      t.items.forEach(item => {
        itemRows.push({
          "No. Invoice": t.id,
          "Waktu": new Date(t.waktu).toLocaleString('id-ID'),
          "Barcode": item.barcode || '-',
          "Nama Obat": item.nama,
          "Satuan": item.satuan || 'Pcs',
          "Qty": item.qty,
          "Harga Satuan": item.hargaJual,
          "Total Harga": item.subtotal,
          "Modal (HPP)": item.hargaBeli || 0,
          "Laba Item": (item.hargaJual - (item.hargaBeli || 0)) * item.qty
        });
      });
    }
  });

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  const wsItems = XLSX.utils.json_to_sheet(itemRows);

  wsSummary['!cols'] = [
    { wch: 6 }, { wch: 22 }, { wch: 20 }, { wch: 14 },
    { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 16 },
    { wch: 16 }, { wch: 14 }, { wch: 18 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, wsSummary, "Ringkasan Transaksi");
  XLSX.utils.book_append_sheet(workbook, wsItems, "Rincian Item Terjual");

  const today = new Date().toISOString().split('T')[0];
  const filename = `Apotek_Laporan_Penjualan_${today}.xlsx`;

  XLSX.writeFile(workbook, filename);
  showToast(`✅ Berhasil mengekspor riwayat transaksi ke ${filename}`, "success");
}

// -------------------------------------------------------------------------
// 3. SMART FLEXIBLE IMPORTER (AUTO-DETECT COLUMN PATTERNS)
// -------------------------------------------------------------------------
let pendingImportedData = [];

function handleSmartExcelImport(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (typeof XLSX === 'undefined') {
    showToast("Library Excel belum siap. Silakan refresh halaman.", "danger");
    return;
  }

  showToast(`Membaca file "${file.name}"...`, "info");
  const reader = new FileReader();

  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Ambil data dalam format JSON baris
      const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });

      if (!rawRows || rawRows.length === 0) {
        showToast("File Excel/Spreadsheet kosong atau tidak memiliki baris data.", "warning");
        return;
      }

      // Deteksi pemetaan kolom secara cerdas
      const sampleRow = rawRows[0];
      const columnMapping = detectColumnMapping(sampleRow);

      if (!columnMapping.nama) {
        showToast("Gagal mendeteksi kolom Nama Obat pada file ini.", "danger");
        return;
      }

      // Konversi seluruh baris data berdasarkan pemetaan yang terdeteksi
      const parsedMedicines = [];
      rawRows.forEach((row, idx) => {
        const rawName = String(row[columnMapping.nama] || '').trim();
        if (!rawName) return; // Lewati baris kosong

        // Barcode
        let barcode = columnMapping.barcode ? String(row[columnMapping.barcode] || '').trim() : '';
        if (!barcode || barcode.toLowerCase() === 'none') {
          barcode = `APT${(medicines.length + idx + 1).toString().padStart(5, '0')}`;
        }

        // Kategori & Satuan
        const kat = columnMapping.kategori ? String(row[columnMapping.kategori] || '').trim() : 'Obat Bebas';
        const satuan = columnMapping.satuan ? String(row[columnMapping.satuan] || '').trim() : 'Pcs';

        // Harga Beli / HPP
        let hpp = 0;
        if (columnMapping.hargaBeli) {
          hpp = parseNumericVal(row[columnMapping.hargaBeli]);
        }

        // Harga Jual
        let jual = 0;
        if (columnMapping.hargaJual) {
          jual = parseNumericVal(row[columnMapping.hargaJual]);
        }
        if (jual === 0 && hpp > 0) jual = Math.round(hpp * 1.25);
        if (jual === 0 && hpp === 0) { jual = 5000; hpp = 3500; }

        // Stok
        let stok = 0;
        if (columnMapping.stok) {
          stok = Math.max(0, parseInt(parseNumericVal(row[columnMapping.stok]), 10) || 0);
        }

        // Kadaluarsa (ED)
        let ed = '2027-12-31';
        if (columnMapping.tglKadaluarsa && row[columnMapping.tglKadaluarsa]) {
          const rawEd = String(row[columnMapping.tglKadaluarsa]).trim();
          if (rawEd && !rawEd.startsWith('1899')) {
            ed = rawEd.substring(0, 10);
          }
        }

        // Produsen & Rak
        const produsen = columnMapping.produsen ? String(row[columnMapping.produsen] || 'PBF Umum').trim() : 'PBF Umum';
        const rak = columnMapping.rak ? String(row[columnMapping.rak] || '-').trim() : 'Rak A-01';

        parsedMedicines.push({
          id: `med-${Date.now()}-${idx}`,
          barcode: escapeHtml(barcode),
          nama: escapeHtml(rawName),
          kategori: escapeHtml(kat || 'Obat Bebas'),
          satuan: escapeHtml(satuan || 'Pcs'),
          hargaBeli: hpp,
          hargaJual: jual,
          stok: stok,
          stokMinimal: 5,
          tglKadaluarsa: ed,
          produsen: escapeHtml(produsen),
          rak: escapeHtml(rak),
          createdAt: new Date().toISOString()
        });
      });

      if (parsedMedicines.length === 0) {
        showToast("Tidak ada produk valid yang berhasil diekstraksi.", "warning");
        return;
      }

      pendingImportedData = parsedMedicines;
      openImportPreviewModal(file.name, parsedMedicines.length, columnMapping, parsedMedicines.slice(0, 5));

    } catch (err) {
      console.error("Gagal parse Excel:", err);
      showToast(`Gagal membaca file: ${err.message}`, "danger");
    } finally {
      event.target.value = ''; // Reset input agar bisa dipilih ulang
    }
  };

  reader.readAsArrayBuffer(file);
}

// Deteksi cerdas kolom dari baris header
function detectColumnMapping(sampleRow) {
  const mapping = {};
  const actualKeys = Object.keys(sampleRow);

  for (const [targetField, synonymList] of Object.entries(COLUMN_SYNONYMS)) {
    for (const key of actualKeys) {
      const normKey = normalizeHeaderName(key);
      const matched = synonymList.some(syn => {
        const normSyn = normalizeHeaderName(syn);
        return normKey === normSyn || normKey.includes(normSyn) || normSyn.includes(normKey);
      });

      if (matched && !mapping[targetField]) {
        mapping[targetField] = key;
        break;
      }
    }
  }

  return mapping;
}

// Pembersih angka dari string seperti "Rp 14.000", "5,500.00", dll
function parseNumericVal(val) {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.,]/g, '').replace(/,/g, '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num);
}

// Buka Modal Pratinjau Impor Cerdas
function openImportPreviewModal(fileName, totalCount, mapping, samples) {
  const modal = document.getElementById('modal-excel-preview');
  if (!modal) {
    // Fallback jika modal belum ada di HTML
    if (confirm(`Berhasil mendeteksi ${totalCount} obat dari "${fileName}". Terapkan sekarang?`)) {
      applyImportedMedicines('merge');
    }
    return;
  }

  document.getElementById('import-file-name').textContent = fileName;
  document.getElementById('import-total-count').textContent = totalCount;
  
  // Rincian pemetaan kolom
  const mapList = document.getElementById('import-mapping-details');
  if (mapList) {
    mapList.innerHTML = `
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
        <div><span class="text-slate-400">Barcode:</span> <strong class="text-emerald-700">${mapping.barcode || 'Otomatis'}</strong></div>
        <div><span class="text-slate-400">Nama Obat:</span> <strong class="text-emerald-700">${mapping.nama || '-'}</strong></div>
        <div><span class="text-slate-400">Golongan:</span> <strong class="text-emerald-700">${mapping.kategori || 'Otomatis'}</strong></div>
        <div><span class="text-slate-400">Harga Beli:</span> <strong class="text-emerald-700">${mapping.hargaBeli || 'Otomatis'}</strong></div>
        <div><span class="text-slate-400">Harga Jual:</span> <strong class="text-emerald-700">${mapping.hargaJual || 'Otomatis'}</strong></div>
        <div><span class="text-slate-400">Stok:</span> <strong class="text-emerald-700">${mapping.stok || 'Otomatis'}</strong></div>
      </div>
    `;
  }

  // Sample table
  const sampleTbody = document.getElementById('import-sample-tbody');
  if (sampleTbody) {
    sampleTbody.innerHTML = samples.map(item => `
      <tr class="border-b border-slate-100 text-[11px]">
        <td class="p-2 font-mono">${item.barcode}</td>
        <td class="p-2 font-bold">${item.nama}</td>
        <td class="p-2">${item.kategori}</td>
        <td class="p-2 text-right">${formatRupiah(item.hargaJual)}</td>
        <td class="p-2 text-center font-bold">${item.stok} ${item.satuan}</td>
      </tr>
    `).join('');
  }

  modal.classList.remove('hidden');
}

function closeImportPreviewModal() {
  const modal = document.getElementById('modal-excel-preview');
  if (modal) modal.classList.add('hidden');
}

// Terapkan Hasil Impor
function applyImportedMedicines(mode = 'merge') {
  if (!pendingImportedData || pendingImportedData.length === 0) {
    showToast("Tidak ada data impor untuk diterapkan.", "warning");
    return;
  }

  if (mode === 'replace') {
    if (!confirm(`⚠️ PERINGATAN: Opsi ini akan mengganti seluruh katalog lama dengan ${pendingImportedData.length} obat baru. Lanjutkan?`)) {
      return;
    }
    medicines = [...pendingImportedData];
  } else {
    // Mode Merge (Gabungkan & perbarui jika barcode sudah ada)
    const existingMap = new Map();
    medicines.forEach(m => existingMap.set(m.barcode, m));

    let updatedCount = 0;
    let newCount = 0;

    pendingImportedData.forEach(newItem => {
      if (existingMap.has(newItem.barcode)) {
        const existing = existingMap.get(newItem.barcode);
        existing.nama = newItem.nama;
        existing.hargaBeli = newItem.hargaBeli;
        existing.hargaJual = newItem.hargaJual;
        existing.stok = newItem.stok;
        existing.kategori = newItem.kategori;
        existing.satuan = newItem.satuan;
        if (newItem.tglKadaluarsa) existing.tglKadaluarsa = newItem.tglKadaluarsa;
        updatedCount++;
      } else {
        medicines.push(newItem);
        existingMap.set(newItem.barcode, newItem);
        newCount++;
      }
    });

    showToast(`✅ Berhasil menggabungkan: +${newCount} baru, ${updatedCount} diperbarui!`, "success");
  }

  saveMedicinesToStorage();
  renderInventoryTable();
  updateInventoryStats();
  closeImportPreviewModal();

  // Sinkronkan ke Firebase jika terhubung
  if (isFirebaseConnected && typeof uploadAllLocalDataToFirebase === 'function') {
    if (confirm("Sinkronkan data yang baru diimpor ke Cloud Firebase sekarang?")) {
      uploadAllLocalDataToFirebase();
    }
  }
}
