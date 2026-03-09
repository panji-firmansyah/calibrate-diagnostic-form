/**
 * Calibrate Diagnostic Form Handler
 *
 * File ini menangani:
 * 1. Rating button selection (tap button 1-5)
 * 2. Validasi — semua field dan pertanyaan wajib diisi sebelum submit
 * 3. Kumpulkan semua jawaban + info kontak, kirim ke Google Sheets
 */

// ============================================================
// KONFIGURASI
// ============================================================

// TODO: Ganti dengan URL webhook dari Google Apps Script deployment
const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbzirQUg8c-2Eqd_SBQsmRrGpk9_2sNFK_T2DjhomhasSMuU-dgSvCqQ5NH0glET5XjJdw/exec";

// Nama field diagnostik sesuai urutan pertanyaan
const QUESTION_FIELDS = ["q1_hiring", "q2_activation", "q3_succession", "q4_data", "q5_integration"];

// ============================================================
// STATE — Menyimpan jawaban diagnostik
// ============================================================
let answers = {};

// ============================================================
// MAIN — Jalankan setelah halaman selesai loading
// ============================================================
document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("calibrate-form");
  if (!form) return;

  // --- Event: Klik rating button ---
  // Pakai event delegation di form supaya semua button tertangkap
  form.addEventListener("click", function (event) {
    var btn = event.target.closest(".rating-btn");
    if (!btn) return;

    var questionItem = btn.closest(".question-item");
    var questionName = questionItem.dataset.question;
    var value = btn.dataset.value;

    // Hapus selected dari semua button di pertanyaan ini
    questionItem.querySelectorAll(".rating-btn").forEach(function (b) {
      b.classList.remove("selected");
    });

    // Tandai button yang diklik sebagai selected
    btn.classList.add("selected");

    // Simpan jawaban
    answers[questionName] = value;

    // Hapus error kalau ada
    var errorDiv = questionItem.querySelector(".field-error");
    if (errorDiv) errorDiv.textContent = "";
  });

  // --- Event: Submit form ---
  form.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!validateForm()) return;

    // Honeypot check — kalau diisi, pura-pura sukses (bot)
    var honeypot = form.querySelector("#website");
    if (honeypot && honeypot.value !== "") {
      form.style.display = "none";
      showMessage("success", "<h3>Terima kasih.</h3><p>Diagnostic Anda sudah tercatat.</p>");
      return;
    }

    // Kumpulkan data kontak
    var nama = form.querySelector("#nama").value.trim();
    var perusahaan = form.querySelector("#perusahaan").value.trim();
    var jabatan = form.querySelector("#jabatan").value.trim();

    // Susun data yang akan dikirim
    var formData = {
      nama: nama,
      perusahaan: perusahaan,
      jabatan: jabatan,
      q1_hiring: answers["q1_hiring"],
      q2_activation: answers["q2_activation"],
      q3_succession: answers["q3_succession"],
      q4_data: answers["q4_data"],
      q5_integration: answers["q5_integration"],
    };

    // Hitung total score
    var totalScore = QUESTION_FIELDS.reduce(function (sum, key) {
      return sum + parseInt(answers[key] || 0);
    }, 0);
    formData["total_score"] = totalScore;

    // Loading state
    var submitBtn = form.querySelector(".btn-submit");
    submitBtn.disabled = true;
    submitBtn.textContent = "Mengirim...";

    // Kirim ke webhook
    fetch(WEBHOOK_URL, {
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
            '</svg>' +
          '</div>' +
          '<div class="confirm-eyebrow">Calibrate — Talent Diagnostic</div>' +
          '<h3>Terima Kasih.</h3>' +
          '<hr class="confirm-divider">' +
          '<div class="confirm-body">' +
            '<p>Diagnostic Anda sudah tercatat.</p>' +
            '<p>Personalized scorecard akan dikirimkan<br>dalam 24 jam setelah event.</p>' +
          '</div>'
        );
      })
      .catch(function (error) {
        console.error("Submit error:", error);
        showMessage("error", "Maaf, terjadi kesalahan. Silakan coba lagi.");
        submitBtn.disabled = false;
        submitBtn.textContent = "SUBMIT DIAGNOSTIC";
      });
  });
});

// ============================================================
// FUNGSI: Validasi seluruh form sebelum submit
// ============================================================
function validateForm() {
  var form = document.getElementById("calibrate-form");
  var isValid = true;

  // Validasi field kontak: nama
  var namaGroup = form.querySelector("#nama").closest(".form-group");
  var namaValue = form.querySelector("#nama").value.trim();
  var namaError = namaGroup.querySelector(".field-error");
  if (!namaValue) {
    namaGroup.classList.add("has-error");
    namaError.textContent = "Nama wajib diisi";
    isValid = false;
  } else {
    namaGroup.classList.remove("has-error");
    namaError.textContent = "";
  }

  // Validasi field kontak: perusahaan
  var perusahaanGroup = form.querySelector("#perusahaan").closest(".form-group");
  var perusahaanValue = form.querySelector("#perusahaan").value.trim();
  var perusahaanError = perusahaanGroup.querySelector(".field-error");
  if (!perusahaanValue) {
    perusahaanGroup.classList.add("has-error");
    perusahaanError.textContent = "Nama perusahaan wajib diisi";
    isValid = false;
  } else {
    perusahaanGroup.classList.remove("has-error");
    perusahaanError.textContent = "";
  }

  // Validasi field kontak: jabatan
  var jabatanGroup = form.querySelector("#jabatan").closest(".form-group");
  var jabatanValue = form.querySelector("#jabatan").value.trim();
  var jabatanError = jabatanGroup.querySelector(".field-error");
  if (!jabatanValue) {
    jabatanGroup.classList.add("has-error");
    jabatanError.textContent = "Jabatan wajib diisi";
    isValid = false;
  } else {
    jabatanGroup.classList.remove("has-error");
    jabatanError.textContent = "";
  }

  // Validasi setiap pertanyaan diagnostik — wajib dijawab
  QUESTION_FIELDS.forEach(function (questionName) {
    var questionItem = form.querySelector('[data-question="' + questionName + '"]');
    if (!questionItem) return;

    var errorDiv = questionItem.querySelector(".field-error");
    if (!answers[questionName]) {
      if (errorDiv) errorDiv.textContent = "Silakan pilih salah satu jawaban";
      isValid = false;
    } else {
      if (errorDiv) errorDiv.textContent = "";
    }
  });

  // Scroll ke error pertama jika ada
  if (!isValid) {
    var firstError = form.querySelector(".has-error input, .field-error:not(:empty)");
    if (firstError) {
      firstError.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  return isValid;
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
