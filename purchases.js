/**
 * =========================================================================
 * MODUL BARANG MASUK & FAKTUR PEMBELIAN DARI DISTRIBUTOR (purchases.js)
 * Sesuai alur faktur PBF apotek di video:
 * 1. Catat No. Faktur & Supplier/Distributor PBF.
 * 2. Input item obat yang datang (Qty, Satuan, HPP Modal baru, Diskon).
 * 3. Hitung Grand Total Pengeluaran Kulakan Obat secara Real-time.
 * 4. Otomatis Menambah Stok Fisik Obat & Memperbarui HPP di Katalog.
 * 5. Mencatat Pengeluaran Kas di Laporan Omzet & Arus Kas Apotek.
 * =========================================================================
 */

let purchases = [];
let currentPurchaseItems = [];

// Inisialisasi data pembelian dari LocalStorage
function loadPurchasesFromStorage() {
  const stored = localStorage.getItem('apotek_purchases');
  if (stored) {
    try {
      purchases = JSON.parse(stored);
    } catch (e) {
      purchases = [];
    }
  } else {
    // Sample 2 faktur awal dari distributor terpercaya
    purchases = [
      {
        id: "FAK-20261028-001",
        noFaktur: "ENS/2026/10/8892",
        supplier: "PBF Enseval",
        tanggalFaktur: "2026-10-28",
        jatuhTempo: "2026-11-28",
        statusPembayaran: "Lunas",
        totalPengeluaran: 485000,
        totalQty: 35,
        items: [
          { barcode: "2605055", nama: "ACETYLCYSTEINE 200 MG", satuan: "Strip", qty: 10, hargaBeli: 4950, diskonPersen: 0, subtotal: 49500 },
          { barcode: "2605074", nama: "AMLODIPINE 10 MG (HJ)", satuan: "Strip", qty: 25, hargaBeli: 17420, diskonPersen: 0, subtotal: 435500 }
        ],
        catatan: "Faktur kulakan obat rutin bulanan",
        createdAt: "2026-10-28T10:30:00Z"
      },
      {
        id: "FAK-20261102-002",
        noFaktur: "KF/JKT/2026/1109",
        supplier: "PBF Kimia Farma",
        tanggalFaktur: "2026-11-02",
        jatuhTempo: "2026-12-02",
        statusPembayaran: "Tempo (Hutang)",
        totalPengeluaran: 351788,
        totalQty: 28,
        items: [
          { barcode: "2604031", nama: "PARACETAMOL 500 MG (TRIFA)", satuan: "Strip", qty: 20, hargaBeli: 1350, diskonPersen: 0, subtotal: 27000 },
          { barcode: "2605031", nama: "DEMACOLIN TABLET", satuan: "Strip", qty: 8, hargaBeli: 40598.5, diskonPersen: 0, subtotal: 324788 }
        ],
        catatan: "Pesanan restock obat flu & batuk",
        createdAt: "2026-11-02T14:15:00Z"
      }
    ];
    savePurchasesToStorage();
  }
}

function savePurchasesToStorage() {
  localStorage.setItem('apotek_purchases', JSON.stringify(purchases));
  if (typeof updateExpenseStats === 'function') updateExpenseStats();
}

// Inisialisasi tampilan tab Barang Masuk
function renderPurchaseModule() {
  generateNewPurchaseInvoiceNumber();
  renderCurrentPurchaseTable();
  renderPurchaseHistoryTable();
  populateSupplierDatalist();
}

// Generate nomor otomatis faktur internal apotek
function generateNewPurchaseInvoiceNumber() {
  const input = document.getElementById('input-faktur-internal');
  if (input) {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    input.value = `IN-${today}-${rand}`;
  }
  const dateInput = document.getElementById('input-faktur-tanggal');
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }
}

// Master Rekomendasi PBF / Distributor Default
const DEFAULT_PBF_LIST = [
  "PBF Enseval Putera Megatrading",
  "PBF Kimia Farma Trading & Distribution",
  "PBF Parit Padang Global",
  "PBF Mensa Binasukses",
  "PBF Dos Ni Roha",
  "PBF Bina San Prima",
  "PBF Anugrah Argon Medica",
  "PBF Rajawali Nusindo",
  "PBF Antar Mitra Sembada",
  "PBF Penta Valent",
  "PBF Millenium Pharmacon International",
  "PBF Tri Sapta Jaya",
  "PBF Surya Farma",
  "PBF Kebayoran Pharma",
  "PBF Tempo Scan Pasific"
];

