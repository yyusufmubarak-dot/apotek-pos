/**
 * =========================================================================
 * FIREBASE CLOUD FIRESTORE INTEGRATION (firebase-sync.js)
 * Menyediakan sinkronisasi multi-device & cloud backup real-time gratis.
 * Mendukung offline persistence & fallback otomatis ke LocalStorage.
 * =========================================================================
 */

let db = null;
let isFirebaseConnected = false;
let unsubscribeMedicines = null;
let unsubscribeTransactions = null;

// Konfigurasi Default Project Apotek Medika
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAqcLfXx1F9riXhjHf4ma1POcJX4N2GtQw",
  authDomain: "apotek-medika-4f256.firebaseapp.com",
  projectId: "apotek-medika-4f256",
  storageBucket: "apotek-medika-4f256.firebasestorage.app",
  messagingSenderId: "467229100436",
  appId: "1:467229100436:web:0e088c187bde6f597ca781",
  measurementId: "G-Y402WP4KHJ"
};

// Cek apakah ada konfigurasi Firebase tersimpan (fallback ke default jika kosong)
function getSavedFirebaseConfig() {
  const saved = localStorage.getItem('apotek_firebase_config');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.apiKey) return parsed;
    } catch (e) {
      return DEFAULT_FIREBASE_CONFIG;
    }
  }
  return DEFAULT_FIREBASE_CONFIG;
}

// Inisialisasi Firebase
async function initFirebaseSync() {
  const config = getSavedFirebaseConfig();
  const statusBadge = document.getElementById('badge-cloud-status');

  if (!config || !config.apiKey || !config.projectId) {
    setCloudStatusUI(false, "Mode Lokal (Offline)");
    return false;
  }

  try {
    if (typeof firebase === 'undefined') {
      console.warn("Firebase SDK belum termuat.");
      setCloudStatusUI(false, "SDK Tidak Siap");
      return false;
    }

    // Inisialisasi app jika belum ada
    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }

    db = firebase.firestore();

    // Aktifkan offline persistence browser
    try {
      await db.enablePersistence({ synchronizeTabs: true });
    } catch (err) {
      if (err.code === 'failed-precondition') {
        console.warn('Persistence failed: Multiple tabs open');
      } else if (err.code === 'unimplemented') {
        console.warn('Browser does not support persistence');
      }
    }

    isFirebaseConnected = true;
    setCloudStatusUI(true, "Cloud Sync Aktif");
    showToast("🔥 Terhubung ke Cloud Firebase (Real-time Aktif)", "success");

    // Pasang real-time listener
    setupFirestoreListeners();

    return true;
  } catch (error) {
    console.error("Gagal menghubungkan Firebase:", error);
    setCloudStatusUI(false, "Gagal Koneksi Cloud");
    showToast(`Gagal koneksi Firebase: ${error.message}`, "danger");
    return false;
  }
}

// Pasang Real-Time Listener (onSnapshot)
function setupFirestoreListeners() {
  if (!db) return;

  // 1. Real-time Listener untuk Katalog Obat
  if (unsubscribeMedicines) unsubscribeMedicines();
  unsubscribeMedicines = db.collection('medicines').onSnapshot((snapshot) => {
    if (!snapshot.empty) {
      const cloudMeds = [];
      snapshot.forEach(doc => {
        cloudMeds.push({ id: doc.id, ...doc.data() });
      });
      
      // Update state aplikasi jika ada perubahan dari perangkat lain
      if (cloudMeds.length > 0) {
        medicines = cloudMeds;
        saveMedicinesToStorage();
        if (typeof renderInventoryTable === 'function') renderInventoryTable();
        if (typeof updateInventoryStats === 'function') updateInventoryStats();
      }
    }
  }, (err) => {
    console.warn("Firestore medicines listener:", err);
    if (err.code === 'permission-denied') {
      showToast("Firebase: Aktifkan 'Test Mode' di Firestore Rules agar bisa sync.", "warning");
    } else if (err.code === 'not-found') {
      console.log("Database belum di-create di Firebase console.");
    }
  });

  // 2. Real-time Listener untuk Riwayat Transaksi
  if (unsubscribeTransactions) unsubscribeTransactions();
  unsubscribeTransactions = db.collection('transactions').orderBy('waktu', 'desc').limit(100).onSnapshot((snapshot) => {
    if (!snapshot.empty) {
      const cloudTrx = [];
      snapshot.forEach(doc => {
        cloudTrx.push({ id: doc.id, ...doc.data() });
      });

      if (cloudTrx.length > 0) {
        transactions = cloudTrx;
        saveTransactionsToStorage();
        if (typeof renderTransactionHistory === 'function') renderTransactionHistory();
      }
    }
  }, (err) => {
    console.warn("Firestore transactions listener:", err);
  });
}

// Update Badge Status Cloud di Navbar
function setCloudStatusUI(connected, text) {
  const badge = document.getElementById('badge-cloud-status');
  if (!badge) return;

  if (connected) {
    badge.className = "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 cursor-pointer";
    badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>${text}`;
    badge.title = "Data apotek tersinkronisasi otomatis secara real-time via Cloud Firebase";
  } else {
    badge.className = "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 cursor-pointer";
    badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5"></span>${text}`;
    badge.title = "Data tersimpan di perangkat ini. Klik Pengaturan untuk menghubungkan Cloud Firebase";
  }
}

