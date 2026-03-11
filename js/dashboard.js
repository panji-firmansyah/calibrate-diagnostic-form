/*
 * Calibrate Dashboard — Admin Dashboard Logic
 *
 * Fetch data dari Google Sheets via Apps Script doGet(),
 * render summary cards, radar chart (SVG), dimension bars,
 * tier distribution, dimensi breakdown, dan PDF export.
 */

// URL webhook — sama dengan yang di form-handler.js
var DASHBOARD_WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbwyzyFTyd3aqtQ-ft0z95Y96uEtRSZZlZO41HT-WOIKlCoZ7PUl8E9TeA-PIoWzR1uJZw/exec";

// Konfigurasi dimensi diagnostic
var DIMENSIONS = [
  { key: "q1_hiring", label: "Proses Rekrutmen", short: "Rekrutmen" },
  { key: "q2_activation", label: "Aktivasi New Hire", short: "Aktivasi" },
  { key: "q3_succession", label: "Kesiapan Suksesi", short: "Suksesi" },
  { key: "q4_data", label: "Keputusan Berbasis Data", short: "Data" },
  { key: "q5_integration", label: "Integrasi Proses Talent", short: "Integrasi" },
];

// Konfigurasi tier berdasarkan total score (5-25)
var TIERS = [
  { min: 5, max: 10, label: "Fragmentaris", color: "#C41E3A" },
  { min: 11, max: 15, label: "Berkembang", color: "#C9A84C" },
  { min: 16, max: 20, label: "Terstruktur", color: "#4CAF50" },
  { min: 21, max: 25, label: "Terintegrasi", color: "#16A34A" },
];

// ============================================================
// INIT — Jalankan saat DOM ready
// ============================================================
document.addEventListener("DOMContentLoaded", function () {
  fetchData();

  var exportBtn = document.getElementById("btn-export-pdf");
  if (exportBtn) {
    exportBtn.addEventListener("click", exportToPDF);
  }
});

// ============================================================
// FETCH DATA dari Google Sheets
// ============================================================
function fetchData() {
  var contentEl = document.getElementById("dashboard-content");
  var loadingEl = document.getElementById("dashboard-loading");
  var errorEl = document.getElementById("dashboard-error");

  // Tampilkan loading
  loadingEl.style.display = "block";
  contentEl.style.display = "none";
  errorEl.style.display = "none";

  fetch(DASHBOARD_WEBHOOK_URL)
    .then(function (response) {
      return response.json();
    })
    .then(function (result) {
      loadingEl.style.display = "none";

      if (result.status === "error") {
        showError(result.message || "Gagal memuat data.");
        return;
      }

      if (!result.data || result.data.length === 0) {
        document.getElementById("dashboard-empty").style.display = "block";
        return;
      }

      // Render semua section
      contentEl.style.display = "block";
      renderDashboard(result.data);
    })
    .catch(function (error) {
      loadingEl.style.display = "none";
      console.error("Dashboard fetch error:", error);
      showError("Gagal terhubung ke server. Periksa koneksi internet Anda.");
    });
}

function showError(message) {
  var errorEl = document.getElementById("dashboard-error");
  errorEl.style.display = "block";
  errorEl.querySelector("p").textContent = message;
}

// ============================================================
// RENDER DASHBOARD
// ============================================================
function renderDashboard(data) {
  var averages = calculateAverages(data);
  var tierDist = calculateTierDistribution(data);

  renderSummaryCards(data, averages);
  renderRadarChart(averages);
  renderDimensionBars(averages);
  renderTierDistribution(tierDist, data.length);
  renderDimensionBreakdown(data);
  updateMeta(data);

  // Trigger bar animations setelah render
  requestAnimationFrame(function () {
    animateBars();
  });
}

// ============================================================
// KALKULASI
// ============================================================
function calculateAverages(data) {
  var sums = {};
  var count = data.length;

  DIMENSIONS.forEach(function (dim) {
    sums[dim.key] = 0;
  });

  data.forEach(function (row) {
    DIMENSIONS.forEach(function (dim) {
      sums[dim.key] += parseFloat(row[dim.key]) || 0;
    });
  });

  var averages = {};
  DIMENSIONS.forEach(function (dim) {
    averages[dim.key] = count > 0 ? sums[dim.key] / count : 0;
  });

  // Hitung rata-rata total
  var totalSum = 0;
  DIMENSIONS.forEach(function (dim) {
    totalSum += averages[dim.key];
  });
  averages._total = totalSum;

  return averages;
}