// Ambil daftar PBF Kustom dari LocalStorage
function getCustomDistributors() {
  try {
    const raw = localStorage.getItem('apotek_custom_pbfs');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

// Ambil semua PBF (Default + Kustom + Riwayat Faktur Lama)
function getAllDistributors() {
  const customItems = getCustomDistributors();
  const customNames = customItems.map(p => (typeof p === 'string' ? p : p.nama)).filter(Boolean);
  const historyNames = (purchases || []).map(p => p.supplier).filter(Boolean);

  const combined = Array.from(new Set([...DEFAULT_PBF_LIST, ...customNames, ...historyNames]))
    .map(s => String(s || '').trim())
    .filter(s => s.length > 0)
    .sort((a, b) => a.localeCompare(b, 'id'));

  return combined;
}

// Tambah Distributor / PBF Baru ke LocalStorage
function addCustomDistributor(name, sales = '', phone = '', address = '') {
  const trimmed = String(name || '').trim();
  if (!trimmed) return false;

  const customList = getCustomDistributors();
  const existsIdx = customList.findIndex(p => {
    const currentName = typeof p === 'string' ? p : p.nama;
    return String(currentName).toLowerCase() === trimmed.toLowerCase();
  });

  const entry = {
    id: `PBF-${Date.now()}`,
    nama: trimmed,
    sales: String(sales || '').trim(),
    phone: String(phone || '').trim(),
    address: String(address || '').trim(),
    createdAt: new Date().toISOString()
  };

  if (existsIdx >= 0) {
    customList[existsIdx] = entry;
  } else {
    customList.push(entry);
  }

  localStorage.setItem('apotek_custom_pbfs', JSON.stringify(customList));
  populateSupplierDatalist();
  return true;
}

// Hapus Distributor Kustom
function deleteCustomDistributor(name) {
  let customList = getCustomDistributors();
  customList = customList.filter(p => {
    const currentName = typeof p === 'string' ? p : p.nama;
    return String(currentName).toLowerCase() !== String(name).toLowerCase();
  });

  localStorage.setItem('apotek_custom_pbfs', JSON.stringify(customList));
  populateSupplierDatalist();
  renderModalPbfList();
  showToast(`Distributor "${name}" berhasil dihapus dari daftar kustom.`, 'info');
}

// Datalist Rekomendasi PBF / Distributor
function populateSupplierDatalist() {
  const datalist = document.getElementById('supplier-list-options');
  if (!datalist) return;
  const list = getAllDistributors();
  datalist.innerHTML = list.map(pbf => `<option value="${escapeHtml(pbf)}">`).join('');

  // Update badge jumlah PBF jika ada
  const badge = document.getElementById('pbf-registered-count-badge');
  if (badge) {
    badge.textContent = `${list.length} PBF Rekanan`;
  }
}

// Modal Kelola & Tambah PBF
function openAddPbfModal() {
  const modal = document.getElementById('modal-pbf-manager');
  if (!modal) return;
  modal.classList.remove('hidden');
  renderModalPbfList();
  setTimeout(() => {
    const inputName = document.getElementById('modal-pbf-name');
    if (inputName) {
      inputName.value = '';
      inputName.focus();
    }
  }, 100);
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function openManagePbfModal() {
  openAddPbfModal();
}

function closePbfModal() {
  const modal = document.getElementById('modal-pbf-manager');
  if (modal) modal.classList.add('hidden');
}

function handleSaveNewPbf(e) {
  if (e) e.preventDefault();
  const nameInput = document.getElementById('modal-pbf-name');
  const salesInput = document.getElementById('modal-pbf-sales');
  const phoneInput = document.getElementById('modal-pbf-phone');
  const addressInput = document.getElementById('modal-pbf-address');

  if (!nameInput || !nameInput.value.trim()) {
    showToast("Nama distributor / PBF wajib diisi!", "warning");
    return;
  }

  const pbfName = nameInput.value.trim();
  const salesName = salesInput ? salesInput.value.trim() : '';
  const phoneVal = phoneInput ? phoneInput.value.trim() : '';
  const addressVal = addressInput ? addressInput.value.trim() : '';

  addCustomDistributor(pbfName, salesName, phoneVal, addressVal);

  // Otomatis isikan ke input faktur
  const supplierInput = document.getElementById('input-faktur-supplier');
  if (supplierInput) {
    supplierInput.value = pbfName;
  }

  showToast(`✅ Distributor "${pbfName}" berhasil didaftarkan dan dipilih!`, "success");
  closePbfModal();
}

function filterModalPbfList(query) {
  renderModalPbfList(query);
}

function renderModalPbfList(searchQuery = '') {
  const container = document.getElementById('modal-pbf-list-container');
  const countEl = document.getElementById('modal-pbf-count');
  if (!container) return;

  const q = String(searchQuery || '').toLowerCase().trim();
  const customItems = getCustomDistributors();
  const customMap = new Map();
  customItems.forEach(item => {
    const key = (typeof item === 'string' ? item : item.nama).toLowerCase();
    customMap.set(key, item);
  });

  const allNames = getAllDistributors();
  const filtered = q ? allNames.filter(n => n.toLowerCase().includes(q)) : allNames;

  if (countEl) countEl.textContent = allNames.length;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="p-4 text-center text-slate-400 text-xs">
        Tidak ada distributor PBF yang cocok dengan "${escapeHtml(searchQuery)}".
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(name => {
    const isCustom = customMap.has(name.toLowerCase());
    const customData = customMap.get(name.toLowerCase());
    const metaParts = [];
    if (customData && typeof customData === 'object') {
      if (customData.sales) metaParts.push(`Sales: ${escapeHtml(customData.sales)}`);
      if (customData.phone) metaParts.push(`Telp: ${escapeHtml(customData.phone)}`);
    }

    return `
      <div class="p-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
        <div class="min-w-0 pr-2">
          <div class="font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
            <span class="truncate">${escapeHtml(name)}</span>
            ${isCustom ? `<span class="text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-500/20">Kustom</span>` : `<span class="text-[9px] px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-500 font-medium">Bawaan</span>`}
          </div>
          ${metaParts.length > 0 ? `<div class="text-[10px] text-slate-400 dark:text-zinc-500 font-mono mt-0.5">${metaParts.join(' &bull; ')}</div>` : ''}
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button type="button" onclick="selectPbfForInvoice('${escapeHtml(name)}')" class="px-2 py-1 text-[10px] font-bold bg-slate-100 hover:bg-emerald-600 hover:text-white dark:bg-zinc-800 dark:hover:bg-emerald-600 text-slate-700 dark:text-zinc-300 rounded-lg transition-all cursor-pointer">
            Pilih
          </button>
          ${isCustom ? `
            <button type="button" onclick="deleteCustomDistributor('${escapeHtml(name)}')" title="Hapus PBF kustom ini" class="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors cursor-pointer">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function selectPbfForInvoice(name) {
  const supplierInput = document.getElementById('input-faktur-supplier');
  if (supplierInput) {
    supplierInput.value = name;
  }
  closePbfModal();
  showToast(`Distributor "${name}" dipilih untuk faktur.`, 'info');
}

// -------------------------------------------------------------------------
// PENCARIAN & PENAMBAHAN ITEM KE FAKTUR BARANG MASUK
// -------------------------------------------------------------------------
function handlePurchaseDrugSearch(query) {
  const resultsEl = document.getElementById('purchase-search-results');
  if (!resultsEl) return;
  const q = String(query || '').trim().toLowerCase();

  if (q.length < 2) {
    resultsEl.classList.add('hidden');
    return;
  }

  const matches = medicines.filter(m => 
    m.nama.toLowerCase().includes(q) || 
    m.barcode.toLowerCase().includes(q)
  ).slice(0, 8);

  if (matches.length === 0) {
    resultsEl.innerHTML = `
      <div class="p-3 text-slate-500 text-xs flex items-center justify-between">
        <span>Obat tidak ditemukan di katalog.</span>
        <button type="button" onclick="promptAddNewDrugToPurchase('${escapeHtml(q)}')" class="px-2 py-1 bg-emerald-600 text-white font-bold rounded text-[11px] cursor-pointer">
          + Tambah Obat Baru
        </button>
      </div>
    `;
    resultsEl.classList.remove('hidden');
    return;
  }

  resultsEl.innerHTML = matches.map(m => `
    <div onclick="addDrugToPurchase('${m.id}')" class="p-2.5 hover:bg-emerald-50 cursor-pointer border-b border-slate-100 flex items-center justify-between transition-colors">
      <div>
        <div class="font-bold text-slate-900 text-xs">${m.nama}</div>
        <div class="text-[10px] text-slate-400 font-mono">Barcode: ${m.barcode} | Satuan: ${m.satuan}</div>
      </div>
      <div class="text-right">
        <div class="text-xs font-bold text-emerald-700">Modal: ${formatRupiah(m.hargaBeli)}</div>
        <div class="text-[10px] text-slate-500">Stok saat ini: ${m.stok}</div>
      </div>
    </div>
  `).join('');

  resultsEl.classList.remove('hidden');
}

// Tambah obat yang dipilih ke keranjang faktur pembelian
function addDrugToPurchase(medId) {
  const med = medicines.find(m => m.id === medId);
  if (!med) return;

  const existing = currentPurchaseItems.find(item => item.medId === medId);
  if (existing) {
    existing.qty += 1;
    existing.subtotal = calculateItemPurchaseSubtotal(existing);
  } else {
    currentPurchaseItems.push({
      medId: med.id,
      barcode: med.barcode,
      nama: med.nama,
      satuan: med.satuan || 'Strip',
      qty: 1,
      hargaBeli: med.hargaBeli || 0,
      diskonPersen: 0,
      subtotal: med.hargaBeli || 0
    });
  }

  // Tutup dropdown hasil pencarian & bersihkan input
  const searchInput = document.getElementById('input-search-purchase-item');
  const resultsEl = document.getElementById('purchase-search-results');
  if (searchInput) searchInput.value = '';
  if (resultsEl) resultsEl.classList.add('hidden');

  sfx.playBeep();
  renderCurrentPurchaseTable();
}

function calculateItemPurchaseSubtotal(item) {
  const gross = (parseFloat(item.qty) || 0) * (parseFloat(item.hargaBeli) || 0);
  const diskon = (gross * (parseFloat(item.diskonPersen) || 0)) / 100;
  return Math.max(0, Math.round(gross - diskon));
}

// Update nilai qty, harga beli, atau diskon pada baris faktur
function updatePurchaseItemRow(index, field, value) {
  const item = currentPurchaseItems[index];
  if (!item) return;

  if (field === 'qty') {
    item.qty = Math.max(1, parseFloat(value) || 1);
  } else if (field === 'hargaBeli') {
    item.hargaBeli = Math.max(0, parseFloat(value) || 0);
  } else if (field === 'diskonPersen') {
    item.diskonPersen = Math.max(0, Math.min(100, parseFloat(value) || 0));
  } else if (field === 'satuan') {
    item.satuan = String(value).trim();
  }

  item.subtotal = calculateItemPurchaseSubtotal(item);
  renderCurrentPurchaseTable(false);
  if (typeof lucide !== 'undefined') requestAnimationFrame(() => lucide.createIcons());
}

function removePurchaseItemRow(index) {
  currentPurchaseItems.splice(index, 1);
  renderCurrentPurchaseTable();
}

function clearCurrentPurchaseForm() {
  if (currentPurchaseItems.length > 0 && !confirm("Kosongkan daftar barang masuk ini?")) {
    return;
  }
  currentPurchaseItems = [];
  renderCurrentPurchaseTable();
}

// Render Tabel Item Barang Masuk & Grand Total
function renderCurrentPurchaseTable(fullRerender = true) {
  const tbody = document.getElementById('purchase-items-tbody');
  const grandTotalEl = document.getElementById('purchase-grand-total-display');
  const totalItemsCountEl = document.getElementById('purchase-total-items-badge');

  let totalPengeluaran = 0;
  let totalQty = 0;

  currentPurchaseItems.forEach(item => {
    item.subtotal = calculateItemPurchaseSubtotal(item);
    totalPengeluaran += item.subtotal;
    totalQty += item.qty;
  });

  if (grandTotalEl) {
    grandTotalEl.textContent = formatRupiah(totalPengeluaran);
  }
  if (totalItemsCountEl) {
    totalItemsCountEl.textContent = `${currentPurchaseItems.length} Produk (${totalQty} Total Qty)`;
  }

  if (!tbody) return;

  if (currentPurchaseItems.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="p-8 text-center text-slate-400">
          <div class="w-12 h-12 mx-auto mb-2 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500"><i data-lucide="package" class="w-6 h-6"></i></div>
          <div class="font-bold text-slate-600">Belum Ada Item Obat dalam Faktur Ini</div>
          <p class="text-[11px] text-slate-400 mt-1">Cari obat di kolom atas atau scan barcode barang yang baru datang dari distributor</p>
        </td>
      </tr>
    `;
    return;
  }

  if (fullRerender) {
    tbody.innerHTML = currentPurchaseItems.map((item, idx) => `
      <tr class="border-b border-slate-100 dark:border-zinc-800/80 hover:bg-slate-50 dark:hover:bg-zinc-800/40 text-xs transition-colors">
        <td class="p-3 font-mono text-slate-400">${item.barcode}</td>
        <td class="p-3">
          <div class="font-semibold text-slate-900 dark:text-zinc-100">${item.nama}</div>
        </td>
        <td class="p-3 w-28">
          <input type="text" value="${item.satuan}" onchange="updatePurchaseItemRow(${idx}, 'satuan', this.value)" class="w-full px-2 py-1 border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 rounded-lg font-medium text-center focus:outline-none focus:border-emerald-500">
        </td>
        <td class="p-3 w-24">
          <input type="number" min="1" value="${item.qty}" oninput="updatePurchaseItemRow(${idx}, 'qty', this.value)" class="w-full px-2 py-1 border border-emerald-500/50 rounded font-bold text-center bg-emerald-500/10 text-emerald-300 focus:outline-none focus:border-emerald-400 font-mono">
        </td>
        <td class="p-3 w-36">
          <input type="number" min="0" value="${item.hargaBeli}" oninput="updatePurchaseItemRow(${idx}, 'hargaBeli', this.value)" class="w-full px-2 py-1 border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 rounded-lg font-mono text-right font-semibold focus:outline-none focus:border-emerald-500">
        </td>
        <td class="p-3 w-20">
          <input type="number" min="0" max="100" value="${item.diskonPersen}" oninput="updatePurchaseItemRow(${idx}, 'diskonPersen', this.value)" class="w-full px-2 py-1 border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 rounded-lg text-center focus:outline-none focus:border-emerald-500 font-mono">
        </td>
        <td class="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
          ${formatRupiah(item.subtotal)}
        </td>
        <td class="p-3 text-center">
          <button type="button" onclick="removePurchaseItemRow(${idx})" class="text-rose-400 hover:text-rose-300 font-bold p-1 cursor-pointer">
            &times;
          </button>
        </td>
      </tr>
    `).join('');
  }
}

// -------------------------------------------------------------------------
// SIMPAN FAKTUR PEMBELIAN (UPDATE STOK & CATAT PENGELUARAN)
// -------------------------------------------------------------------------
function handleSavePurchaseInvoice(e) {
  if (e) e.preventDefault();

  if (currentPurchaseItems.length === 0) {
    showToast("Tambahkan minimal 1 item obat ke dalam faktur!", "warning");
    return;
  }

  const noFakturEl = document.getElementById('input-faktur-no') || document.getElementById('input-faktur-distributor');
  const noFakturDistributor = noFakturEl ? noFakturEl.value.trim() : '';

  const supplierEl = document.getElementById('input-faktur-supplier');
  const supplierName = (supplierEl ? supplierEl.value.trim() : '') || 'PBF Umum';

  const tglEl = document.getElementById('input-faktur-tanggal');
  const tglFaktur = (tglEl ? tglEl.value : '') || new Date().toISOString().split('T')[0];

  const statusEl = document.getElementById('select-faktur-status-bayar');
  const statusBayar = statusEl ? statusEl.value : 'Lunas';

  const jatuhTempoEl = document.getElementById('input-faktur-jatuh-tempo');
  const jatuhTempo = (jatuhTempoEl ? jatuhTempoEl.value : '') || '-';

  const catatanEl = document.getElementById('input-faktur-catatan');
  const catatan = catatanEl ? catatanEl.value.trim() : '';

  // Otomatis simpan supplier ke daftar custom PBF jika belum ada
  if (supplierName && supplierName !== 'PBF Umum') {
    const allPbfs = getAllDistributors();
    if (!allPbfs.some(p => p.toLowerCase() === supplierName.toLowerCase())) {
      addCustomDistributor(supplierName);
    }
  }

  let totalPengeluaran = 0;
  let totalQty = 0;

  currentPurchaseItems.forEach(item => {
    totalPengeluaran += item.subtotal;
    totalQty += item.qty;
  });

  const newPurchase = {
    id: `FAK-${Date.now()}`,
    noFaktur: noFakturDistributor || `FAK-${Date.now().toString().slice(-6)}`,
    supplier: escapeHtml(supplierName),
    tanggalFaktur: tglFaktur,
    jatuhTempo: statusBayar === 'Tempo (Hutang)' ? jatuhTempo : '-',
    statusPembayaran: statusBayar,
    totalPengeluaran: totalPengeluaran,
    totalQty: totalQty,
    items: [...currentPurchaseItems],
    catatan: escapeHtml(catatan),
    createdAt: new Date().toISOString()
  };

  // 1. Tambahkan ke riwayat pembelian
  purchases.unshift(newPurchase);
  savePurchasesToStorage();

  // 2. OTOMATIS TAMBAHKAN STOK & PERBARUI HPP OBAT DI KATALOG
  let updatedStockCount = 0;
  currentPurchaseItems.forEach(item => {
    let med = medicines.find(m => m.id === item.medId || m.barcode === item.barcode);
    if (med) {
      med.stok += parseInt(item.qty, 10);
      if (item.hargaBeli > 0) {
        med.hargaBeli = item.hargaBeli; // Update harga modal terbaru dari distributor
      }
      med.produsen = supplierName;
      updatedStockCount++;
      if (typeof syncMedicineToCloud === 'function') syncMedicineToCloud(med);
    }
  });

  saveMedicinesToStorage();
  renderInventoryTable();
  updateInventoryStats();

  // Audio efek pembayaran/pembelian sukses
  sfx.playSuccessPayment();

  showToast(`✅ Faktur ${newPurchase.noFaktur} berhasil disimpan! Stok ${updatedStockCount} obat otomatis bertambah.`, "success");

  // Reset Form
  currentPurchaseItems = [];
  const formEl = document.getElementById('form-purchase-invoice') || document.getElementById('form-pembelian-barang');
  if (formEl) formEl.reset();
  renderPurchaseModule();

  // Sinkronkan data faktur ke Firebase jika terhubung
  if (isFirebaseConnected && db) {
    db.collection('purchases').doc(newPurchase.id).set(newPurchase).catch(err => {
      console.warn("Firebase purchase sync error:", err);
    });
  }
}

// -------------------------------------------------------------------------
// RIWAYAT FAKTUR BARANG MASUK DARI DISTRIBUTOR
// -------------------------------------------------------------------------
function renderPurchaseHistoryTable() {
  const tbody = document.getElementById('purchase-history-tbody');
  const countBadge = document.getElementById('purchase-history-count');
  const totalExpenseStat = document.getElementById('purchase-stat-total-expense');

  if (countBadge) countBadge.textContent = `${purchases.length} Faktur`;

  const grandTotalAllPurchases = purchases.reduce((acc, p) => acc + (p.totalPengeluaran || 0), 0);
  if (totalExpenseStat) totalExpenseStat.textContent = formatRupiah(grandTotalAllPurchases);
  if (typeof lucide !== 'undefined') requestAnimationFrame(() => lucide.createIcons());

  if (!tbody) return;

  if (purchases.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="p-8 text-center text-slate-400">
          Belum ada riwayat faktur pembelian dari distributor.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = purchases.map((p, idx) => {
    const isTempo = p.statusPembayaran.includes('Tempo') || p.statusPembayaran.includes('Hutang');
    return `
      <tr class="border-b border-slate-100 dark:border-zinc-800/80 hover:bg-slate-50 dark:hover:bg-zinc-800/40 text-xs transition-colors">
        <td class="p-3 font-mono font-semibold text-slate-200">${p.noFaktur}</td>
        <td class="p-3 font-medium text-slate-300">${p.supplier}</td>
        <td class="p-3 text-slate-400">${formatDateIndo(p.tanggalFaktur)}</td>
        <td class="p-3">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${isTempo ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'}">
            ${p.statusPembayaran}
          </span>
          ${isTempo && p.jatuhTempo !== '-' ? `<div class="text-[10px] text-amber-400 mt-0.5 font-mono">Jatuh Tempo: ${p.jatuhTempo}</div>` : ''}
        </td>
        <td class="p-3 text-center font-medium text-slate-300">${p.totalQty} item</td>
        <td class="p-3 text-right font-mono font-bold text-rose-400">${formatRupiah(p.totalPengeluaran)}</td>
        <td class="p-3 text-center">
          <div class="flex items-center justify-center gap-1.5">
            <button type="button" onclick="viewPurchaseDetailModal('${p.id}')" class="px-2.5 py-1 bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 border border-white/[0.1] rounded text-[11px] font-semibold cursor-pointer transition-colors">
              Lihat Detail
            </button>
            <button type="button" onclick="deletePurchaseRecord('${p.id}')" class="p-1 text-rose-400 hover:text-rose-300 font-bold text-xs cursor-pointer" title="Hapus Faktur">
              &times;
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Lihat Rincian Faktur dalam Modal
function viewPurchaseDetailModal(fakturId) {
  const p = purchases.find(item => item.id === fakturId);
  if (!p) return;

  const modal = document.getElementById('modal-purchase-detail');
  if (!modal) {
    alert(`Faktur: ${p.noFaktur}\nSupplier: ${p.supplier}\nTotal: ${formatRupiah(p.totalPengeluaran)}\nItem: ${p.items.length} macam obat.`);
    return;
  }

  document.getElementById('detail-faktur-no').textContent = p.noFaktur;
  document.getElementById('detail-faktur-supplier').textContent = p.supplier;
  document.getElementById('detail-faktur-tgl').textContent = formatDateIndo(p.tanggalFaktur);
  document.getElementById('detail-faktur-status').textContent = p.statusPembayaran;
  document.getElementById('detail-faktur-grand-total').textContent = formatRupiah(p.totalPengeluaran);

  const tbody = document.getElementById('detail-faktur-items-tbody');
  if (tbody) {
    tbody.innerHTML = p.items.map(it => `
      <tr class="border-b border-slate-100 text-xs">
        <td class="p-2 font-mono">${it.barcode}</td>
        <td class="p-2 font-bold">${it.nama}</td>
        <td class="p-2 text-center">${it.qty} ${it.satuan}</td>
        <td class="p-2 text-right">${formatRupiah(it.hargaBeli)}</td>
        <td class="p-2 text-center">${it.diskonPersen || 0}%</td>
        <td class="p-2 text-right font-bold text-slate-900">${formatRupiah(it.subtotal)}</td>
      </tr>
    `).join('');
  }

  modal.classList.remove('hidden');
}

function closePurchaseDetailModal() {
  const modal = document.getElementById('modal-purchase-detail');
  if (modal) modal.classList.add('hidden');
}

function deletePurchaseRecord(fakturId) {
  if (typeof requireOwnerPIN === 'function') {
    requireOwnerPIN('Hapus Faktur Pembelian', () => {
      if (confirm("Hapus catatan faktur ini dari riwayat pengeluaran? (Stok obat yang sudah masuk tidak akan otomatis berkurang).")) {
        purchases = purchases.filter(p => p.id !== fakturId);
        savePurchasesToStorage();
        renderPurchaseHistoryTable();
        showToast("Catatan faktur telah dihapus.", "info");
      }
    });
  }
}

// Export Faktur Pembelian ke File Excel (.xlsx)
function exportPurchasesToExcel() {
  if (typeof XLSX === 'undefined') {
    showToast("Library Excel sedang dimuat...", "warning");
    return;
  }
  if (purchases.length === 0) {
    showToast("Belum ada data faktur pembelian distributor untuk diekspor.", "info");
    return;
  }

  const summaryRows = purchases.map((p, idx) => ({
    "No": idx + 1,
    "No. Faktur PBF": p.noFaktur,
    "Nama Distributor (PBF)": p.supplier,
    "Tanggal Faktur": p.tanggalFaktur,
    "Status Bayar": p.statusPembayaran,
    "Jatuh Tempo": p.jatuhTempo,
    "Jumlah Obat": p.items.length,
    "Total Qty": p.totalQty,
    "Total Pengeluaran (Rp)": p.totalPengeluaran,
    "Catatan": p.catatan || '-'
  }));

  const itemRows = [];
  purchases.forEach(p => {
    p.items.forEach(it => {
      itemRows.push({
        "No. Faktur": p.noFaktur,
        "Distributor": p.supplier,
        "Tanggal": p.tanggalFaktur,
        "Barcode": it.barcode,
        "Nama Obat": it.nama,
        "Satuan": it.satuan,
        "Qty Masuk": it.qty,
        "Harga Modal Beli (HPP)": it.hargaBeli,
        "Diskon (%)": it.diskonPersen,
        "Total Biaya Item": it.subtotal
      });
    });
  });

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  const wsItems = XLSX.utils.json_to_sheet(itemRows);

  wsSummary['!cols'] = [
    { wch: 6 }, { wch: 22 }, { wch: 28 }, { wch: 14 },
    { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 12 },
    { wch: 20 }, { wch: 24 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, wsSummary, "Ringkasan Faktur PBF");
  XLSX.utils.book_append_sheet(workbook, wsItems, "Rincian Obat Masuk");

  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Apotek_Faktur_Pembelian_${today}.xlsx`);
  showToast(`✅ Berhasil mengekspor faktur pembelian ke Excel!`, "success");
}

// Sinkronkan Total Pengeluaran ke Tab Laporan Omzet
function updateExpenseStats() {
  const totalExpense = purchases.reduce((acc, p) => acc + (p.totalPengeluaran || 0), 0);
  const statExpenseEl = document.getElementById('report-total-expense');
  const statCashflowNetEl = document.getElementById('report-net-cashflow');

  if (statExpenseEl) {
    statExpenseEl.textContent = formatRupiah(totalExpense);
  }

  // Hitung Arus Kas Bersih = Total Omzet Penjualan - Total Pengeluaran Pembelian Obat
  if (statCashflowNetEl && typeof transactions !== 'undefined') {
    const totalOmzet = transactions.reduce((acc, t) => acc + (t.totalAkhir || t.grandTotal || 0), 0);
    const netCash = totalOmzet - totalExpense;
    statCashflowNetEl.textContent = formatRupiah(netCash);
    if (netCash >= 0) {
      statCashflowNetEl.className = "text-xl sm:text-2xl font-black text-emerald-700 mt-1 font-mono-numbers";
    } else {
      statCashflowNetEl.className = "text-xl sm:text-2xl font-black text-rose-600 mt-1 font-mono-numbers";
    }
  }
}

// Global Window Bindings for PBF & Purchases
window.savePurchaseInvoice = handleSavePurchaseInvoice;
window.handleSavePurchaseInvoice = handleSavePurchaseInvoice;
window.openAddPbfModal = openAddPbfModal;
window.openManagePbfModal = openManagePbfModal;
window.closePbfModal = closePbfModal;
window.handleSaveNewPbf = handleSaveNewPbf;
window.filterModalPbfList = filterModalPbfList;
window.deleteCustomDistributor = deleteCustomDistributor;
window.selectPbfForInvoice = selectPbfForInvoice;
