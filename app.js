
// Auto-render Lucide SVG Icons across dynamic views
function triggerLucideIcons() {
  if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
    requestAnimationFrame(() => lucide.createIcons());
  }
}
/**
 * =========================================================================
 * APLIKASI KASIR APOTEK (PHARMACY POS) - LOGIKA UTAMA (app.js)
 * Fitur Utama:
 * 1. Scanner Barcode Kamera (html5-qrcode) + Suara Beep Otentik
 * 2. Deteksi Cerdas Barcode Belum Terdaftar -> Form Tambah & Penyesuaian Harga
 * 3. Transaksi Kasir, Keranjang, Multi-pembayaran & Kembalian
 * 4. Cetak Struk Format Thermal 58mm / 80mm
 * 5. Manajemen Katalog Obat, Stok & Tanggal Kadaluarsa (ED)
 * 6. Riwayat Penjualan & Laporan Laba Bersih
 * =========================================================================
 */

// Global State
let medicines = [];
let cart = [];
let transactions = [];
let settings = {};
let activeTab = 'kasir';
let html5QrCode = null;
let isCameraRunning = false;
let currentCameraId = null;
let currentInvoiceNumber = '';
let currentPaymentMethod = 'Tunai';

// Web Audio API Sound Synthesizer (Bekerja offline tanpa file audio eksternal)
class SoundEffects {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
  }

  // Beep Kasir Sukses (880Hz - nada tinggi singkat khas scanner supermarket/apotek)
  playBeep() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime); // A5

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch (e) {
      console.warn("Audio feedback error:", e);
    }
  }

  // Notifikasi Barang Baru / Belum Terdaftar (Dua nada perhatian 480Hz -> 720Hz)
  playAlertNewItem() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.setValueAtTime(720, now + 0.12);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(now + 0.28);
    } catch (e) {
      console.warn("Audio feedback error:", e);
    }
  }

  // Notifikasi Transaksi Sukses (Harmoni nada riang)
  playSuccessPayment() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = this.ctx.currentTime + (idx * 0.08);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.18);
      });
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }
}

const sfx = new SoundEffects();

// =========================================================================
// INISIALISASI APLIKASI
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
  loadDataFromStorage();
  if (typeof loadPurchasesFromStorage === 'function') loadPurchasesFromStorage();
  initClock();
  generateNewInvoiceNumber();
  renderCart();
  renderPosQuickGrid();
  renderInventoryTable();
  renderTransactionHistory();
  updateInventoryStats();
  if (typeof updateExpenseStats === 'function') updateExpenseStats();
  applySettingsToUI();
  initCameraScannerList();
  if (typeof initFirebaseSync === 'function') initFirebaseSync();

  // URL Params Handler untuk Preview / Screenshot Mode
  const urlParams = new URLSearchParams(window.location.search);
  const testMode = urlParams.get('test');
  if (testMode === 'unreg') {
    addProductToCart(medicines[0]);
    addProductToCart(medicines[1]);
    setTimeout(() => {
      openUnregisteredItemModal('8999908009999');
      autoFillUnregDrug('Paracetamol 500 mg');
    }, 200);
  } else if (testMode === 'stok') {
    setTimeout(() => {
      switchTab('stok');
    }, 100);
  } else if (testMode === 'kasir_demo') {
    addProductToCart(medicines[0]);
    addProductToCart(medicines[1]);
    addProductToCart(medicines[2]);
    document.getElementById('input-cash-received').value = 50000;
    calculateCashChange();
  } else if (testMode === 'struk') {
    setTimeout(() => {
      reprintReceipt(transactions[0].id);
    }, 150);
  } else if (testMode === 'riwayat') {
    setTimeout(() => {
      switchTab('riwayat');
    }, 100);
  }
});

// Versi data master apotek (Update otomatis jika ada master catalog baru)
const APOTEK_CATALOG_VERSION = 'v3_indications_rbac';

// Load state dari LocalStorage dengan fallback data awal
function loadDataFromStorage() {
  const currentCatalogVer = localStorage.getItem('apotek_catalog_version');
  const storedMeds = localStorage.getItem('apotek_medicines');

  // Jika versi belum diperbarui atau data lama masih dummy (< 100 items), muat 1.098 data master
  if (!storedMeds || currentCatalogVer !== APOTEK_CATALOG_VERSION) {
    medicines = [...INITIAL_MEDICINES];
    saveMedicinesToStorage();
    localStorage.setItem('apotek_catalog_version', APOTEK_CATALOG_VERSION);
    console.log("Master catalog updated to 1,098 medicines.");
  } else {
    try {
      medicines = JSON.parse(storedMeds);
      if (!Array.isArray(medicines) || medicines.length < 100) {
        medicines = [...INITIAL_MEDICINES];
        saveMedicinesToStorage();
      }
    } catch (e) {
      medicines = [...INITIAL_MEDICINES];
      saveMedicinesToStorage();
    }
  }

  const storedTrx = localStorage.getItem('apotek_transactions');
  if (storedTrx) {
    try {
      transactions = JSON.parse(storedTrx);
    } catch (e) {
      transactions = [...SAMPLE_TRANSACTIONS];
    }
  } else {
    transactions = [...SAMPLE_TRANSACTIONS];
    saveTransactionsToStorage();
  }

  const storedSettings = localStorage.getItem('apotek_settings');
  if (storedSettings) {
    try {
      settings = JSON.parse(storedSettings);
      if (!settings.qrisImage) settings.qrisImage = 'qris-apotek.jpg';
      if (!settings.qrisNmid) settings.qrisNmid = 'ID1026516980707';
      if (!settings.qrisMerchant) settings.qrisMerchant = 'Apotek El-Jannah Medika';
    } catch (e) {
      settings = { ...DEFAULT_SETTINGS };
    }
  } else {
    settings = { ...DEFAULT_SETTINGS };
    saveSettingsToStorage();
  }
}

function saveMedicinesToStorage() {
  localStorage.setItem('apotek_medicines', JSON.stringify(medicines));
  updateInventoryStats();
}

function saveTransactionsToStorage() {
  localStorage.setItem('apotek_transactions', JSON.stringify(transactions));
}

function saveSettingsToStorage() {
  localStorage.setItem('apotek_settings', JSON.stringify(settings));
}

// Jam Digital & Tanggal
function initClock() {
  function updateTime() {
    const now = new Date();
    const clockEl = document.getElementById('digital-clock');
    const dateEl = document.getElementById('digital-date');
    if (clockEl) {
      clockEl.textContent = now.toLocaleTimeString('id-ID', { hour12: false });
    }
    if (dateEl) {
      const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
      dateEl.textContent = now.toLocaleDateString('id-ID', options);
    }
  }
  updateTime();
  setInterval(updateTime, 1000);
}

// Generate Invoice Number Baru (Format TRX-YYYYMMDD-XXXX)
function generateNewInvoiceNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randomSuffix = String(Math.floor(1000 + Math.random() * 9000));
  currentInvoiceNumber = `TRX-${year}${month}${day}-${randomSuffix}`;
  
  const invEl = document.getElementById('current-invoice-number');
  if (invEl) invEl.textContent = currentInvoiceNumber;
}

// Format Rupiah Helper
function formatRupiah(number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(number || 0);
}

// Format Tanggal Indonesia
function formatDateIndo(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

// =========================================================================
// NAVIGASI TAB
// =========================================================================
function switchTab(tabId) {
  // Proteksi Hak Akses: Tab Barang Masuk & Pengaturan khusus Super Admin
  if ((tabId === 'pembelian' || tabId === 'pengaturan') && typeof currentRole !== 'undefined' && currentRole !== 'superadmin') {
    requestSuperAdminLogin(() => {
      switchTab(tabId);
    });
    return;
  }

  activeTab = tabId;

  // Update button active state for Shadcn tabs
  document.querySelectorAll('.shadcn-tab-trigger, .nav-tab').forEach(btn => {
    btn.classList.remove('active');
  });

  const activeBtn = document.getElementById(`tab-btn-${tabId}`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  triggerLucideIcons();

  // Update contents
  document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.add('hidden'));
  const activePane = document.getElementById(`tab-content-${tabId}`);
  if (activePane) activePane.classList.remove('hidden');

  // Trigger refresh on specific tabs
  if (tabId === 'pembelian') {
    if (typeof renderPurchaseModule === 'function') renderPurchaseModule();
  } else if (tabId === 'stok') {
    renderInventoryTable();
    updateInventoryStats();
  } else if (tabId === 'riwayat') {
    renderTransactionHistory();
    if (typeof updateExpenseStats === 'function') updateExpenseStats();
  } else if (tabId === 'pengaturan') {
    populateSettingsForm();
    if (typeof populateFirebaseSettingsForm === 'function') populateFirebaseSettingsForm();
  }
}

// =========================================================================
// INTEGRASI SCANNER KAMERA BARCODE (html5-qrcode)
// =========================================================================
async function initCameraScannerList() {
  const cameraSelect = document.getElementById('camera-select');
  if (!cameraSelect) return;

  if (typeof Html5Qrcode === 'undefined') {
    console.warn("Library html5-qrcode belum termuat.");
    return;
  }

  try {
    const devices = await Html5Qrcode.getCameras();
    cameraSelect.innerHTML = '';
    if (devices && devices.length > 0) {
      devices.forEach((device, index) => {
        const option = document.createElement('option');
        option.value = device.id;
        // Prioritas kamera belakang (back/environment camera) untuk scan barcode
        const label = device.label || `Kamera ${index + 1}`;
        option.text = label;
        if (label.toLowerCase().includes('back') || label.toLowerCase().includes('belakang') || label.toLowerCase().includes('environment')) {
          option.selected = true;
          currentCameraId = device.id;
        }
        cameraSelect.appendChild(option);
      });
      if (!currentCameraId) currentCameraId = devices[0].id;
    } else {
      cameraSelect.innerHTML = '<option value="">Tidak ada kamera terdeteksi</option>';
    }
  } catch (err) {
    console.warn("Gagal mendeteksi kamera:", err);
    cameraSelect.innerHTML = '<option value="">Izin kamera diperlukan</option>';
  }

  cameraSelect.addEventListener('change', (e) => {
    currentCameraId = e.target.value;
    if (isCameraRunning) {
      stopCameraScanner().then(() => startCameraScanner());
    }
  });
}

async function toggleCameraScanner() {
  if (isCameraRunning) {
    await stopCameraScanner();
  } else {
    await startCameraScanner();
  }
}

async function startCameraScanner() {
  const viewportEl = document.getElementById('barcode-reader-viewport');
  const placeholderEl = document.getElementById('scanner-placeholder');
  const overlayEl = document.getElementById('scanner-overlay');
  const btnText = document.getElementById('camera-btn-text');
  const toggleBtn = document.getElementById('btn-toggle-camera');

  if (!viewportEl) return;

  try {
    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode("barcode-reader-viewport");
    }

    const config = {
      fps: 15,
      qrbox: { width: 250, height: 160 },
      aspectRatio: 1.333334,
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true
      }
    };

    const cameraIdOrConfig = currentCameraId ? currentCameraId : { facingMode: "environment" };

    await html5QrCode.start(
      cameraIdOrConfig,
      config,
      (decodedText, decodedResult) => {
        handleBarcodeScanned(decodedText.trim());
      },
      (errorMessage) => {
        // Ignored frame parse error during normal scanning
      }
    );

    isCameraRunning = true;
    const drawerEl = document.getElementById('camera-scanner-drawer');
    if (drawerEl) drawerEl.classList.remove('hidden');
    placeholderEl.classList.add('hidden');
    overlayEl.classList.remove('hidden');
    btnText.textContent = 'Matikan';
    toggleBtn.classList.remove('bg-emerald-600', 'hover:bg-emerald-700');
    toggleBtn.classList.add('bg-rose-600', 'hover:bg-rose-700');

    showToast("Kamera aktif. Arahkan ke barcode kemasan obat.", "info");
  } catch (err) {
    console.error("Gagal menyalakan kamera:", err);
    showToast("Gagal mengakses kamera. Pastikan izin kamera diberikan di browser.", "danger");
  }
}