function calculateTierDistribution(data) {
  var dist = {};
  TIERS.forEach(function (tier) {
    dist[tier.label] = 0;
  });

  data.forEach(function (row) {
    var total = 0;
    DIMENSIONS.forEach(function (dim) {
      total += parseInt(row[dim.key]) || 0;
    });
    var tier = getTier(total);
    if (tier) {
      dist[tier.label]++;
    }
  });

  return dist;
}

function getTier(totalScore) {
  for (var i = 0; i < TIERS.length; i++) {
    if (totalScore >= TIERS[i].min && totalScore <= TIERS[i].max) {
      return TIERS[i];
    }
  }
  if (totalScore < 5) return TIERS[0];
  return TIERS[TIERS.length - 1];
}

function getDimensionInsight(score) {
  if (score < 2.5) return "Perlu perhatian segera";
  if (score < 3.5) return "Dalam pengembangan";
  return "Area kekuatan";
}

// Cari dimensi terkuat & terlemah
function findStrongestWeakest(averages) {
  var strongest = null;
  var weakest = null;
  var maxScore = -1;
  var minScore = 6;

  DIMENSIONS.forEach(function (dim) {
    var score = averages[dim.key];
    if (score > maxScore) {
      maxScore = score;
      strongest = dim;
    }
    if (score < minScore) {
      minScore = score;
      weakest = dim;
    }
  });

  return { strongest: strongest, weakest: weakest };
}

// ============================================================
// RENDER SUMMARY CARDS
// ============================================================
function renderSummaryCards(data, averages) {
  // Total responden
  document.getElementById("stat-total").textContent = data.length;

  // Rata-rata total score
  var avgTotal = averages._total;
  document.getElementById("stat-avg-score").textContent = avgTotal.toFixed(1);

  // Tier rata-rata
  var avgTier = getTier(Math.round(avgTotal));
  var tierEl = document.getElementById("stat-avg-tier");
  tierEl.textContent = avgTier.label;
  tierEl.style.color = avgTier.color;

  // Dimensi terkuat & terlemah
  var sw = findStrongestWeakest(averages);
  if (sw.strongest) {
    document.getElementById("stat-strongest").textContent =
      sw.strongest.short + " (" + averages[sw.strongest.key].toFixed(1) + ")";
  }
  if (sw.weakest) {
    document.getElementById("stat-weakest").textContent =
      sw.weakest.short + " (" + averages[sw.weakest.key].toFixed(1) + ")";
  }
}

