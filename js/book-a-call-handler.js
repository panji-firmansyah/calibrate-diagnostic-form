/**
 * Book a Call — Form Handler
 *
 * File ini menangani:
 * 1. Validasi field kontak wajib (nama, email, whatsapp, perusahaan, jabatan)
 * 2. Honeypot anti-spam
 * 3. Submit data ke Google Sheets via webhook
 */

// ============================================================
// KONFIGURASI
// ============================================================

// TODO: Ganti dengan URL webhook dari Google Apps Script deployment (sheet Book a Call)
const BOOK_CALL_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbw8VQ6ZpmAWC7F5cmfL77WgpVHGs2Q9tBgVRa0KSF9DB_nkbumyTKafLwIvfvD1SGma/exec";

// Field wajib — id element + pesan error
const REQUIRED_FIELDS = [
  { id: "nama", label: "Nama wajib diisi" },
  { id: "email", label: "Email wajib diisi" },
  { id: "whatsapp", label: "Nomor WhatsApp wajib diisi" },
  { id: "perusahaan", label: "Nama perusahaan wajib diisi" },
  { id: "jabatan", label: "Jabatan wajib diisi" },
];

// ============================================================
// MAIN
// ============================================================
document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("book-a-call-form");
  if (!form) return;

  // --- Event: Submit form ---
  form.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!validateForm()) return;

    // Honeypot check
    var honeypot = form.querySelector("#website");
    if (honeypot && honeypot.value !== "") {
      form.style.display = "none";
      showMessage("success", "<h3>Terima kasih.</h3><p>Request Anda sudah tercatat.</p>");
      return;
    }

    // Kumpulkan data
    var formData = {
      nama: form.querySelector("#nama").value.trim(),
      email: form.querySelector("#email").value.trim(),
      whatsapp: form.querySelector("#whatsapp").value.trim(),
      perusahaan: form.querySelector("#perusahaan").value.trim(),
      jabatan: form.querySelector("#jabatan").value.trim(),
      topik: form.querySelector("#topik").value.trim(),
      pesan: form.querySelector("#pesan").value.trim(),
    };

    // Loading state
    var submitBtn = form.querySelector(".btn-submit");
    submitBtn.disabled = true;
    submitBtn.textContent = "Mengirim...";

    // Kirim ke webhook
    fetch(BOOK_CALL_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
      mode: "no-cors",
    })
      .then(function () {
        form.style.display = "none";
        showMessage(
          "success",
          '<div class="confirm-icon">' +
            '<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<circle cx="22" cy="22" r="21" stroke="rgba(196,30,58,0.45)" stroke-width="1"/>' +
            '<path d="M14 22l6 6 10-12" stroke="#C41E3A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
            "</svg>" +
          "</div>" +
          '<div class="confirm-eyebrow">Calibrate — Book a Call</div>' +
          "<h3>Request Diterima.</h3>" +
          '<hr class="confirm-divider">' +
          '<div class="confirm-body">' +
            "<p>Terima kasih atas ketertarikan Anda.</p>" +
            "<p>Tim kami akan menghubungi Anda dalam 1×24 jam<br>untuk mengatur jadwal sesi konsultasi.</p>" +
          "</div>"
        );
      })
      .catch(function (error) {
        console.error("Submit error:", error);
        showMessage("error", "Maaf, terjadi kesalahan. Silakan coba lagi.");
        submitBtn.disabled = false;
        submitBtn.textContent = "BOOK A CALL";
      });
  });
});

// ============================================================
// FUNGSI: Validasi form — cek semua field wajib
// ============================================================
function validateForm() {
  var form = document.getElementById("book-a-call-form");
  var isValid = true;

  REQUIRED_FIELDS.forEach(function (field) {
    var input = form.querySelector("#" + field.id);
    var group = input.closest(".form-group");
    var errorDiv = group.querySelector(".field-error");
    var value = input.value.trim();

    if (!value) {
      group.classList.add("has-error");
      if (errorDiv) errorDiv.textContent = field.label;
      isValid = false;
    } else {
      group.classList.remove("has-error");
      if (errorDiv) errorDiv.textContent = "";
    }
  });

  // Validasi format email
  var emailInput = form.querySelector("#email");
  var emailValue = emailInput.value.trim();
  if (emailValue && !isValidEmail(emailValue)) {
    var emailGroup = emailInput.closest(".form-group");
    var emailError = emailGroup.querySelector(".field-error");
    emailGroup.classList.add("has-error");
    if (emailError) emailError.textContent = "Format email tidak valid";
    isValid = false;
  }

  // Scroll ke error pertama
  if (!isValid) {
    var firstError = form.querySelector(".has-error input, .field-error:not(:empty)");
    if (firstError) {
      firstError.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  return isValid;
}

// ============================================================
// FUNGSI: Validasi format email sederhana
// ============================================================
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ============================================================
// FUNGSI: Tampilkan pesan sukses/error
// ============================================================
function showMessage(type, html) {
  var messageDiv = document.getElementById("form-message");
  messageDiv.innerHTML = html;
  messageDiv.className = "form-message " + type;
  messageDiv.style.display = "block";
  messageDiv.scrollIntoView({ behavior: "smooth", block: "center" });
}