async function stopCameraScanner() {
  if (html5QrCode && isCameraRunning) {
    try {
      await html5QrCode.stop();
    } catch (e) {
      console.warn("Stop scanner error:", e);
    }
  }

  isCameraRunning = false;
  const placeholderEl = document.getElementById('scanner-placeholder');
  const overlayEl = document.getElementById('scanner-overlay');
  const btnText = document.getElementById('camera-btn-text');
  const toggleBtn = document.getElementById('btn-toggle-camera');

  if (placeholderEl) placeholderEl.classList.remove('hidden');
  if (overlayEl) overlayEl.classList.add('hidden');
  if (btnText) btnText.textContent = 'Buka Kamera';
  if (toggleBtn) {
    toggleBtn.classList.remove('bg-rose-600', 'hover:bg-rose-700');
    toggleBtn.classList.add('bg-emerald-600', 'hover:bg-emerald-700');
  }
}

// =========================================================================
// LOGIKA INTI: PEMERIKSAAN HASIL SCAN BARCODE
// =========================================================================
let lastScanTimestamp = 0;
let lastScannedCode = '';

function handleBarcodeScanned(rawBarcode) {
  if (!rawBarcode) return;
  const barcode = rawBarcode.trim();

  // Hindari scan berulang bertubi-tubi dalam jeda < 1.5 detik untuk kode yang sama
  const now = Date.now();
  if (barcode === lastScannedCode && (now - lastScanTimestamp) < 1500) {
    return;
  }
  lastScanTimestamp = now;
  lastScannedCode = barcode;

  // Update Status Log Terakhir
  const lastScannedText = document.getElementById('last-scanned-text');
  const lastScannedTime = document.getElementById('last-scanned-time');
  if (lastScannedText) lastScannedText.textContent = `Barcode: ${barcode}`;
  if (lastScannedTime) lastScannedTime.textContent = new Date().toLocaleTimeString('id-ID');

  // Cari apakah barcode sudah ada di database apotek
  const existingProduct = medicines.find(m => m.barcode === barcode);

  if (existingProduct) {
    // ==========================================================
    // KASUS 1: PRODUK SUDAH TERDAFTAR
    // ==========================================================
    sfx.playBeep();

    if (activeTab === 'kasir') {
      addProductToCart(existingProduct);
      showToast(`✅ ${existingProduct.nama} (+1) - ${formatRupiah(existingProduct.hargaJual)}`, 'success');
    } else {
      // Jika kasir sedang di tab katalog, buka dialog edit barang tersebut
      openEditProductModal(existingProduct.id);
      showToast(`Ditemukan: ${existingProduct.nama}`, 'info');
    }

  } else {
    // ==========================================================
    // KASUS 2: BARANG BELUM MASUK DENGAN KODE INI (PERMINTAAN USER)
    // Otomatis buka form tambah obat baru & penyesuaian harga oleh pemilik
    // ==========================================================
    sfx.playAlertNewItem();

    // Hentikan/pause sementara scanner agar tidak terus memindai saat dialog terbuka
    showToast(`⚠️ Barcode ${barcode} belum terdaftar! Silakan lengkapi data barang.`, 'warning');
    openUnregisteredItemModal(barcode);
  }
}

// Input Barcode Manual Form Submit
function handleManualBarcodeSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('input-barcode-manual');
  if (!input) return;
  const val = input.value.trim();
  if (val) {
    handleBarcodeScanned(val);
    input.value = '';
  }
}

// Simulator Scan Barcode (Untuk pengujian tanpa kamera)
function simulateBarcodeScan(code) {
  closeBarcodeTesterModal();
  handleBarcodeScanned(code);
}

// =========================================================================
// MODAL KHUSUS: BARANG BELUM TERDAFTAR (UNREGISTERED ITEM)
// =========================================================================
function openUnregisteredItemModal(scannedBarcode) {
  const modal = document.getElementById('modal-unregistered-item');
  const badge = document.getElementById('unreg-modal-barcode-badge');
  const hiddenInput = document.getElementById('unreg-barcode-val');
  const nameInput = document.getElementById('unreg-nama');
  const buyPriceInput = document.getElementById('unreg-harga-beli');
  const sellPriceInput = document.getElementById('unreg-harga-jual');
  const stockInput = document.getElementById('unreg-stok');
  const edInput = document.getElementById('unreg-ed');
  const produsenInput = document.getElementById('unreg-produsen');
  const rakInput = document.getElementById('unreg-rak');

  if (!modal) return;

  // Reset form
  document.getElementById('form-unregistered-item').reset();

  badge.textContent = scannedBarcode;
  hiddenInput.value = scannedBarcode;

  // Default Expired: 2 tahun dari sekarang (standar obat baru masuk)
  const defaultED = new Date();
  defaultED.setFullYear(defaultED.getFullYear() + 2);
  edInput.value = defaultED.toISOString().split('T')[0];

  stockInput.value = 10;
  calculateUnregMargin();

  modal.classList.remove('hidden');
  setTimeout(() => nameInput.focus(), 150);
}

function closeUnregisteredModal() {
  const modal = document.getElementById('modal-unregistered-item');
  if (modal) modal.classList.add('hidden');
  hideUnregSuggestions();
}

// Auto-fill dari tombol saran cepat obat
function autoFillUnregDrug(drugName) {
  const ref = DRUG_DATABASE_REFERENCE.find(d => d.nama === drugName);
  if (ref) {
    applyDrugReferenceToUnregForm(ref);
  }
}

// Live Search Autocomplete saat mengetik nama obat
function handleUnregNameInput(query) {
  const box = document.getElementById('unreg-suggestions-box');
  if (!box) return;

  if (!query || query.trim().length < 2) {
    box.classList.add('hidden');
    box.innerHTML = '';
    return;
  }

  const results = searchDrugReference(query);
  if (results.length === 0) {
    box.classList.add('hidden');
    box.innerHTML = '';
    return;
  }

  box.innerHTML = results.map(item => `
    <div class="p-2.5 hover:bg-emerald-50 cursor-pointer transition-colors" onclick='selectDrugReferenceSuggestion(${JSON.stringify(item).replace(/'/g, "&#39;")})'>
      <div class="flex justify-between items-baseline">
        <span class="font-bold text-slate-800 text-xs">${item.nama}</span>
        <span class="text-[10px] text-emerald-700 font-semibold">${formatRupiah(item.hargaJual)}</span>
      </div>
      <div class="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
        <span class="px-1.5 py-0.2 rounded bg-slate-100 text-[10px]">${item.kategori}</span>
        <span>Satuan: ${item.satuan}</span>
        <span>Est. Modal: ${formatRupiah(item.hargaBeli)}</span>
      </div>
    </div>
  `).join('');

  box.classList.remove('hidden');
}

function hideUnregSuggestions() {
  const box = document.getElementById('unreg-suggestions-box');
  if (box) box.classList.add('hidden');
}

function selectDrugReferenceSuggestion(item) {
  applyDrugReferenceToUnregForm(item);
  hideUnregSuggestions();
}

function applyDrugReferenceToUnregForm(ref) {
  document.getElementById('unreg-nama').value = ref.nama;
  document.getElementById('unreg-kategori').value = ref.kategori;
  document.getElementById('unreg-satuan').value = ref.satuan;
  document.getElementById('unreg-harga-beli').value = ref.hargaBeli;
  document.getElementById('unreg-harga-jual').value = ref.hargaJual;
  if (ref.produsen) document.getElementById('unreg-produsen').value = ref.produsen;

  calculateUnregMargin();
  showToast(`Referensi '${ref.nama}' dimuat. Sesuaikan harga bila perlu.`, 'info');
}

// Kalkulasi margin laba real-time di form
function calculateUnregMargin() {
  const buy = parseFloat(document.getElementById('unreg-harga-beli').value) || 0;
  const sell = parseFloat(document.getElementById('unreg-harga-jual').value) || 0;
  const label = document.getElementById('unreg-margin-label');

  if (!label) return;

  const profit = sell - buy;
  const percent = buy > 0 ? ((profit / buy) * 100).toFixed(1) : 0;

  if (profit >= 0) {
    label.className = "font-bold text-emerald-700";
    label.textContent = `${formatRupiah(profit)} (${percent}%)`;
  } else {
    label.className = "font-bold text-rose-600";
    label.textContent = `Rugi: ${formatRupiah(profit)} (${percent}%)`;
  }
}

// Simpan Barang Baru & Langsung Masukkan ke Keranjang Kasir
function handleSaveUnregisteredItem(e) {
  e.preventDefault();
  saveUnregisteredCore(true);
}

// Simpan ke Katalog Saja Tanpa Masuk Keranjang
function saveUnregisteredOnlyCatalog() {
  saveUnregisteredCore(false);
}

function saveUnregisteredCore(alsoAddToCart = true) {
  const barcode = document.getElementById('unreg-barcode-val').value.trim();
  const nama = document.getElementById('unreg-nama').value.trim();
  const kategori = document.getElementById('unreg-kategori').value;
  const satuan = document.getElementById('unreg-satuan').value;
  const hargaBeli = parseFloat(document.getElementById('unreg-harga-beli').value) || 0;
  const hargaJual = parseFloat(document.getElementById('unreg-harga-jual').value) || 0;
  const stok = parseInt(document.getElementById('unreg-stok').value, 10) || 10;
  const tglKadaluarsa = document.getElementById('unreg-ed').value || '';
  const produsen = document.getElementById('unreg-produsen').value.trim() || 'Apotek';
  const rak = document.getElementById('unreg-rak').value.trim() || 'Etalase';

  if (!barcode || !nama || hargaJual <= 0) {
    showToast("Nama obat dan harga jual wajib diisi dengan benar!", "danger");
    return;
  }

  // Buat objek obat baru
  const newMedicine = {
    id: `med-${Date.now()}`,
    barcode,
    nama,
    kategori,
    satuan,
    hargaBeli,
    hargaJual,
    stok,
    stokMinimal: 10,
    tglKadaluarsa,
    produsen,
    rak,
    createdAt: new Date().toISOString()
  };

  medicines.push(newMedicine);
  saveMedicinesToStorage();
  if (typeof syncMedicineToCloud === 'function') syncMedicineToCloud(newMedicine);
  renderInventoryTable();
  closeUnregisteredModal();

  sfx.playBeep();

  if (alsoAddToCart && activeTab === 'kasir') {
    addProductToCart(newMedicine);
    showToast(`✨ Obat baru '${nama}' berhasil didata & masuk ke keranjang kasir!`, "success");
  } else {
    showToast(`✨ Obat baru '${nama}' berhasil disimpan ke katalog stok!`, "success");
  }
}

// =========================================================================
// LOGIKA KERANJANG KASIR & CHECKOUT
// =========================================================================
function addProductToCart(product) {
  // Cek apakah item sudah ada di keranjang
  const existingCartIndex = cart.findIndex(c => c.id === product.id);

  if (existingCartIndex > -1) {
    // Cek batas stok
    if (cart[existingCartIndex].qty + 1 > product.stok) {
      showToast(`Peringatan: Stok ${product.nama} hanya tersisa ${product.stok} ${product.satuan}!`, "warning");
    }
    cart[existingCartIndex].qty += 1;
    cart[existingCartIndex].subtotal = cart[existingCartIndex].qty * cart[existingCartIndex].hargaJual;
  } else {
    // Tambah item baru ke keranjang
    if (product.stok <= 0) {
      showToast(`Peringatan: Stok obat ini saat ini 0!`, "warning");
    }
    cart.push({
      id: product.id,
      barcode: product.barcode,
      nama: product.nama,
      kategori: product.kategori,
      satuan: product.satuan,
      hargaBeli: product.hargaBeli,
      hargaJual: product.hargaJual,
      qty: 1,
      subtotal: product.hargaJual,
      stok: product.stok,
      tglKadaluarsa: product.tglKadaluarsa,
      indikasi: product.indikasi || '',
      aturanPakai: product.aturanPakai || ''
    });
  }

  renderCart();
}