// ============================================================
// RENDER RADAR CHART (SVG)
// ============================================================
function renderRadarChart(averages) {
  var container = document.getElementById("radar-chart");
  var size = 480;
  var cx = size / 2;
  var cy = size / 2;
  var radius = 170;
  var levels = 5;

  var axes = DIMENSIONS.map(function (dim, i) {
    var angle = -Math.PI / 2 + (2 * Math.PI / DIMENSIONS.length) * i;
    return {
      key: dim.key,
      label: dim.short,
      angle: angle,
    };
  });

  var svgParts = [];
  svgParts.push(
    '<svg viewBox="0 0 ' + size + " " + size + '" xmlns="http://www.w3.org/2000/svg">'
  );

  // Grid pentagons (level 1-5)
  for (var level = 1; level <= levels; level++) {
    var r = (radius * level) / levels;
    var points = axes
      .map(function (axis) {
        var x = cx + r * Math.cos(axis.angle);
        var y = cy + r * Math.sin(axis.angle);
        return x.toFixed(1) + "," + y.toFixed(1);
      })
      .join(" ");

    svgParts.push(
      '<polygon points="' + points + '" ' +
      'fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>'
    );
  }

  // Axis lines
  axes.forEach(function (axis) {
    var x2 = cx + radius * Math.cos(axis.angle);
    var y2 = cy + radius * Math.sin(axis.angle);
    svgParts.push(
      '<line x1="' + cx + '" y1="' + cy + '" ' +
      'x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" ' +
      'stroke="rgba(255,255,255,0.07)" stroke-width="1"/>'
    );
  });

  // Score polygon — glow effect
  var scorePoints = axes
    .map(function (axis) {
      var score = averages[axis.key] || 0;
      var r = (radius * score) / 5;
      var x = cx + r * Math.cos(axis.angle);
      var y = cy + r * Math.sin(axis.angle);
      return x.toFixed(1) + "," + y.toFixed(1);
    })
    .join(" ");

  // Glow layer
  svgParts.push(
    '<polygon points="' + scorePoints + '" ' +
    'fill="rgba(196,30,58,0.12)" stroke="rgba(196,30,58,0.4)" stroke-width="4" ' +
    'filter="url(#glow)"/>'
  );

  // Main polygon
  svgParts.push(
    '<polygon points="' + scorePoints + '" ' +
    'fill="rgba(196,30,58,0.22)" stroke="#C41E3A" stroke-width="2"/>'
  );

  // SVG filter for glow
  svgParts.push(
    '<defs><filter id="glow"><feGaussianBlur stdDeviation="4" result="blur"/>' +
    '<feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>' +
    '</filter></defs>'
  );

  // Score dots
  axes.forEach(function (axis) {
    var score = averages[axis.key] || 0;
    var r = (radius * score) / 5;
    var x = cx + r * Math.cos(axis.angle);
    var y = cy + r * Math.sin(axis.angle);
    svgParts.push(
      '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" ' +
      'r="5" fill="#C41E3A" stroke="#0A0A0A" stroke-width="2"/>'
    );
  });

  // Axis labels + score
  axes.forEach(function (axis) {
    var score = averages[axis.key] || 0;
    var labelR = radius + 35;
    var x = cx + labelR * Math.cos(axis.angle);
    var y = cy + labelR * Math.sin(axis.angle);

    var anchor = "middle";
    if (Math.cos(axis.angle) > 0.3) anchor = "start";
    if (Math.cos(axis.angle) < -0.3) anchor = "end";

    var yOffset = 0;
    if (Math.sin(axis.angle) < -0.3) yOffset = -6;
    if (Math.sin(axis.angle) > 0.3) yOffset = 14;

    svgParts.push(
      '<text x="' + x.toFixed(1) + '" y="' + (y + yOffset).toFixed(1) + '" ' +
      'text-anchor="' + anchor + '" ' +
      'fill="#E0E0E0" font-size="14" font-weight="700">' +
      axis.label +
      "</text>"
    );

    svgParts.push(
      '<text x="' + x.toFixed(1) + '" y="' + (y + yOffset + 16).toFixed(1) + '" ' +
      'text-anchor="' + anchor + '" ' +
      'fill="#C41E3A" font-size="16" font-weight="900">' +
      score.toFixed(1) +
      "</text>"
    );
  });

  svgParts.push("</svg>");
  container.innerHTML = svgParts.join("");
}

// ============================================================
// RENDER DIMENSION BARS
// ============================================================
function renderDimensionBars(averages) {
  var container = document.getElementById("dimension-bars");
  var html = "";

  DIMENSIONS.forEach(function (dim) {
    var score = averages[dim.key] || 0;
    var pct = (score / 5) * 100;
    var insight = getDimensionInsight(score);

    var color;
    if (score < 2.5) color = "#C41E3A";
    else if (score < 3.5) color = "#C9A84C";
    else color = "#4CAF50";

    html +=
      '<div class="dimension-item">' +
        '<div class="dimension-header">' +
          '<span class="dimension-name">' + dim.label + "</span>" +
          '<span class="dimension-score">' + score.toFixed(1) + " / 5</span>" +
        "</div>" +
        '<div class="dimension-bar-track">' +
          '<div class="dimension-bar-fill" data-width="' + pct + '" ' +
          'style="background-color: ' + color + ';"></div>' +
        "</div>" +
        '<span class="dimension-insight">' + insight + "</span>" +
      "</div>";
  });

  container.innerHTML = html;
}

// ============================================================
// RENDER TIER DISTRIBUTION
// ============================================================
function renderTierDistribution(dist, total) {
  var container = document.getElementById("tier-distribution");
  var html = "";

  for (var i = TIERS.length - 1; i >= 0; i--) {
    var tier = TIERS[i];
    var count = dist[tier.label] || 0;
    var pct = total > 0 ? (count / total) * 100 : 0;

    html +=
      '<div class="tier-item">' +
        '<span class="tier-label" style="color: ' + tier.color + ';">' +
          tier.label +
        "</span>" +
        '<div class="tier-bar-track">' +
          '<div class="tier-bar-fill" data-width="' + pct + '" ' +
          'style="background-color: ' + tier.color + ';"></div>' +
        "</div>" +
        '<span class="tier-count">' +
          count + " (" + Math.round(pct) + "%)" +
        "</span>" +
      "</div>";
  }

  container.innerHTML = html;
}

