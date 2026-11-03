/**
 * =========================================================================
 * SECURITY GUARD & ANTI-HACK SYSTEM (security-guard.js)
 * Fitur Keamanan:
 * 1. Sanitasi Input Anti-XSS (Script Injection Guard).
 * 2. Proteksi PIN Owner untuk Aksi Sensitif (Pengaturan, Hapus Data, dsb).
 * 3. Lock Screen / Kunci Kasir saat ditinggal istirahat.
 * 4. Proteksi Anti-Brute Force (Cooldown setelah 5x gagal PIN).
 * 5. Validasi Integritas Data Sebelum Masuk Storage & Cloud.
 * =========================================================================
 */

// -------------------------------------------------------------------------
// 1. SANITASI INPUT ANTI-XSS
// -------------------------------------------------------------------------
function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// -------------------------------------------------------------------------
// 2. SISTEM PIN OWNER & ANTI-BRUTE FORCE
// -------------------------------------------------------------------------
let failedPinAttempts = 0;
let pinLockoutUntil = 0;
let pendingSecureCallback = null;

function getOwnerPIN() {
  const currentSettings = localStorage.getItem('apotek_settings');
  if (currentSettings) {
    try {
      const parsed = JSON.parse(currentSettings);
      if (parsed.ownerPin) return String(parsed.ownerPin).trim();
    } catch (e) {}
  }
  return '1234'; // Default PIN awal
}

function setOwnerPIN(newPin) {
  if (!newPin || newPin.length < 4) {
    showToast("PIN minimal harus 4 digit angka!", "danger");
    return false;
  }
  settings.ownerPin = String(newPin).trim();
  saveSettingsToStorage();
  showToast("✅ PIN Keamanan Owner berhasil diperbarui!", "success");
  return true;
}

// Dialog Minta PIN untuk Aksi Sensitif
function requireOwnerPIN(actionName, callback) {
  // Cek apakah sedang dalam masa lockout akibat salah berkali-kali
  const now = Date.now();
  if (now < pinLockoutUntil) {
    const remainingSec = Math.ceil((pinLockoutUntil - now) / 1000);
    showToast(`⚠️ Terkunci sementara! Coba lagi dalam ${remainingSec} detik.`, "danger");
    return;
  }

  pendingSecureCallback = callback;
  const modal = document.getElementById('modal-pin-security');
  const titleEl = document.getElementById('pin-modal-title');
  const inputEl = document.getElementById('input-security-pin');

  if (titleEl) titleEl.textContent = `Verifikasi PIN: ${actionName}`;
  if (inputEl) {
    inputEl.value = '';
    setTimeout(() => inputEl.focus(), 150);
  }

  if (modal) modal.classList.remove('hidden');
}

function verifyEnteredPIN() {
  const now = Date.now();
  if (now < pinLockoutUntil) {
    const remainingSec = Math.ceil((pinLockoutUntil - now) / 1000);
    showToast(`⚠️ Terkunci sementara! Coba lagi dalam ${remainingSec} detik.`, "danger");
    return;
  }

  const inputEl = document.getElementById('input-security-pin');
  const entered = inputEl ? inputEl.value.trim() : '';
  const correctPin = getOwnerPIN();

  if (entered === correctPin) {
    failedPinAttempts = 0;
    closePinModal();
    if (typeof pendingSecureCallback === 'function') {
      const cb = pendingSecureCallback;
      pendingSecureCallback = null;
      cb();
    }
  } else {
    failedPinAttempts++;
    sfx.playAlertNewItem();
    if (failedPinAttempts >= 5) {
      pinLockoutUntil = Date.now() + 30000; // Lockout 30 detik
      showToast("⚠️ 5x salah PIN berturut-turut! Sistem terkunci selama 30 detik.", "danger");
      closePinModal();
    } else {
      showToast(`PIN salah! Sisa percobaan: ${5 - failedPinAttempts}`, "warning");
      if (inputEl) {
        inputEl.value = '';
        inputEl.focus();
      }
    }
  }
}

function closePinModal() {
  const modal = document.getElementById('modal-pin-security');
  if (modal) modal.classList.add('hidden');
  pendingSecureCallback = null;
}

// -------------------------------------------------------------------------
// 3. LOCK SCREEN KASIR (KUNCI LAYAR)
// -------------------------------------------------------------------------
let isScreenLocked = false;

function lockCashierScreen() {
  isScreenLocked = true;
  const overlay = document.getElementById('screen-lock-overlay');
  const input = document.getElementById('lock-pin-input');
  if (overlay) overlay.classList.remove('hidden');
  if (input) {
    input.value = '';
    setTimeout(() => input.focus(), 150);
  }
  showToast("🔒 Layar kasir terkunci aman.", "info");
}

function unlockCashierScreen() {
  const input = document.getElementById('lock-pin-input');
  const entered = input ? input.value.trim() : '';

  if (entered === getOwnerPIN()) {
    isScreenLocked = false;
    failedPinAttempts = 0;
    const overlay = document.getElementById('screen-lock-overlay');
    if (overlay) overlay.classList.add('hidden');
    showToast("🔓 Layar kasir terbuka kembali.", "success");
  } else {
    failedPinAttempts++;
    sfx.playAlertNewItem();
    showToast("PIN pembuka salah!", "danger");
    if (input) {
      input.value = '';
      input.focus();
    }
  }
}

// -------------------------------------------------------------------------
// 4. VALIDASI INTEGRITAS DATA (ANTI DATA CORRUPTION)
// -------------------------------------------------------------------------
function validateMedicineData(item) {
  if (!item || typeof item !== 'object') return false;
  if (!item.nama || typeof item.nama !== 'string' || item.nama.trim().length === 0) return false;
  if (!item.barcode || typeof item.barcode !== 'string') return false;

  // Sanitasi barcode & nama
  item.barcode = escapeHtml(String(item.barcode).trim());
  item.nama = escapeHtml(String(item.nama).trim());
  item.hargaBeli = Math.max(0, parseInt(item.hargaBeli, 10) || 0);
  item.hargaJual = Math.max(0, parseInt(item.hargaJual, 10) || 0);
  item.stok = Math.max(0, parseInt(item.stok, 10) || 0);

  return true;
}