// Sinkronisasi Simpan / Update Obat ke Cloud
async function syncMedicineToCloud(medicine) {
  if (!db || !isFirebaseConnected) return;
  try {
    await db.collection('medicines').doc(medicine.id).set(medicine, { merge: true });
  } catch (e) {
    console.warn("Gagal simpan obat ke Cloud:", e);
  }
}

// Sinkronisasi Hapus Obat dari Cloud
async function syncDeleteMedicineFromCloud(id) {
  if (!db || !isFirebaseConnected) return;
  try {
    await db.collection('medicines').doc(id).delete();
  } catch (e) {
    console.warn("Gagal hapus obat dari Cloud:", e);
  }
}

// Sinkronisasi Transaksi & Pengurangan Stok ke Cloud
async function syncTransactionToCloud(trx, cartItems) {
  if (!db || !isFirebaseConnected) return;
  try {
    const batch = db.batch();

    // Catat transaksi
    const trxRef = db.collection('transactions').doc(trx.id);
    batch.set(trxRef, trx);

    // Update pengurangan stok untuk setiap obat
    cartItems.forEach(item => {
      const medRef = db.collection('medicines').doc(item.id);
      const currentMed = medicines.find(m => m.id === item.id);
      if (currentMed) {
        batch.update(medRef, { stok: currentMed.stok });
      }
    });

    await batch.commit();
    console.log("Transaksi berhasil di-sync ke Cloud Firestore");
  } catch (e) {
    console.warn("Gagal simpan transaksi ke Cloud:", e);
  }
}

// Migrasi Seluruh Data Lokal ke Cloud Firebase (Tombol 1-Click Upload)
async function uploadAllLocalDataToFirebase() {
  if (!db || !isFirebaseConnected) {
    showToast("Hubungkan ke Firebase terlebih dahulu!", "warning");
    return;
  }

  if (!confirm(`Unggah ${medicines.length} obat & ${transactions.length} transaksi lokal ke Cloud Firebase?`)) {
    return;
  }

  try {
    showToast("Mengunggah data ke Cloud Firebase...", "info");
    
    // Upload obat
    const batch = db.batch();
    medicines.forEach(med => {
      const ref = db.collection('medicines').doc(med.id);
      batch.set(ref, med, { merge: true });
    });

    // Upload transaksi
    transactions.forEach(trx => {
      const ref = db.collection('transactions').doc(trx.id);
      batch.set(ref, trx, { merge: true });
    });

    await batch.commit();
    showToast("✅ Berhasil mengunggah seluruh data apotek ke Cloud Firebase!", "success");
  } catch (err) {
    console.error("Gagal migrasi:", err);
    showToast(`Gagal unggah data: ${err.message}`, "danger");
  }
}

// Simpan Konfigurasi Firebase dari Form Pengaturan
async function saveFirebaseConfigForm(e) {
  e.preventDefault();
  
  const config = {
    apiKey: document.getElementById('fb-api-key').value.trim(),
    authDomain: document.getElementById('fb-auth-domain').value.trim(),
    projectId: document.getElementById('fb-project-id').value.trim(),
    storageBucket: document.getElementById('fb-storage-bucket').value.trim(),
    messagingSenderId: document.getElementById('fb-messaging-sender-id').value.trim(),
    appId: document.getElementById('fb-app-id').value.trim()
  };

  if (!config.apiKey || !config.projectId) {
    showToast("Minimal API Key dan Project ID wajib diisi!", "danger");
    return;
  }

  localStorage.setItem('apotek_firebase_config', JSON.stringify(config));
  
  showToast("Menyambungkan ke Firebase...", "info");
  const success = await initFirebaseSync();

  if (success) {
    showToast("Selamat! Web kasir apotek Anda kini tersambung ke Cloud Google Firebase!", "success");
  }
}

// Putuskan Sambungan Firebase
function disconnectFirebase() {
  if (confirm("Putuskan sambungan dari Cloud Firebase dan kembali ke mode LocalStorage offline?")) {
    localStorage.removeItem('apotek_firebase_config');
    isFirebaseConnected = false;
    db = null;
    if (unsubscribeMedicines) unsubscribeMedicines();
    if (unsubscribeTransactions) unsubscribeTransactions();
    setCloudStatusUI(false, "Mode Lokal (Offline)");
    showToast("Firebase diputuskan. Mode offline aktif.", "info");
  }
}

// Muat Konfigurasi ke Form saat Buka Tab Pengaturan
function populateFirebaseSettingsForm() {
  const config = getSavedFirebaseConfig();
  if (config) {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };
    setVal('fb-api-key', config.apiKey);
    setVal('fb-auth-domain', config.authDomain);
    setVal('fb-project-id', config.projectId);
    setVal('fb-storage-bucket', config.storageBucket);
    setVal('fb-messaging-sender-id', config.messagingSenderId);
    setVal('fb-app-id', config.appId);
  }
}