// ============================================================
// RENDER DIMENSI BREAKDOWN — Distribusi jawaban 1-5 per dimensi
// ============================================================
function renderDimensionBreakdown(data) {
  var container = document.getElementById("dimension-breakdown");
  var total = data.length;
  var html = "";

  DIMENSIONS.forEach(function (dim) {
    // Hitung distribusi jawaban 1-5
    var counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    data.forEach(function (row) {
      var val = parseInt(row[dim.key]) || 0;
      if (val >= 1 && val <= 5) {
        counts[val]++;
      }
    });

    html += '<div class="breakdown-item">';
    html += '<div class="breakdown-label">' + dim.short + "</div>";
    html += '<div class="breakdown-bars">';

    for (var s = 1; s <= 5; s++) {
      var pct = total > 0 ? (counts[s] / total) * 100 : 0;
      var label = pct >= 8 ? Math.round(pct) + "%" : "";
      html +=
        '<div class="breakdown-segment" data-score="' + s + '" ' +
        'data-width="' + pct + '" ' +
        'title="Skor ' + s + ': ' + counts[s] + ' (' + Math.round(pct) + '%)">' +
        label +
        "</div>";
    }

    html += "</div></div>";
  });

  // Legend
  html += '<div class="breakdown-legend">';
  var legendColors = ["#C41E3A", "#D4614E", "#C9A84C", "#6DAF5C", "#16A34A"];
  for (var s = 1; s <= 5; s++) {
    html +=
      '<div class="legend-item">' +
      '<div class="legend-dot" style="background:' + legendColors[s - 1] + ';"></div>' +
      "Skor " + s +
      "</div>";
  }
  html += "</div>";

  container.innerHTML = html;
}

// ============================================================
// UPDATE META
// ============================================================
function updateMeta(data) {
  var metaEl = document.getElementById("dashboard-meta");
  if (metaEl) {
    var now = new Date();
    metaEl.textContent =
      "Data per " +
      now.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }) +
      " \u2022 " +
      data.length +
      " responden";
  }
}

// ============================================================
// ANIMATE BARS — Trigger setelah render
// ============================================================
function animateBars() {
  var fills = document.querySelectorAll(
    ".dimension-bar-fill, .tier-bar-fill, .breakdown-segment"
  );
  fills.forEach(function (el) {
    var width = el.getAttribute("data-width");
    if (width) {
      el.style.width = width + "%";
    }
  });
}

// ============================================================
// PDF EXPORT
// ============================================================
function exportToPDF() {
  var btn = document.getElementById("btn-export-pdf");
  btn.disabled = true;
  btn.textContent = "GENERATING PDF...";

  var dashboardEl = document.querySelector(".panel-frame");

  // Tambah class untuk solid background (html2canvas tidak support backdrop-filter)
  dashboardEl.classList.add("pdf-capture");

  html2canvas(dashboardEl, {
    scale: 2,
    backgroundColor: "#0A0A0A",
    useCORS: true,
    logging: false,
  })
    .then(function (canvas) {
      var imgData = canvas.toDataURL("image/png");
      var pdf = new jspdf.jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      var pdfWidth = pdf.internal.pageSize.getWidth();
      var pdfHeight = pdf.internal.pageSize.getHeight();
      var margin = 8;
      var contentWidth = pdfWidth - margin * 2;

      var imgWidth = canvas.width;
      var imgHeight = canvas.height;
      var ratio = contentWidth / imgWidth;
      var contentHeight = imgHeight * ratio;

      // Kalau konten lebih tinggi dari halaman, scale down
      if (contentHeight > pdfHeight - margin * 2) {
        var scaleDown = (pdfHeight - margin * 2) / contentHeight;
        contentWidth = contentWidth * scaleDown;
        contentHeight = contentHeight * scaleDown;
        margin = (pdfWidth - contentWidth) / 2;
      }

      var yOffset = (pdfHeight - contentHeight) / 2;
      pdf.addImage(imgData, "PNG", margin, yOffset, contentWidth, contentHeight);

      var dateStr = new Date().toISOString().split("T")[0];
      pdf.save("calibrate-dashboard-" + dateStr + ".pdf");

      dashboardEl.classList.remove("pdf-capture");
      btn.disabled = false;
      btn.textContent = "DOWNLOAD PDF DASHBOARD";
    })
    .catch(function (error) {
      console.error("PDF export error:", error);
      dashboardEl.classList.remove("pdf-capture");
      btn.disabled = false;
      btn.textContent = "DOWNLOAD PDF DASHBOARD";
      alert("Gagal generate PDF. Silakan coba lagi.");
    });
}