function updateCartQty(index, newQty) {
  const qty = parseInt(newQty, 10);
  if (isNaN(qty) || qty <= 0) {
    removeFromCart(index);
    return;
  }

  const item = cart[index];
  if (qty > item.stok) {
    showToast(`Stok ${item.nama} hanya ${item.stok} ${item.satuan}!`, 'warning');
  }

  item.qty = qty;
  item.subtotal = item.qty * item.hargaJual;
  renderCart();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  renderCart();
}

function clearCart() {
  if (cart.length === 0) return;
  cart = [];
  renderCart();
  showToast("Keranjang berhasil dikosongkan.", "info");
}

function renderCart() {
  const container = document.getElementById('cart-items-container');
  const countBadge = document.getElementById('cart-item-count-badge');
  const checkoutBtn = document.getElementById('btn-process-checkout');

  if (!container) return;

  const totalItemsCount = cart.reduce((acc, curr) => acc + curr.qty, 0);
  if (countBadge) countBadge.textContent = `${totalItemsCount} Item`;

  if (cart.length === 0) {
    container.innerHTML = `
      <div id="cart-empty-state" class="py-12 text-center text-slate-400 dark:text-zinc-500">
        <div class="w-12 h-12 mx-auto mb-2 rounded-xl bg-slate-100 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-400 dark:text-zinc-500">
          <i data-lucide="shopping-cart" class="w-6 h-6"></i>
        </div>
        <p class="text-sm font-semibold text-slate-700 dark:text-zinc-300">Keranjang Masih Kosong</p>
        <p class="text-xs text-slate-400 dark:text-zinc-500 mt-1">Scan barcode obat atau pilih obat dari katalog</p>
      </div>
    `;
    if (checkoutBtn) {
      checkoutBtn.disabled = true;
      checkoutBtn.className = "w-full py-3 px-4 rounded-xl font-bold text-slate-400 dark:text-zinc-500 bg-slate-100 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-800 cursor-not-allowed flex items-center justify-center gap-2 transition-all text-sm";
    }
  } else {
    container.innerHTML = cart.map((item, idx) => {
      const categoryBadge = getCategoryBadgeHTML(item.kategori);
      const isExpiringSoon = checkIsExpiringSoon(item.tglKadaluarsa);
      const isStockWarning = item.qty > item.stok;

      return `
        <div class="p-3 mb-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-500/40 shadow-xs flex items-center justify-between gap-3 text-xs transition-all">
          <!-- Info Obat & KIE Indikasi -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="font-bold text-slate-900 dark:text-zinc-100 text-xs sm:text-sm tracking-tight truncate">${item.nama}</span>
              ${categoryBadge}
              ${isExpiringSoon ? '<span class="text-[10px] text-rose-300 font-bold bg-rose-500/15 px-2 py-0.5 rounded-md border border-rose-500/30">Dekat ED</span>' : ''}
            </div>
            <div class="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-2 flex-wrap">
              <span class="font-mono text-slate-500 tabular-nums">${item.barcode}</span>
              <span>•</span>
              <span class="text-emerald-600 dark:text-emerald-400 font-semibold font-mono tabular-nums">${formatRupiah(item.hargaJual)} / ${item.satuan}</span>
              <span>•</span>
              <span class="${isStockWarning ? 'text-rose-400 font-bold' : 'text-slate-400'} tabular-nums">Sisa Stok: ${item.stok}</span>
            </div>
            ${item.indikasi ? `
            <div class="mt-2 flex flex-wrap items-center gap-1.5">
              <span class="pill-indikasi">
                <i data-lucide="stethoscope" class="w-3 h-3 text-cyan-400 flex-shrink-0"></i> <b>Indikasi:</b> ${escapeHtml(item.indikasi)}
              </span>
              ${item.aturanPakai ? `
              <span class="pill-aturan">
                <i data-lucide="file-text" class="w-3 h-3 text-purple-400 flex-shrink-0"></i> <b>Aturan:</b> ${escapeHtml(item.aturanPakai)}
              </span>
              ` : ''}
            </div>
            ` : ''}
          </div>

          <!-- Qty Stepper Controls (Tactile Anti-Slop Buttons) -->
          <div class="flex items-center gap-1.5 flex-shrink-0">
            <button type="button" onclick="updateCartQty(${idx}, ${item.qty - 1})" class="btn-stepper" title="Kurangi qty">-</button>
            <input type="number" min="1" value="${item.qty}" onchange="updateCartQty(${idx}, this.value)" class="w-12 py-1 text-center font-bold text-white bg-[#0a0e17] border border-white/[0.14] rounded-lg focus:outline-none focus:border-emerald-400 font-mono tabular-nums">
            <button type="button" onclick="updateCartQty(${idx}, ${item.qty + 1})" class="btn-stepper" title="Tambah qty">+</button>
          </div>

          <!-- Subtotal & Hapus -->
          <div class="text-right min-w-[95px] flex-shrink-0">
            <div class="font-black text-emerald-400 text-sm font-mono tabular-nums tracking-tight">${formatRupiah(item.subtotal)}</div>
            <button onclick="removeFromCart(${idx})" class="text-[11px] text-rose-400 hover:text-rose-300 font-semibold mt-0.5 transition-colors cursor-pointer">
              <i data-lucide="trash-2" class="w-3 h-3 inline mr-0.5"></i> Hapus
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (checkoutBtn) {
      checkoutBtn.disabled = false;
      checkoutBtn.className = "w-full py-3.5 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 cursor-pointer flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/30 border border-emerald-400/30 text-sm sm:text-base";
    }
  }

  calculateCheckoutTotal();
  triggerLucideIcons();
}

function getCategoryBadgeHTML(kategori) {
  let cls = 'badge-obat-bebas';
  if (kategori === 'Obat Bebas Terbatas') cls = 'badge-obat-bebas-terbatas';
  else if (kategori === 'Obat Keras') cls = 'badge-obat-keras';
  else if (kategori === 'Herbal') cls = 'badge-herbal';
  else if (kategori === 'Suplemen') cls = 'badge-suplemen';
  else if (kategori === 'Alat Kesehatan') cls = 'badge-alkes';

  return `<span class="inline-block text-[10px] px-1.5 py-0.2 rounded font-medium ${cls}">${kategori}</span>`;
}

function checkIsExpiringSoon(edString) {
  if (!edString) return false;
  const ed = new Date(edString);
  const now = new Date();
  const diffDays = Math.ceil((ed - now) / (1000 * 60 * 60 * 24));
  return diffDays <= 90 && diffDays > 0;
}

// Kalkulasi Total Belanja, Diskon & Kembalian
function calculateCheckoutTotal() {
  const subtotal = cart.reduce((acc, curr) => acc + curr.subtotal, 0);
  const discountInput = document.getElementById('input-discount-val');
  const discountTypeSelect = document.getElementById('select-discount-type');
  const discountVal = discountInput ? (parseFloat(discountInput.value) || 0) : 0;
  const discountType = discountTypeSelect ? discountTypeSelect.value : 'rp';

  let totalDiscount = 0;
  if (discountType === 'percent') {
    totalDiscount = (subtotal * discountVal) / 100;
  } else {
    totalDiscount = discountVal;
  }
  if (totalDiscount > subtotal) totalDiscount = subtotal;

  const grandTotal = Math.max(0, subtotal - totalDiscount);

  const subtotalEl = document.getElementById('summary-subtotal') || document.getElementById('label-subtotal');
  const discountEl = document.getElementById('summary-discount') || document.getElementById('label-discount');
  const grandTotalEl = document.getElementById('summary-total') || document.getElementById('label-grand-total');

  if (subtotalEl) subtotalEl.textContent = formatRupiah(subtotal);
  if (discountEl) discountEl.textContent = `- ${formatRupiah(totalDiscount)}`;
  if (grandTotalEl) grandTotalEl.textContent = formatRupiah(grandTotal);

  calculateCashChange();
}

// Pemilihan Metode Pembayaran (Tunai, QRIS, Transfer)
function setPaymentMethod(method) {
  currentPaymentMethod = method;
  const cashSection = document.getElementById('cash-payment-section');
  const qrisSection = document.getElementById('qris-payment-section');
  const transferSection = document.getElementById('transfer-payment-section');

  const btnTunai = document.getElementById('btn-pay-tunai') || document.getElementById('btn-pay-cash');
  const btnQris = document.getElementById('btn-pay-qris');
  const btnTransfer = document.getElementById('btn-pay-transfer');

  const inactiveClass = 'py-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 cursor-pointer transition-all';
  const activeClass = 'py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 bg-emerald-600 text-white shadow-xs cursor-pointer transition-all';

  if (btnTunai) btnTunai.className = (method === 'Tunai') ? activeClass : inactiveClass;
  if (btnQris) btnQris.className = (method === 'QRIS') ? activeClass : inactiveClass;
  if (btnTransfer) btnTransfer.className = (method === 'Transfer') ? activeClass : inactiveClass;

  if (cashSection) cashSection.classList.toggle('hidden', method !== 'Tunai');
  if (qrisSection) {
    qrisSection.classList.toggle('hidden', method !== 'QRIS');
    if (method === 'QRIS') {
      const merchantEl = document.getElementById('docket-qris-merchant');
      const nmidEl = document.getElementById('docket-qris-nmid');
      if (merchantEl) merchantEl.textContent = settings.qrisMerchant || settings.namaApotek || 'Apotek El-Jannah Medika';
      if (nmidEl) nmidEl.textContent = `NMID: ${settings.qrisNmid || 'ID1026516980707'}`;
    }
  }
  if (transferSection) {
    transferSection.classList.toggle('hidden', method !== 'Transfer');
    if (method === 'Transfer') {
      const bankNameEl = document.getElementById('docket-bank-name');
      const bankRekEl = document.getElementById('docket-bank-rekening');
      const bankOwnerEl = document.getElementById('docket-bank-owner');
      if (bankNameEl) bankNameEl.textContent = settings.bankName || 'BCA';
      if (bankRekEl) bankRekEl.textContent = settings.bankRekening || '8270918231';
      if (bankOwnerEl) bankOwnerEl.textContent = `a.n ${settings.bankAtasNama || settings.namaApotek || 'Apotek El-Jannah Medika'}`;
    }
  }

  // Update button label
  const checkoutBtn = document.getElementById('btn-process-checkout');
  if (checkoutBtn) {
    if (method === 'Tunai') {
      checkoutBtn.innerHTML = '<i data-lucide="check-circle" class="w-4 h-4"></i><span>Proses Bayar & Cetak Struk</span>';
    } else if (method === 'QRIS') {
      checkoutBtn.innerHTML = '<i data-lucide="qr-code" class="w-4 h-4"></i><span>Tampilkan QRIS & Bayar</span>';
    } else {
      checkoutBtn.innerHTML = '<i data-lucide="arrow-right-left" class="w-4 h-4"></i><span>Konfirmasi Transfer & Bayar</span>';
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  calculateCashChange();
}

function applyQuickCash(val) {
  const totalEl = document.getElementById('summary-total') || document.getElementById('label-grand-total');
  const grandTotal = totalEl ? parseRupiahNumber(totalEl.textContent) : 0;
  const cashInput = document.getElementById('input-cash-received');
  if (!cashInput) return;

  if (val === 'pas') {
    cashInput.value = grandTotal;
  } else {
    const current = parseFloat(cashInput.value) || 0;
    cashInput.value = current + val;
  }
  calculateCashChange();
}

window.calculateChange = calculateCashChange;

// Quick Cash Buttons
function setCashExact() {
  const grandTotalText = document.getElementById('label-grand-total').textContent;
  const grandTotal = parseRupiahNumber(grandTotalText);
  document.getElementById('input-cash-received').value = grandTotal;
  calculateCashChange();
}

function addCashAmount(amount) {
  const current = parseFloat(document.getElementById('input-cash-received').value) || 0;
  document.getElementById('input-cash-received').value = current + amount;
  calculateCashChange();
}

function calculateCashChange() {
  const totalEl = document.getElementById('summary-total') || document.getElementById('label-grand-total');
  const grandTotal = totalEl ? parseRupiahNumber(totalEl.textContent) : 0;
  const cashInput = document.getElementById('input-cash-received');
  const cashReceived = cashInput ? (parseFloat(cashInput.value) || 0) : 0;
  const changeEl = document.getElementById('summary-cash-change') || document.getElementById('label-cash-change');

  if (!changeEl) return;

  if (currentPaymentMethod !== 'Tunai') {
    changeEl.textContent = 'Rp 0';
    return;
  }

  const change = cashReceived - grandTotal;
  if (change >= 0) {
    changeEl.className = 'text-sm font-bold text-emerald-700';
    changeEl.textContent = formatRupiah(change);
  } else {
    changeEl.className = 'text-sm font-bold text-rose-600';
    changeEl.textContent = `Kurang ${formatRupiah(Math.abs(change))}`;
  }
}

function parseRupiahNumber(rupiahStr) {
  if (!rupiahStr) return 0;
  return parseFloat(rupiahStr.replace(/[^0-9]/g, '')) || 0;
}

// Proses Transaksi Checkout
// =========================================================================
// ALUR PEMBAYARAN NON-TUNAI: QRIS & TRANSFER BANK
// =========================================================================

// Salin Nomor Rekening ke Clipboard
function copyBankRekening() {
  const rek = settings.bankRekening || '8270918231';
  navigator.clipboard.writeText(rek).then(() => {
    showToast(`No. Rekening ${rek} berhasil disalin!`, 'success');
  }).catch(() => {
    showToast(`No. Rekening: ${rek}`, 'info');
  });
}

// Buka Modal QRIS
function openQrisModal(grandTotal, invoiceNo) {
  const modal = document.getElementById('modal-qris-payment');
  if (!modal) return;

  const merchantEl = document.getElementById('qris-modal-merchant');
  const nmidEl = document.getElementById('qris-modal-nmid');
  const totalEl = document.getElementById('qris-modal-total');
  const imgEl = document.getElementById('qris-modal-img');

  const merchantName = settings.qrisMerchant || settings.namaApotek || 'Apotek El-Jannah Medika';
  const nmid = settings.qrisNmid || 'ID1026516980707';

  if (merchantEl) merchantEl.textContent = merchantName;
  if (nmidEl) nmidEl.textContent = `NMID: ${nmid}`;
  if (totalEl) totalEl.textContent = formatRupiah(grandTotal);

  if (imgEl) {
    const qrisSrc = settings.qrisImage || 'qris-apotek.jpg';
    imgEl.src = qrisSrc;
  }

  modal.classList.remove('hidden');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeQrisModal() {
  const modal = document.getElementById('modal-qris-payment');
  if (modal) modal.classList.add('hidden');
}

function confirmQrisPayment() {
  const totalEl = document.getElementById('summary-total') || document.getElementById('label-grand-total');
  const grandTotal = totalEl ? parseRupiahNumber(totalEl.textContent) : 0;
  closeQrisModal();
  finalizeTransaction('QRIS', { nominalBayar: grandTotal, kembalian: 0 });
}

// Buka Modal Transfer Bank
function openTransferModal(grandTotal, invoiceNo) {
  const modal = document.getElementById('modal-transfer-payment');
  if (!modal) return;

  const bankEl = document.getElementById('transfer-modal-bank');
  const rekEl = document.getElementById('transfer-modal-rekening');
  const ownerEl = document.getElementById('transfer-modal-owner');
  const totalEl = document.getElementById('transfer-modal-total');
  const refInput = document.getElementById('input-transfer-ref');

  if (bankEl) bankEl.textContent = settings.bankName || 'BCA';
  if (rekEl) rekEl.textContent = settings.bankRekening || '8270918231';
  if (ownerEl) ownerEl.textContent = settings.bankAtasNama || settings.namaApotek || 'Apotek El-Jannah Medika';
  if (totalEl) totalEl.textContent = formatRupiah(grandTotal);
  if (refInput) {
    refInput.value = '';
    setTimeout(() => refInput.focus(), 150);
  }

  modal.classList.remove('hidden');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeTransferModal() {
  const modal = document.getElementById('modal-transfer-payment');
  if (modal) modal.classList.add('hidden');
}

function confirmTransferPayment() {
  const totalEl = document.getElementById('summary-total') || document.getElementById('label-grand-total');
  const grandTotal = totalEl ? parseRupiahNumber(totalEl.textContent) : 0;
  const refInput = document.getElementById('input-transfer-ref');
  const refVal = refInput ? refInput.value.trim() : '';

  const bankName = settings.bankName || 'BCA';
  const methodLabel = refVal ? `Transfer (${bankName} - ${refVal})` : `Transfer (${bankName})`;

  closeTransferModal();
  finalizeTransaction(methodLabel, { nominalBayar: grandTotal, kembalian: 0, ref: refVal });
}

// Eksekusi Checkout Utama
function handleProcessCheckout() {
  if (cart.length === 0) {
    showToast("Keranjang belanja masih kosong!", "warning");
    return;
  }

  const grandTotalEl = document.getElementById('summary-total') || document.getElementById('label-grand-total');
  const grandTotal = grandTotalEl ? parseRupiahNumber(grandTotalEl.textContent) : 0;

  if (currentPaymentMethod === 'Tunai') {
    const cashInput = document.getElementById('input-cash-received');
    const cashReceived = cashInput ? (parseFloat(cashInput.value) || 0) : 0;

    if (cashReceived < grandTotal) {
      showToast(`Uang tunai kurang ${formatRupiah(grandTotal - cashReceived)}!`, "danger");
      if (cashInput) cashInput.focus();
      return;
    }
    const kembalian = Math.max(0, cashReceived - grandTotal);
    finalizeTransaction('Tunai', { nominalBayar: cashReceived, kembalian });
  } else if (currentPaymentMethod === 'QRIS') {
    openQrisModal(grandTotal, currentInvoiceNumber);
  } else if (currentPaymentMethod === 'Transfer') {
    openTransferModal(grandTotal, currentInvoiceNumber);
  }
}

window.processCheckout = handleProcessCheckout;

// Finalisasi Transaksi & Simpan Data
function finalizeTransaction(methodLabel, paymentDetails = {}) {
  const subtotalEl = document.getElementById('summary-subtotal') || document.getElementById('label-subtotal');
  const discountEl = document.getElementById('summary-discount') || document.getElementById('label-discount');
  const grandTotalEl = document.getElementById('summary-total') || document.getElementById('label-grand-total');

  const subtotal = subtotalEl ? parseRupiahNumber(subtotalEl.textContent) : 0;
  const discount = discountEl ? parseRupiahNumber(discountEl.textContent) : 0;
  const grandTotal = grandTotalEl ? parseRupiahNumber(grandTotalEl.textContent) : 0;

  // Kurangi stok di inventaris
  let totalProfit = 0;
  cart.forEach(cartItem => {
    const med = medicines.find(m => m.id === cartItem.id);
    if (med) {
      med.stok = Math.max(0, med.stok - cartItem.qty);
      const profitPerItem = (cartItem.hargaJual - (med.hargaBeli || 0)) * cartItem.qty;
      totalProfit += profitPerItem;
    }
  });

  const nominalBayar = paymentDetails.nominalBayar || grandTotal;
  const kembalian = paymentDetails.kembalian || 0;

  const newTransaction = {
    id: currentInvoiceNumber,
    waktu: new Date().toISOString(),
    items: [...cart],
    totalItem: cart.reduce((acc, c) => acc + c.qty, 0),
    subtotal,
    diskon: discount,
    totalAkhir: grandTotal,
    metodeBayar: methodLabel,
    nominalBayar,
    kembalian,
    keuntungan: totalProfit - discount,
    kasir: "Kasir 1",
    refPembayaran: paymentDetails.ref || ''
  };

  transactions.unshift(newTransaction);
  saveTransactionsToStorage();
  saveMedicinesToStorage();

  // Sinkronisasi Cloud Firestore
  if (typeof syncTransactionToCloud === 'function') {
    syncTransactionToCloud(newTransaction, cart);
  }

  // Audio efek pembayaran sukses
  sfx.playSuccessPayment();

  // Siapkan struk thermal untuk preview dan print
  renderReceiptThermal(newTransaction);

  // Bersihkan keranjang kasir
  cart = [];
  renderCart();
  generateNewInvoiceNumber();
  renderPosQuickGrid();
  renderInventoryTable();
  renderTransactionHistory();
  updateInventoryStats();

  const cashInput = document.getElementById('input-cash-received');
  if (cashInput) cashInput.value = '';
  calculateCashChange();

  // Buka modal struk
  const receiptModal = document.getElementById('modal-receipt-dialog');
  if (receiptModal) receiptModal.classList.remove('hidden');

  showToast(`Transaksi ${newTransaction.id} [${methodLabel}] berhasil!`, 'success');
}

// Render Struk Format Thermal Kertas Kasir (58mm / 80mm)
function renderReceiptThermal(trx) {
  const previewContainer = document.getElementById('struk-thermal-preview');
  const printContainer = document.getElementById('struk-thermal-print');

  const receiptHTML = `
    <div style="text-align: center; margin-bottom: 8px;">
      <div style="font-size: 15px; font-weight: bold; text-transform: uppercase;">${settings.namaApotek || 'APOTEK SEJAHTERA'}</div>
      <div style="font-size: 11px;">${settings.alamat || 'Jl. Kesehatan No. 123'}</div>
      <div style="font-size: 11px;">Telp: ${settings.telepon || '0812-3456-7890'}</div>
      <div style="font-size: 10px; margin-top: 2px;">${settings.sipa || 'SIPA: 446/1029/DINKES'}</div>
    </div>

    <div class="receipt-double-divider"></div>

    <div style="font-size: 11px; margin-bottom: 6px;">
      <div style="display: flex; justify-content: space-between;">
        <span>No: ${trx.id}</span>
        <span>${new Date(trx.waktu).toLocaleTimeString('id-ID', { hour12: false })}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span>Tgl: ${formatDateIndo(trx.waktu)}</span>
        <span>Kasir: ${trx.kasir}</span>
      </div>
    </div>

    <div class="receipt-divider"></div>

    <div style="font-size: 11px;">
      ${trx.items.map(item => `
        <div style="margin-bottom: 4px;">
          <div style="font-weight: bold;">${item.nama}</div>
          <div style="display: flex; justify-content: space-between;">
            <span>${item.qty} x ${formatRupiah(item.hargaJual)}</span>
            <span>${formatRupiah(item.subtotal)}</span>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="receipt-divider"></div>

    <div style="font-size: 11px;">
      <div style="display: flex; justify-content: space-between;">
        <span>Subtotal:</span>
        <span>${formatRupiah(trx.subtotal)}</span>
      </div>
      ${trx.diskon > 0 ? `
        <div style="display: flex; justify-content: space-between;">
          <span>Diskon:</span>
          <span>-${formatRupiah(trx.diskon)}</span>
        </div>
      ` : ''}
      <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; margin-top: 4px;">
        <span>TOTAL:</span>
        <span>${formatRupiah(trx.totalAkhir)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-top: 4px;">
        <span>Bayar (${trx.metodeBayar}):</span>
        <span>${formatRupiah(trx.nominalBayar)}</span>
      </div>
      ${trx.metodeBayar === 'Tunai' ? `
        <div style="display: flex; justify-content: space-between;">
          <span>Kembalian:</span>
          <span>${formatRupiah(trx.kembalian)}</span>
        </div>
      ` : ''}
    </div>

    <div class="receipt-double-divider"></div>

    <div style="text-align: center; font-size: 11px; margin-top: 8px;">
      <div>${settings.catatanStruk || 'Semoga Lekas Sembuh & Terima Kasih!'}</div>
      <div style="font-size: 10px; color: #555; margin-top: 4px;">Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</div>
    </div>
  `;

  if (previewContainer) previewContainer.innerHTML = receiptHTML;
  if (printContainer) printContainer.innerHTML = receiptHTML;
}

function closeReceiptModal() {
  const modal = document.getElementById('modal-receipt-dialog');
  if (modal) modal.classList.add('hidden');
}

function startNewTransaction() {
  closeReceiptModal();
  cart = [];
  generateNewInvoiceNumber();
  renderCart();
  document.getElementById('input-discount-val').value = 0;
  document.getElementById('input-cash-received').value = '';
  document.getElementById('label-cash-change').textContent = 'Rp 0';
  document.getElementById('input-barcode-manual').value = '';
  document.getElementById('input-search-kasir').value = '';
}

// Pencarian Cepat Obat di Kasir (Bisa cari Nama Obat, Barcode, Indikasi KIE, Produsen)
function handleSearchKasir(query) {
  const q = (query || '').toLowerCase().trim();

  // 1. Filter Grid Obat Cepat di bawah
  if (typeof renderPosQuickGrid === 'function') {
    renderPosQuickGrid(currentPosGridCategory, q);
  }

  // 2. Dropdown Hasil Pencarian Melayang
  const resultsBox = document.getElementById('search-kasir-results');
  if (!resultsBox) return;

  if (!q || q.length < 1) {
    resultsBox.classList.add('hidden');
    resultsBox.innerHTML = '';
    return;
  }

  // Multi-token search (contoh: "amlo 10", "amox 500", "panadol biru")
  const terms = q.split(/\s+/).filter(Boolean);

  const matched = (medicines || []).filter(m => {
    if (!m) return false;
    const nama = String(m.nama || '').toLowerCase();
    const barcode = String(m.barcode || '').toLowerCase();
    const produsen = String(m.produsen || '').toLowerCase();
    const indikasi = String(m.indikasi || '').toLowerCase();
    const kategori = String(m.kategori || '').toLowerCase();
    const combined = `${nama} ${barcode} ${produsen} ${indikasi} ${kategori}`;
    return terms.every(t => combined.includes(t));
  }).slice(0, 10);

  if (matched.length === 0) {
    resultsBox.innerHTML = `
      <div class="p-4 text-center text-slate-400 dark:text-zinc-500 text-xs space-y-1">
        <p>Obat <span class="font-bold text-slate-700 dark:text-zinc-300">"${escapeHtml(query)}"</span> tidak ditemukan di katalog.</p>
        <p class="text-[10px] text-slate-400">Tekan Enter atau klik Cari untuk mendaftarkan barcode / obat baru.</p>
      </div>
    `;
    resultsBox.classList.remove('hidden');
    return;
  }

  resultsBox.innerHTML = matched.map(m => `
    <div class="p-3 hover:bg-emerald-50/70 dark:hover:bg-zinc-800/80 cursor-pointer flex items-center justify-between transition-all border-b border-slate-100 dark:border-zinc-800 last:border-b-0 group" onclick="selectKasirSearchResult('${m.id}')">
      <div class="flex-1 min-w-0 pr-3">
        <div class="font-bold text-slate-900 dark:text-zinc-100 text-xs group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">${escapeHtml(m.nama)}</div>
        <div class="text-[10px] text-slate-500 dark:text-zinc-400 font-mono mt-0.5 flex items-center gap-2">
          <span class="tabular-nums font-bold text-slate-600 dark:text-zinc-300">${m.barcode}</span>
          <span>&bull;</span>
          <span class="px-1.5 py-0.2 rounded font-sans font-semibold ${m.stok <= 5 ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' : 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'}">
            Sisa: ${m.stok} ${m.satuan || 'Pcs'}
          </span>
          ${m.produsen ? `<span class="text-slate-400 font-sans">&bull; ${escapeHtml(m.produsen)}</span>` : ''}
        </div>
        ${m.indikasi ? `<div class="pill-indikasi mt-1.5"><i data-lucide="stethoscope" class="w-3 h-3 text-cyan-600 dark:text-cyan-400 shrink-0"></i> <b>Indikasi:</b> ${escapeHtml(m.indikasi)}</div>` : ''}
      </div>
      <div class="text-right shrink-0">
        <div class="font-black text-emerald-600 dark:text-emerald-400 text-xs font-mono tabular-nums tracking-tight">${formatRupiah(m.hargaJual)}</div>
        <span class="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 mt-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs transition-all cursor-pointer">
          + Tambah
        </span>
      </div>
    </div>
  `).join('');

  resultsBox.classList.remove('hidden');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function handleKasirSearch(query) {
  handleSearchKasir(query);
}
window.handleKasirSearch = handleSearchKasir;
window.handleSearchKasir = handleSearchKasir;

// Handle Submit Enter / Klik Cari pada Kolom Pencarian Kasir
function handleKasirSearchSubmit(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('input-search-kasir');
  if (!input) return;
  const val = input.value.trim();
  if (!val) return;

  // 1. Cek apakah barcode cocok persis
  const exactBarcode = medicines.find(m => String(m.barcode) === val);
  if (exactBarcode) {
    selectKasirSearchResult(exactBarcode.id);
    return;
  }

  // 2. Cek apakah ada obat yang cocok dengan kata kunci
  const terms = val.toLowerCase().split(/\s+/).filter(Boolean);
  const matched = (medicines || []).filter(m => {
    if (!m) return false;
    const combined = `${m.nama || ''} ${m.barcode || ''} ${m.produsen || ''} ${m.indikasi || ''} ${m.kategori || ''}`.toLowerCase();
    return terms.every(t => combined.includes(t));
  });

  if (matched.length > 0) {
    // Pilih obat pertama yang paling cocok langsung ke keranjang
    selectKasirSearchResult(matched[0].id);
  } else {
    // Jika tidak ditemukan dan berupa angka barcode atau kode baru, buka modal registrasi obat baru
    handleBarcodeScanned(val);
  }
}
window.handleKasirSearchSubmit = handleKasirSearchSubmit;

function selectKasirSearchResult(id) {
  const med = medicines.find(m => m.id === id);
  if (med) {
    sfx.playBeep();
    addProductToCart(med);
    showToast(`🛒 ${med.nama} ditambahkan ke keranjang`, 'success');
  }
  const resultsBox = document.getElementById('search-kasir-results');
  if (resultsBox) {
    resultsBox.classList.add('hidden');
    resultsBox.innerHTML = '';
  }
  const input = document.getElementById('input-search-kasir');
  if (input) input.value = '';
  if (typeof renderPosQuickGrid === 'function') {
    renderPosQuickGrid(currentPosGridCategory, '');
  }
}
window.selectKasirSearchResult = selectKasirSearchResult;

// Fungsi Force Refresh / Muat Ulang Pembaruan Sistem (Hapus Cache Browser Otomatis)
async function forceRefreshSystem() {
  showToast('Memperbarui sistem & membersihkan cache browser...', 'info');
  if ('caches' in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    } catch (e) {
      console.warn("Cache delete error:", e);
    }
  }
  try {
    sessionStorage.clear();
  } catch (e) {}

  // Hard reload dengan query string unik agar bypass disk cache browser
  const reloadUrl = window.location.origin + window.location.pathname + '?_update=' + Date.now();
  window.location.replace(reloadUrl);
}
window.forceRefreshSystem = forceRefreshSystem;

// =========================================================================
// TAB 2: KATALOG OBAT & MANAJEMEN STOK (INVENTORY)
// =========================================================================
function renderInventoryTable() {
  const tbody = document.getElementById('inventory-table-body');
  const countEl = document.getElementById('inventory-showing-count');
  const searchInput = document.getElementById('inventory-search-input');
  const catFilter = document.getElementById('inventory-category-filter');
  const statusFilter = document.getElementById('inventory-status-filter');

  if (!tbody) return;

  const q = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const selectedCat = catFilter ? catFilter.value : 'ALL';
  const selectedStatus = statusFilter ? statusFilter.value : 'ALL';

  const filtered = medicines.filter(m => {
    // Search query
    const matchSearch = !q || 
      m.nama.toLowerCase().includes(q) || 
      m.barcode.toLowerCase().includes(q) || 
      (m.produsen && m.produsen.toLowerCase().includes(q)) || 
      (m.rak && m.rak.toLowerCase().includes(q)) ||
      (m.indikasi && m.indikasi.toLowerCase().includes(q));

    // Kategori
    const matchCat = selectedCat === 'ALL' || m.kategori === selectedCat;

    // Status
    let matchStatus = true;
    if (selectedStatus === 'low') {
      matchStatus = m.stok <= (m.stokMinimal || 10);
    } else if (selectedStatus === 'expiring') {
      matchStatus = checkIsExpiringSoon(m.tglKadaluarsa);
    }

    return matchSearch && matchCat && matchStatus;
  });

  if (countEl) countEl.textContent = `Menampilkan ${filtered.length} dari total ${medicines.length} jenis obat`;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="p-8 text-center text-slate-400">
          Tidak ada data obat yang sesuai dengan filter pencarian.
        </td>
      </tr>
    `;
    return;
  }

  const displayLimit = window.inventoryDisplayLimit || 100;
  const itemsToRender = filtered.slice(0, displayLimit);

  let rowsHtml = itemsToRender.map(item => {
    const margin = item.hargaBeli > 0 ? (((item.hargaJual - item.hargaBeli) / item.hargaBeli) * 100).toFixed(0) : 0;
    const isLowStock = item.stok <= (item.stokMinimal || 10);
    const isExpiring = checkIsExpiringSoon(item.tglKadaluarsa);
    const categoryBadge = getCategoryBadgeHTML(item.kategori);

    return `
      <tr class="table-row-hover border-b border-white/[0.04] transition-colors">
        <td class="p-3 font-mono text-slate-400 text-xs tabular-nums">${item.barcode}</td>
        <td class="p-3">
          <div class="font-semibold text-slate-100">${item.nama}</div>
          <div class="text-[10px] text-slate-500 font-medium">${item.produsen || 'Generic'}</div>
          ${item.indikasi ? `
            <div onclick="openQuickEditIndikasi('${item.id}', event)" title="Klik untuk edit indikasi obat ini" class="pill-indikasi mt-1 font-sans cursor-pointer hover:ring-2 hover:ring-teal-400 dark:hover:ring-teal-400 transition-all inline-flex items-center gap-1 group">
              <i data-lucide="stethoscope" class="w-2.5 h-2.5 text-cyan-500 dark:text-cyan-400 flex-shrink-0"></i>
              <span>${escapeHtml(item.indikasi)}</span>
              <span class="text-[9px] text-teal-600 dark:text-teal-300 font-bold ml-1 opacity-70 group-hover:opacity-100">✏️ Edit</span>
            </div>
          ` : `
            <div onclick="openQuickEditIndikasi('${item.id}', event)" title="Klik untuk tambah indikasi obat ini" class="mt-1 inline-flex items-center gap-1 text-[10px] text-teal-600 dark:text-teal-400 hover:underline cursor-pointer">
              <i data-lucide="plus-circle" class="w-2.5 h-2.5"></i> + Tambah Indikasi
            </div>
          `}
        </td>
        <td class="p-3">
          <div class="flex flex-col gap-1 items-start">
            ${categoryBadge}
            <span class="text-[11px] text-slate-400 font-medium">${item.satuan}</span>
          </div>
        </td>
        <td class="p-3 text-right text-slate-400 font-mono tabular-nums font-medium">${formatRupiah(item.hargaBeli)}</td>
        <td class="p-3 text-right font-bold text-emerald-400 font-mono tabular-nums">${formatRupiah(item.hargaJual)}</td>
        <td class="p-3 text-center">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold tabular-nums border ${margin >= 20 ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-white/[0.04] text-slate-400 border-white/[0.08]'}">
            +${margin}%
          </span>
        </td>
        <td class="p-3 text-center">
          <span class="px-2.5 py-0.5 rounded-full text-xs font-bold tabular-nums border ${isLowStock ? 'bg-rose-500/20 text-rose-300 border-rose-500/35 animate-pulse' : 'bg-white/[0.06] text-slate-200 border-white/[0.08]'}">
            ${item.stok}
          </span>
        </td>
        <td class="p-3">
          <div class="text-xs tabular-nums ${isExpiring ? 'text-rose-400 font-bold flex items-center gap-1' : 'text-slate-400'}">
            ${isExpiring ? '⚠️ ' : ''}${formatDateIndo(item.tglKadaluarsa)}
          </div>
        </td>
        <td class="p-3">
          <span class="px-2 py-0.5 rounded text-[11px] font-mono bg-white/[0.03] border border-white/[0.08] text-slate-400">${item.rak || '-'}</span>
        </td>
        <td class="p-3 text-center">
          ${(typeof currentRole !== 'undefined' && currentRole === 'superadmin') ? `
          <div class="flex items-center justify-center gap-1">
            <button onclick="quickAddStock('${item.id}', 10)" title="Tambah 10 stok" class="px-2 py-0.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 rounded-md text-xs font-bold border border-emerald-500/30 transition-colors cursor-pointer">+10</button>
            <button onclick="openEditProductModal('${item.id}')" title="Edit" class="px-2 py-0.5 bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 rounded-md text-xs font-bold border border-sky-500/30 transition-colors cursor-pointer">Edit</button>
            <button onclick="deleteProduct('${item.id}')" title="Hapus" class="px-2 py-0.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 rounded-md text-xs font-bold border border-rose-500/30 transition-colors cursor-pointer">Hapus</button>
          </div>
          ` : `
          <span class="text-[11px] text-slate-500 italic flex items-center justify-center gap-1 font-sans" title="Akses edit/hapus dikunci untuk Kasir">
            <svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            Terkunci
          </span>
          `}
        </td>
      </tr>
    `;
  }).join('');

  if (filtered.length > displayLimit) {
    rowsHtml += `
      <tr>
        <td colspan="10" class="p-4 text-center bg-[#0e1424] border-t border-white/[0.08]">
          <div class="text-xs text-slate-400 mb-2 font-medium">Menampilkan ${displayLimit} dari ${filtered.length} obat</div>
          <button type="button" onclick="loadMoreInventory(100)" class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-sm">
            Tampilkan 100 Obat Berikutnya ▾
          </button>
          <button type="button" onclick="loadMoreInventory(${filtered.length})" class="ml-2 px-3 py-1.5 bg-white/[0.08] hover:bg-white/[0.14] text-slate-300 border border-white/[0.1] rounded-lg text-xs font-semibold transition-colors cursor-pointer">
            Tampilkan Semua (${filtered.length})
          </button>
        </td>
      </tr>
    `;
  }

  tbody.innerHTML = rowsHtml;
  triggerLucideIcons();
}

function loadMoreInventory(addCount) {
  window.inventoryDisplayLimit = (window.inventoryDisplayLimit || 100) + addCount;
  renderInventoryTable();
}

// Reset dan Muat Ulang Master Data Lengkap (1.098 Obat)
function reloadMasterExcelData() {
  if (confirm("Muat ulang seluruh 1.098 master data obat apotek dari data Excel? Stok & harga akan diperbarui sesuai master.")) {
    medicines = [...INITIAL_MEDICINES];
    saveMedicinesToStorage();
    localStorage.setItem('apotek_catalog_version', APOTEK_CATALOG_VERSION);
    renderInventoryTable();
    updateInventoryStats();
    showToast("✅ Berhasil memuat ulang 1.098 obat apotek!", "success");
    if (typeof uploadAllLocalDataToFirebase === 'function' && isFirebaseConnected) {
      if (confirm("Ingin menyinkronkan 1.098 obat ini ke Cloud Firebase juga?")) {
        uploadAllLocalDataToFirebase();
      }
    }
  }
}

function updateInventoryStats() {
  const totalItems = medicines.length;
  const totalStock = medicines.reduce((acc, curr) => acc + (parseInt(curr.stok, 10) || 0), 0);
  const lowStockCount = medicines.filter(m => m.stok <= (m.stokMinimal || 10)).length;
  const expiringCount = medicines.filter(m => checkIsExpiringSoon(m.tglKadaluarsa)).length;

  const statItems = document.getElementById('stat-total-items');
  const statStock = document.getElementById('stat-total-stock');
  const statLow = document.getElementById('stat-low-stock');
  const statExp = document.getElementById('stat-expiring-soon');
  const navBadge = document.getElementById('badge-stok-warning');

  if (statItems) statItems.textContent = totalItems;
  if (statStock) statStock.textContent = totalStock;
  if (statLow) statLow.textContent = lowStockCount;
  if (statExp) statExp.textContent = expiringCount;

  if (navBadge) {
    if (lowStockCount > 0) {
      navBadge.textContent = lowStockCount;
      navBadge.classList.remove('hidden');
    } else {
      navBadge.classList.add('hidden');
    }
  }
}

function filterInventoryByStatus(status) {
  const statusFilter = document.getElementById('inventory-status-filter');
  if (statusFilter) {
    statusFilter.value = status;
    renderInventoryTable();
  }
}

function quickAddStock(id, amount) {
  const med = medicines.find(m => m.id === id);
  if (med) {
    med.stok += amount;
    saveMedicinesToStorage();
    if (typeof syncMedicineToCloud === 'function') syncMedicineToCloud(med);
    renderInventoryTable();
    showToast(`Stok ${med.nama} ditambah +${amount} (Total: ${med.stok})`, 'success');
  }
}

function deleteProduct(id) {
  const med = medicines.find(m => m.id === id);
  if (!med) return;
  if (typeof requireOwnerPIN === 'function') {
    requireOwnerPIN(`Hapus Obat "${med.nama}"`, () => {
      medicines = medicines.filter(m => m.id !== id);
      saveMedicinesToStorage();
      if (typeof syncDeleteMedicineFromCloud === 'function') syncDeleteMedicineFromCloud(id);
      renderInventoryTable();
      showToast(`Obat ${med.nama} telah dihapus.`, 'info');
    });
  } else {
    if (confirm(`Yakin ingin menghapus obat "${med.nama}" (Barcode: ${med.barcode})?`)) {
      medicines = medicines.filter(m => m.id !== id);
      saveMedicinesToStorage();
      if (typeof syncDeleteMedicineFromCloud === 'function') syncDeleteMedicineFromCloud(id);
      renderInventoryTable();
      showToast(`Obat ${med.nama} telah dihapus.`, 'info');
    }
  }
}

// Handler Submit Ubah PIN Owner
function handleUpdatePinSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('setting-new-pin');
  if (!input) return;
  const newPin = input.value.trim();
  if (typeof setOwnerPIN === 'function') {
    if (setOwnerPIN(newPin)) {
      input.value = '';
    }
  }
}

// Modal Form Tambah / Edit Obat Umum
function openAddProductModal() {
  if (typeof currentRole !== 'undefined' && currentRole !== 'superadmin') {
    requestSuperAdminLogin(() => openAddProductModal());
    return;
  }
  document.getElementById('form-manage-product').reset();
  document.getElementById('edit-prod-id').value = '';
  document.getElementById('product-form-title').textContent = 'Tambah Obat Baru Manual';
  
  // Default ED 2 tahun
  const defaultED = new Date();
  defaultED.setFullYear(defaultED.getFullYear() + 2);
  document.getElementById('edit-prod-ed').value = defaultED.toISOString().split('T')[0];
  document.getElementById('edit-prod-stok').value = 10;

  document.getElementById('modal-product-form').classList.remove('hidden');
}

function openEditProductModal(id) {
  if (typeof currentRole !== 'undefined' && currentRole !== 'superadmin') {
    requestSuperAdminLogin(() => openEditProductModal(id));
    return;
  }
  const med = medicines.find(m => m.id === id);
  if (!med) return;

  document.getElementById('product-form-title').textContent = `Edit Obat: ${med.nama}`;
  document.getElementById('edit-prod-id').value = med.id;
  document.getElementById('edit-prod-barcode').value = med.barcode;
  document.getElementById('edit-prod-nama').value = med.nama;
  document.getElementById('edit-prod-kategori').value = med.kategori;
  document.getElementById('edit-prod-satuan').value = med.satuan;
  document.getElementById('edit-prod-harga-beli').value = med.hargaBeli;
  document.getElementById('edit-prod-harga-jual').value = med.hargaJual;
  document.getElementById('edit-prod-stok').value = med.stok;
  document.getElementById('edit-prod-ed').value = med.tglKadaluarsa || '';
  document.getElementById('edit-prod-produsen').value = med.produsen || '';
  document.getElementById('edit-prod-rak').value = med.rak || '';
  const inputIndikasi = document.getElementById('edit-prod-indikasi');
  if (inputIndikasi) inputIndikasi.value = med.indikasi || '';
  const inputAturan = document.getElementById('edit-prod-aturan');
  if (inputAturan) inputAturan.value = med.aturanPakai || '';

  document.getElementById('modal-product-form').classList.remove('hidden');
}

function closeProductFormModal() {
  const modal = document.getElementById('modal-product-form');
  if (modal) modal.classList.add('hidden');
}

function handleSaveProductForm(e) {
  e.preventDefault();
  const id = document.getElementById('edit-prod-id').value;
  const barcode = document.getElementById('edit-prod-barcode').value.trim();
  const nama = document.getElementById('edit-prod-nama').value.trim();
  const kategori = document.getElementById('edit-prod-kategori').value;
  const satuan = document.getElementById('edit-prod-satuan').value;
  const hargaBeli = parseFloat(document.getElementById('edit-prod-harga-beli').value) || 0;
  const hargaJual = parseFloat(document.getElementById('edit-prod-harga-jual').value) || 0;
  const stok = parseInt(document.getElementById('edit-prod-stok').value, 10) || 0;
  const tglKadaluarsa = document.getElementById('edit-prod-ed').value;
  const produsen = document.getElementById('edit-prod-produsen').value.trim();
  const rak = document.getElementById('edit-prod-rak').value.trim();
  const inputIndikasi = document.getElementById('edit-prod-indikasi');
  const indikasi = inputIndikasi ? inputIndikasi.value.trim() : '';
  const inputAturan = document.getElementById('edit-prod-aturan');
  const aturanPakai = inputAturan ? inputAturan.value.trim() : '';

  if (!barcode || !nama || hargaJual <= 0) {
    showToast("Barcode, nama obat dan harga jual wajib diisi!", "danger");
    return;
  }

  if (id) {
    // Update existing
    const med = medicines.find(m => m.id === id);
    if (med) {
      med.barcode = barcode;
      med.nama = nama;
      med.kategori = kategori;
      med.satuan = satuan;
      med.hargaBeli = hargaBeli;
      med.hargaJual = hargaJual;
      med.stok = stok;
      med.tglKadaluarsa = tglKadaluarsa;
      med.produsen = produsen;
      med.rak = rak;
      med.indikasi = indikasi;
      med.aturanPakai = aturanPakai;
      showToast(`Data '${nama}' berhasil diperbarui!`, "success");
    }
  } else {
    // Create new
    const newMed = {
      id: `med-${Date.now()}`,
      barcode,
      nama,
      kategori,
      satuan,
      hargaBeli,
      hargaJual,
      stok,
      stokMinimal: 10,
      tglKadaluarsa,
      produsen,
      rak,
      indikasi,
      aturanPakai,
      createdAt: new Date().toISOString()
    };
    medicines.push(newMed);
    showToast(`Obat '${nama}' berhasil ditambahkan!`, "success");
  }

  saveMedicinesToStorage();
  if (typeof syncMedicineToCloud === 'function') {
    const savedMed = id ? medicines.find(m => m.id === id) : newMed;
    if (savedMed) syncMedicineToCloud(savedMed);
  }
  renderInventoryTable();
  closeProductFormModal();
}

// Backup & Restore JSON
function exportInventoryJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(medicines, null, 2));
  const dlAnchorElem = document.createElement('a');
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", `katalog-obat-apotek-${new Date().toISOString().split('T')[0]}.json`);
  dlAnchorElem.click();
  showToast("File data obat berhasil di-download.", "success");
}

function importInventoryJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported)) {
        medicines = imported;
        saveMedicinesToStorage();
        renderInventoryTable();
        showToast(`Berhasil mengimpor ${imported.length} data obat!`, "success");
      } else {
        showToast("Format JSON tidak valid!", "danger");
      }
    } catch (err) {
      showToast("Gagal membaca file JSON.", "danger");
    }
  };
  reader.readAsText(file);
}

function resetToInitialData() {
  if (confirm("Reset seluruh katalog obat ke data awal contoh apotek?")) {
    medicines = [...INITIAL_MEDICINES];
    saveMedicinesToStorage();
    renderInventoryTable();
    showToast("Data obat di-reset ke default contoh apotek.", "info");
  }
}

// =========================================================================
// TAB 3: RIWAYAT PENJUALAN, LAPORAN & GRAFIK VISUAL (CHART.JS)
// =========================================================================
let salesChartInstance = null;
let topProductsChartInstance = null;
let currentChartPeriod = 'daily';

function setChartPeriod(period) {
  currentChartPeriod = period;
  const btnDaily = document.getElementById('btn-chart-daily');
  const btnMonthly = document.getElementById('btn-chart-monthly');

  if (period === 'daily') {
    btnDaily.className = 'px-3 py-1 rounded-lg font-bold bg-white text-emerald-700 shadow-xs transition-all';
    btnMonthly.className = 'px-3 py-1 rounded-lg font-semibold text-slate-600 hover:text-slate-900 transition-all';
  } else {
    btnMonthly.className = 'px-3 py-1 rounded-lg font-bold bg-white text-emerald-700 shadow-xs transition-all';
    btnDaily.className = 'px-3 py-1 rounded-lg font-semibold text-slate-600 hover:text-slate-900 transition-all';
  }

  renderAnalyticsCharts();
}

function renderAnalyticsCharts() {
  if (typeof Chart === 'undefined') return;

  const salesCanvas = document.getElementById('salesTrendsChart');
  const topCanvas = document.getElementById('topProductsChart');
  if (!salesCanvas || !topCanvas) return;

  // 1. Data Processing untuk Grafik Tren
  let labels = [];
  let omzetData = [];
  let profitData = [];

  if (currentChartPeriod === 'daily') {
    // 7 Hari Terakhir
    const daysMap = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
      daysMap[key] = { label, omzet: 0, profit: 0 };
    }

    transactions.forEach(t => {
      const dateKey = t.waktu.split('T')[0];
      if (daysMap[dateKey]) {
        daysMap[dateKey].omzet += t.totalAkhir;
        daysMap[dateKey].profit += (t.keuntungan || 0);
      }
    });

    Object.values(daysMap).forEach(v => {
      labels.push(v.label);
      omzetData.push(v.omzet);
      profitData.push(v.profit);
    });

  } else {
    // Bulanan Tahun 2026
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthOmzet = new Array(12).fill(0);
    const monthProfit = new Array(12).fill(0);

    transactions.forEach(t => {
      const d = new Date(t.waktu);
      const mIdx = d.getMonth();
      monthOmzet[mIdx] += t.totalAkhir;
      monthProfit[mIdx] += (t.keuntungan || 0);
    });

    labels = months;
    omzetData = monthOmzet;
    profitData = monthProfit;
  }

  // Render / Update Sales Trends Chart
  if (salesChartInstance) {
    salesChartInstance.destroy();
  }

  salesChartInstance = new Chart(salesCanvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Omzet Penjualan (Rp)',
          data: omzetData,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointBackgroundColor: '#059669',
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: 'Laba Bersih (Rp)',
          data: profitData,
          borderColor: '#0284c7',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          tension: 0.35,
          borderWidth: 2,
          pointBackgroundColor: '#0284c7',
          pointRadius: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            boxWidth: 12,
            font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' }, color: '#cbd5e1'
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${formatRupiah(context.raw)}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return 'Rp ' + (value >= 1000 ? (value / 1000) + 'k' : value);
            },
            font: { family: 'JetBrains Mono', size: 10 }
          },
          grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' }
        },
        x: {
          ticks: { font: { family: 'Plus Jakarta Sans', size: 10 }, color: '#94a3b8' },
          grid: { display: false }
        }
      }
    }
  });

  // 2. Data Processing untuk Top 5 Obat Terlaris
  const productQtyMap = {};
  transactions.forEach(t => {
    t.items.forEach(it => {
      productQtyMap[it.nama] = (productQtyMap[it.nama] || 0) + it.qty;
    });
  });

  const sortedProducts = Object.entries(productQtyMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topLabels = sortedProducts.map(p => p[0]);
  const topQuantities = sortedProducts.map(p => p[1]);

  if (topProductsChartInstance) {
    topProductsChartInstance.destroy();
  }

  topProductsChartInstance = new Chart(topCanvas, {
    type: 'doughnut',
    data: {
      labels: topLabels.length > 0 ? topLabels : ['Belum Ada Data'],
      datasets: [{
        data: topQuantities.length > 0 ? topQuantities : [1],
        backgroundColor: [
          '#10b981', '#06b6d4', '#6366f1', '#f59e0b', '#ec4899'
        ],
        borderWidth: 2,
        borderColor: '#0e1424'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 10,
            font: { family: 'Plus Jakarta Sans', size: 10 }
          }
        }
      },
      cutout: '65%'
    }
  });
}

function renderTransactionHistory() {
  const tbody = document.getElementById('transaction-table-body');
  const omzetEl = document.getElementById('report-total-omzet');
  const profitEl = document.getElementById('report-total-profit');
  const totalTrxEl = document.getElementById('report-total-trx');

  if (!tbody) return;

  const totalOmzet = transactions.reduce((acc, curr) => acc + curr.totalAkhir, 0);
  const totalProfit = transactions.reduce((acc, curr) => acc + (curr.keuntungan || 0), 0);

  if (omzetEl) omzetEl.textContent = formatRupiah(totalOmzet);
  if (profitEl) profitEl.textContent = formatRupiah(totalProfit);
  if (totalTrxEl) totalTrxEl.textContent = transactions.length;

  // Sinkronkan Arus Kas & Pengeluaran Distributor
  if (typeof updateExpenseStats === 'function') updateExpenseStats();

  // Render Charts
  setTimeout(renderAnalyticsCharts, 50);
  triggerLucideIcons();

  if (transactions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="p-8 text-center text-slate-400">Belum ada riwayat transaksi penjualan.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = transactions.map(trx => {
    const itemsSummary = trx.items.map(it => `${it.nama} (${it.qty})`).join(', ');

    return `
      <tr class="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
        <td class="p-3 font-mono font-semibold text-slate-200 text-xs">${trx.id}</td>
        <td class="p-3 text-slate-300 text-xs">
          <div>${formatDateIndo(trx.waktu)}</div>
          <div class="text-[10px] text-slate-500 font-mono">${new Date(trx.waktu).toLocaleTimeString('id-ID')}</div>
        </td>
        <td class="p-3 max-w-xs truncate text-slate-300 text-xs" title="${itemsSummary}">${itemsSummary}</td>
        <td class="p-3">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${trx.metodeBayar === 'Tunai' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-sky-500/15 text-sky-300 border border-sky-500/30'}">
            ${trx.metodeBayar}
          </span>
        </td>
        <td class="p-3 text-right font-bold text-emerald-400 font-mono text-xs tabular-nums">${formatRupiah(trx.totalAkhir)}</td>
        <td class="p-3 text-right font-bold text-teal-400 font-mono text-xs tabular-nums">${formatRupiah(trx.keuntungan || 0)}</td>
        <td class="p-3 text-center">
          <button onclick="reprintReceipt('${trx.id}')" class="px-2.5 py-1 bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 border border-white/[0.1] rounded text-xs font-semibold cursor-pointer transition-colors">
            Lihat Struk
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function reprintReceipt(trxId) {
  const trx = transactions.find(t => t.id === trxId);
  if (!trx) return;
  renderReceiptThermal(trx);
  document.getElementById('modal-receipt-dialog').classList.remove('hidden');
}

function clearTransactionHistory() {
  if (confirm("Hapus seluruh catatan riwayat transaksi kasir?")) {
    transactions = [];
    saveTransactionsToStorage();
    renderTransactionHistory();
    showToast("Riwayat transaksi telah dibersihkan.", "info");
  }
}

// =========================================================================
// TAB 4: PENGATURAN APOTEK
// =========================================================================
function populateSettingsForm() {
  document.getElementById('setting-nama-apotek').value = settings.namaApotek || '';
  document.getElementById('setting-slogan').value = settings.slogan || '';
  document.getElementById('setting-telepon').value = settings.telepon || '';
  document.getElementById('setting-sipa').value = settings.sipa || '';
  document.getElementById('setting-apoteker').value = settings.apoteker || '';
  document.getElementById('setting-alamat').value = settings.alamat || '';
  document.getElementById('setting-catatan-struk').value = settings.catatanStruk || '';
}

function saveSettings(e) {
  e.preventDefault();
  settings.namaApotek = document.getElementById('setting-nama-apotek').value.trim();
  settings.slogan = document.getElementById('setting-slogan').value.trim();
  settings.telepon = document.getElementById('setting-telepon').value.trim();
  settings.sipa = document.getElementById('setting-sipa').value.trim();
  settings.apoteker = document.getElementById('setting-apoteker').value.trim();
  settings.alamat = document.getElementById('setting-alamat').value.trim();
  settings.catatanStruk = document.getElementById('setting-catatan-struk').value.trim();

  saveSettingsToStorage();
  applySettingsToUI();
  showToast("Pengaturan profil apotek berhasil disimpan!", "success");
}

function applySettingsToUI() {
  const navName = document.getElementById('nav-nama-apotek');
  const navSipa = document.getElementById('nav-sipa');
  if (navName && settings.namaApotek) navName.textContent = settings.namaApotek;
  if (navSipa && settings.sipa) navSipa.textContent = settings.sipa;
  populatePaymentSettingsToUI();
}

// =========================================================================
// MODAL BARCODE TESTER (SIMULATOR)
// =========================================================================
function openBarcodeTesterModal() {
  document.getElementById('modal-barcode-tester').classList.remove('hidden');
}

function closeBarcodeTesterModal() {
  document.getElementById('modal-barcode-tester').classList.add('hidden');
}

// =========================================================================
// TOAST NOTIFIKASI
// =========================================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  let bgCls = 'bg-slate-900 text-white';
  if (type === 'success') bgCls = 'bg-emerald-600 text-white';
  else if (type === 'danger') bgCls = 'bg-rose-600 text-white';
  else if (type === 'warning') bgCls = 'bg-amber-600 text-white';

  toast.className = `toast px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg flex items-center gap-2 ${bgCls}`;
  toast.innerHTML = `<span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}


// Keyboard Shortcut Ctrl+K / '/' untuk langsung fokus pencarian kasir
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    if (activeTab !== 'kasir') switchTab('kasir');
    const searchInput = document.getElementById('input-search-kasir');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  } else if (e.key === 'Escape') {
    const resultsBox = document.getElementById('search-kasir-results');
    if (resultsBox) resultsBox.classList.add('hidden');
    closePinModal();
    closeProductFormModal();
  }
});


// =========================================================================
// QUICK DRUG TILES GRID (SQUARE POS STYLE)
// =========================================================================
let currentPosGridCategory = 'ALL';

function renderPosQuickGrid(category = 'ALL', searchQuery = '') {
  const grid = document.getElementById('pos-quick-grid');
  const countLabel = document.getElementById('pos-grid-count');
  if (!grid) return;

  currentPosGridCategory = category;

  // Update button active state
  document.querySelectorAll('.pos-cat-pill').forEach(btn => {
    btn.classList.remove('active');
  });

  const activeBtn = Array.from(document.querySelectorAll('.pos-cat-pill')).find(b => {
    if (category === 'ALL') return b.textContent.includes('Semua');
    return b.textContent.includes(category);
  });
  if (activeBtn) {
    activeBtn.classList.add('active');
  }

  let filtered = medicines;
  if (category !== 'ALL') {
    filtered = filtered.filter(m => m.kategori === category);
  }

  if (searchQuery && searchQuery.trim().length > 0) {
    const q = searchQuery.toLowerCase().trim();
    filtered = (filtered || []).filter(m => {
      if (!m) return false;
      const nama = String(m.nama || '').toLowerCase();
      const barcode = String(m.barcode || '').toLowerCase();
      const indikasi = String(m.indikasi || '').toLowerCase();
      const produsen = String(m.produsen || '').toLowerCase();
      return nama.includes(q) || barcode.includes(q) || indikasi.includes(q) || produsen.includes(q);
    });
  } else {
    // If no search query, prioritize popular top medicines
    const popularNames = ['panadol', 'promag', 'amoxicillin', 'tolak angin', 'acetylcysteine', 'bodrex', 'sanmol', 'betadine', 'diapet', 'insto', 'mylanta', 'dumin', 'antimo', 'komix'];
    const popularMatches = (filtered || []).filter(m => m && m.nama && popularNames.some(p => String(m.nama).toLowerCase().includes(p)));
    const others = (filtered || []).filter(m => m && (!m.nama || !popularNames.some(p => String(m.nama).toLowerCase().includes(p))));
    filtered = [...popularMatches, ...others];
  }

  const items = filtered.slice(0, 15);

  if (countLabel) {
    countLabel.textContent = searchQuery ? `${filtered.length} Ditemukan` : `${items.length} Obat Cepat`;
  }

  if (items.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-8 text-center text-slate-400 text-xs">
        Tidak ada obat yang cocok.
      </div>
    `;
    return;
  }

  setTimeout(triggerLucideIcons, 10);
  grid.innerHTML = items.map(item => {
    const isLowStock = item.stok <= (item.stokMinimal || 10);
    const badgeBg = item.kategori === 'Obat Keras' ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30';

    return `
      <div onclick="selectKasirSearchResult('${item.id}')" class="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-emerald-500 hover:shadow-md bg-white dark:bg-zinc-900 cursor-pointer transition-all flex flex-col justify-between group">
        <div>
          <div class="flex items-center justify-between gap-1 mb-1.5">
            <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-md ${badgeBg}">
              ${item.kategori}
            </span>
            <span class="text-[10px] font-mono ${isLowStock ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-500 dark:text-zinc-400'}">
              ${item.stok} ${item.satuan}
            </span>
          </div>
          <div class="font-bold text-slate-900 dark:text-zinc-100 text-xs line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            ${item.nama}
          </div>
          ${item.indikasi ? `
          <div class="text-[9px] text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/50 px-1.5 py-0.5 rounded-md border border-cyan-200 dark:border-cyan-800/40 mt-1.5 line-clamp-1 flex items-center gap-1">
            <i data-lucide="stethoscope" class="w-2.5 h-2.5 text-cyan-600 dark:text-cyan-400 shrink-0"></i> <span>${escapeHtml(item.indikasi)}</span>
          </div>` : ''}
        </div>
        <div class="mt-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <span class="font-bold text-emerald-600 dark:text-emerald-400 text-xs font-mono tabular-nums">
            ${formatRupiah(item.hargaJual)}
          </span>
          <span class="w-6 h-6 rounded-lg bg-emerald-50 group-hover:bg-emerald-600 text-emerald-700 group-hover:text-white dark:bg-emerald-500/10 dark:text-emerald-400 dark:group-hover:bg-emerald-600 dark:group-hover:text-white flex items-center justify-center font-bold text-xs transition-colors border border-emerald-200 dark:border-emerald-500/20 shadow-xs">
            +
          </span>
        </div>
      </div>
    `;
  }).join('');
}

function filterPosGrid(category) {
  renderPosQuickGrid(category);
}

function clearKasirSearch() {
  const input = document.getElementById('input-search-kasir');
  if (input) input.value = '';
  const resultsBox = document.getElementById('search-kasir-results');
  if (resultsBox) resultsBox.classList.add('hidden');
  renderPosQuickGrid(currentPosGridCategory);
}

// Handle Upload Foto QRIS Apotek
function handleQrisImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    showToast("Ukuran foto maksimal 2MB!", "warning");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(event) {
    settings.qrisImage = event.target.result;
    saveSettingsToStorage();
    renderQrisSettingsPreview();
    showToast("Foto QRIS apotek berhasil diunggah!", "success");
  };
  reader.readAsDataURL(file);
}

function removeQrisImage() {
  settings.qrisImage = '';
  saveSettingsToStorage();
  renderQrisSettingsPreview();
  const fileInput = document.getElementById('setting-qris-file');
  if (fileInput) fileInput.value = '';
  showToast("Foto QRIS dihapus. Sistem akan menggunakan QR dinamis.", "info");
}

function renderQrisSettingsPreview() {
  const previewContainer = document.getElementById('qris-img-preview-container');
  const previewImg = document.getElementById('setting-qris-preview');
  const btnRemove = document.getElementById('btn-remove-qris');

  if (settings.qrisImage && settings.qrisImage.startsWith('data:image')) {
    if (previewImg) previewImg.src = settings.qrisImage;
    if (previewContainer) previewContainer.classList.remove('hidden');
    if (btnRemove) btnRemove.classList.remove('hidden');
  } else {
    if (previewContainer) previewContainer.classList.add('hidden');
    if (btnRemove) btnRemove.classList.add('hidden');
  }
}

// Simpan Pengaturan Pembayaran Non-Tunai
function savePaymentSettings(e) {
  e.preventDefault();
  const qrisMerchantInput = document.getElementById('setting-qris-merchant');
  const qrisNmidInput = document.getElementById('setting-qris-nmid');
  const bankNameInput = document.getElementById('setting-bank-name');
  const bankRekeningInput = document.getElementById('setting-bank-rekening');
  const bankOwnerInput = document.getElementById('setting-bank-owner');

  if (qrisMerchantInput) settings.qrisMerchant = qrisMerchantInput.value.trim();
  if (qrisNmidInput) settings.qrisNmid = qrisNmidInput.value.trim();
  if (bankNameInput) settings.bankName = bankNameInput.value.trim();
  if (bankRekeningInput) settings.bankRekening = bankRekeningInput.value.trim();
  if (bankOwnerInput) settings.bankAtasNama = bankOwnerInput.value.trim();

  saveSettingsToStorage();
  applySettingsToUI();
  showToast("Pengaturan QRIS & Rekening Bank berhasil disimpan!", "success");
}

// Populate Payment Settings on Page Load
function populatePaymentSettingsToUI() {
  const qrisMerchantInput = document.getElementById('setting-qris-merchant');
  const qrisNmidInput = document.getElementById('setting-qris-nmid');
  const bankNameInput = document.getElementById('setting-bank-name');
  const bankRekeningInput = document.getElementById('setting-bank-rekening');
  const bankOwnerInput = document.getElementById('setting-bank-owner');

  if (qrisMerchantInput) qrisMerchantInput.value = settings.qrisMerchant || settings.namaApotek || 'Apotek El-Jannah Medika';
  if (qrisNmidInput) qrisNmidInput.value = settings.qrisNmid || 'ID1026516980707';
  if (bankNameInput) bankNameInput.value = settings.bankName || 'BCA';
  if (bankRekeningInput) bankRekeningInput.value = settings.bankRekening || '8270918231';
  if (bankOwnerInput) bankOwnerInput.value = settings.bankAtasNama || settings.namaApotek || 'Apotek El-Jannah Medika';

  renderQrisSettingsPreview();
}

// Tutup dropdown hasil pencarian jika klik di luar
document.addEventListener('click', (e) => {
  const searchBox = document.getElementById('search-kasir-results');
  const searchInput = document.getElementById('input-search-kasir');
  if (searchBox && !searchBox.classList.contains('hidden')) {
    if (searchInput && !searchInput.contains(e.target) && !searchBox.contains(e.target)) {
      searchBox.classList.add('hidden');
    }
  }
});

// =========================================================================
// QUICK EDIT INDIKASI & KIE OBAT
// =========================================================================
function openQuickEditIndikasi(id, event) {
  if (event) event.stopPropagation();

  // Jika kasir belum login Admin, minta PIN admin
  if (typeof currentRole !== 'undefined' && currentRole !== 'superadmin') {
    requestSuperAdminLogin(() => openQuickEditIndikasi(id));
    return;
  }

  const med = (medicines || []).find(m => m.id === id);
  if (!med) return;

  const modal = document.getElementById('modal-quick-edit-indikasi');
  if (!modal) return;

  document.getElementById('quick-indikasi-id').value = med.id;
  document.getElementById('quick-indikasi-nama').textContent = med.nama;
  document.getElementById('quick-indikasi-subtitle').textContent = `Barcode: ${med.barcode} • ${med.kategori}`;
  
  const textEl = document.getElementById('quick-indikasi-text');
  if (textEl) {
    textEl.value = med.indikasi || '';
    setTimeout(() => textEl.focus(), 100);
  }

  const aturanEl = document.getElementById('quick-indikasi-aturan');
  if (aturanEl) {
    aturanEl.value = med.aturanPakai || '';
  }

  modal.classList.remove('hidden');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeQuickEditIndikasiModal() {
  const modal = document.getElementById('modal-quick-edit-indikasi');
  if (modal) modal.classList.add('hidden');
}

function setQuickIndikasiTemplate(template) {
  const textEl = document.getElementById('quick-indikasi-text');
  if (textEl) {
    textEl.value = template;
    textEl.focus();
  }
}

function handleSaveQuickIndikasi(e) {
  if (e) e.preventDefault();
  const id = document.getElementById('quick-indikasi-id').value;
  const newIndikasi = document.getElementById('quick-indikasi-text').value.trim();
  const newAturan = document.getElementById('quick-indikasi-aturan').value.trim();

  const med = (medicines || []).find(m => m.id === id);
  if (!med) return;

  med.indikasi = newIndikasi;
  med.aturanPakai = newAturan;

  saveMedicinesToStorage();
  renderInventoryTable();
  if (typeof renderPosQuickGrid === 'function') {
    renderPosQuickGrid(currentPosGridCategory, '');
  }

  if (typeof syncMedicineToCloud === 'function') {
    syncMedicineToCloud(med);
  }

  closeQuickEditIndikasiModal();
  showToast(`✅ Indikasi obat "${med.nama}" berhasil diperbarui!`, "success");
}

window.openQuickEditIndikasi = openQuickEditIndikasi;
window.closeQuickEditIndikasiModal = closeQuickEditIndikasiModal;
window.setQuickIndikasiTemplate = setQuickIndikasiTemplate;
window.handleSaveQuickIndikasi = handleSaveQuickIndikasi;
