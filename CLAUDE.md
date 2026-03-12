# Calibrate Diagnostic Form

## Project Overview
Form diagnostik bisnis untuk produk **Calibrate** dari Great Tastemaker (GT). User menjawab 5 pertanyaan dengan skala Likert (1–5), lalu mengisi data kontak. Hasil dikirim ke Google Sheets via Google Apps Script webhook.

## Origin
Fork/turunan dari **gt-form-to-sheets** — GT's reusable form-to-sheets template. Menggunakan design system dan pattern yang sama.

## Tech Stack
- **Frontend:** Pure HTML5 + CSS3 + Vanilla JavaScript (no frameworks, no build tools)
- **Backend:** Google Apps Script webhook → Google Sheets
- **Fonts:** Fraunces (headings) + Inter (body) via Google Fonts
- **No npm/node dependencies** — standalone, deploy langsung ke hosting statis

## Project Structure
```
index.html                    # Form diagnostik (5 pertanyaan + kontak)
css/form-styles.css           # GT Brand Design System (CSS variables)
js/form-handler.js            # Step navigation, rating cards, validasi, submit
google-apps-script/webhook.gs # Google Apps Script webhook endpoint
```

## Form Flow
1. **Step 1–5:** Pertanyaan diagnostik bisnis, masing-masing pakai rating cards (1–5)
2. **Step 6:** Halaman kontak (nama, email) + honeypot anti-spam
3. **Submit:** Data dikirim ke Google Sheets via webhook POST
4. **Feedback:** Pesan sukses/error ditampilkan di `#form-message`

## 5 Pertanyaan Diagnostik
1. Visi & arah strategis bisnis (1–3 tahun)
2. Efektivitas tim & kejelasan peran
3. Dokumentasi proses & sistem operasional
4. Strategi pemasaran & branding
5. Evaluasi kinerja berbasis data & metrik

## Key Conventions
- Code comments ditulis dalam **Bahasa Indonesia**
- GT Brand colors: Amber/Gold primary (#C8A24E), warm stone neutrals
- CSS variables untuk semua theming tokens (lihat form-styles.css)
- Validasi: client-side (JS) — setiap pertanyaan wajib dijawab sebelum lanjut
- Honeypot field (`name="website"`) untuk anti-spam

## Development
- No build process — buka `index.html` langsung di browser
- Untuk test submit: deploy Google Apps Script webhook, lalu ganti `WEBHOOK_URL` di `js/form-handler.js`
- Rating cards interaktif: klik card untuk select, auto-advance ke pertanyaan berikutnya
