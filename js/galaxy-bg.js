/**
 * Particle Network Background
 *
 * Partikel-partikel bergerak pelan dan saling terhubung dengan
 * garis merah tipis saat berdekatan — visualisasi data intelligence
 * / neural network. Sesuai dengan tema talent & organizational insight
 * dari event CALIBRATE.
 */

(function () {
  // Buat canvas dan pasang ke belakang halaman
  var canvas = document.createElement("canvas");
  canvas.id = "galaxy-canvas";
  canvas.style.cssText = [
    "position: fixed",
    "top: 0",
    "left: 0",
    "width: 100%",
    "height: 100%",
    "z-index: 0",
    "pointer-events: none",
  ].join(";");
  document.body.insertBefore(canvas, document.body.firstChild);

  // Pastikan form container tampil di atas canvas
  var formContainer = document.querySelector(".form-container");
  if (formContainer) {
    formContainer.style.position = "relative";
    formContainer.style.zIndex = "1";
  }

  var ctx = canvas.getContext("2d");
  var particles = [];
  var W, H;
  var mouse = { x: -9999, y: -9999 };

  // Konfigurasi
  var PARTICLE_COUNT = 90;
  var MAX_SPEED = 0.28;
  var CONNECTION_DIST = 140;   // jarak maksimal antar partikel untuk terhubung
  var MOUSE_RADIUS = 110;      // radius pengaruh mouse

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function createParticle() {
    var size = 1.2 + Math.random() * 1.8;
    var speed = (0.3 + Math.random() * 0.7) * MAX_SPEED * (1 - size / 6);
    var angle = Math.random() * Math.PI * 2;
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: size,
      // Twinkle
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.006 + Math.random() * 0.014,
      baseOpacity: 0.4 + Math.random() * 0.45,
      // Warna: putih atau hint biru-putih
      color: Math.random() < 0.3
        ? "rgba(180, 210, 255, "   // biru-putih
        : "rgba(255, 255, 255, ",  // putih
    };
  }

  function initParticles() {
    particles = [];
    for (var i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(createParticle());
    }
  }

  // Track posisi mouse untuk interaksi subtle
  window.addEventListener("mousemove", function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener("mouseleave", function () {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, W, H);

    // Update dan gambar setiap partikel
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];

      // Pengaruh mouse — partikel menjauh sedikit dari cursor
      var dx = p.x - mouse.x;
      var dy = p.y - mouse.y;
      var distMouse = Math.sqrt(dx * dx + dy * dy);
      if (distMouse < MOUSE_RADIUS && distMouse > 0) {
        var force = (MOUSE_RADIUS - distMouse) / MOUSE_RADIUS * 0.012;
        p.vx += (dx / distMouse) * force;
        p.vy += (dy / distMouse) * force;
      }

      // Batasi kecepatan supaya tidak terlalu cepat setelah interaksi mouse
      var speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      var maxSpeed = MAX_SPEED * 1.8;
      if (speed > maxSpeed) {
        p.vx = (p.vx / speed) * maxSpeed;
        p.vy = (p.vy / speed) * maxSpeed;
      }

      p.x += p.vx;
      p.y += p.vy;

      // Wrap around
      if (p.x < -5) p.x = W + 5;
      if (p.x > W + 5) p.x = -5;
      if (p.y < -5) p.y = H + 5;
      if (p.y > H + 5) p.y = -5;

      // Twinkle
      p.twinklePhase += p.twinkleSpeed;
      var twinkle = 0.5 + 0.5 * Math.sin(p.twinklePhase);
      var opacity = p.baseOpacity * (0.55 + 0.45 * twinkle);

      // Gambar partikel
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color + opacity + ")";
      ctx.fill();

      // Glow tipis saat twinkle tinggi
      if (twinkle > 0.75 && p.size > 2) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(200, 220, 255, " + (opacity * 0.08) + ")";
        ctx.fill();
      }
    }

    // Gambar garis koneksi antar partikel
    ctx.lineWidth = 0.5;
    for (var i = 0; i < particles.length; i++) {
      for (var j = i + 1; j < particles.length; j++) {
        var a = particles[i];
        var b = particles[j];
        var dx = a.x - b.x;
        var dy = a.y - b.y;
        var dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONNECTION_DIST) {
          // Opacity garis: makin dekat makin kuat
          var lineOpacity = (1 - dist / CONNECTION_DIST) * 0.28;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = "rgba(196, 30, 58, " + lineOpacity + ")";
          ctx.stroke();
        }
      }
    }
  }

  resize();
  initParticles();
  animate();

  window.addEventListener("resize", function () {
    resize();
    initParticles();
  });
})();
