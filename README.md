# AI Image Sharpener Pro
### React + Vite · 100% Gratis · Client-Side AI

Web app modern untuk **upscale**, **sharpen**, dan **denoise** gambar dengan AI (ESRGAN), termasuk **batch processing**.

Gambar **tidak pernah di-upload** ke server — semua proses di browser.

---

## Fitur

- AI Super Resolution (ESRGAN Slim / Medium / Thick)
- Mode: **Upscale** · **Sharpen Max** · **Denoise + Upscale**
- Scale 2× / 4×
- **Batch** multi-gambar (antrian berurutan)
- Before/After comparison slider
- Download PNG & JPG per gambar + download semua
- Drag & drop + paste (Ctrl+V)
- Progress per item
- UI React modern (dark)

---

## Quick Start (Lokal)

### Syarat
- Node.js 18+ (disarankan 20+)
- Browser modern (Chrome / Edge / Brave)

### Install & Jalankan

```bash
cd image-upscaler-react
npm install
npm run dev
```

Buka URL yang muncul (biasanya `http://localhost:5173`).

### Build Production

```bash
npm run build
npm run preview
```

Output ada di folder `dist/`.

---

## Deploy Gratis — Step by Step Detail

### A) Cloudflare Pages (Recommended — unlimited bandwidth)

1. **Push ke GitHub**
   ```bash
   git init
   git add .
   git commit -m "AI Image Sharpener Pro"
   # buat repo kosong di github.com, lalu:
   git remote add origin https://github.com/USERNAME/image-upscaler-react.git
   git branch -M main
   git push -u origin main
   ```

2. Buka [dash.cloudflare.com](https://dash.cloudflare.com) → login / daftar gratis.

3. Menu kiri: **Workers & Pages** → **Create** → tab **Pages** → **Connect to Git**.

4. Authorize GitHub → pilih repo `image-upscaler-react`.

5. **Build settings:**
   | Field | Value |
   |-------|--------|
   | Framework preset | **Vite** |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Root directory | `/` (kosong) |
   | Node version (Environment variables) | `NODE_VERSION` = `20` |

6. Klik **Save and Deploy**.

7. Tunggu 1–3 menit → dapat URL `xxx.pages.dev`.

8. **Custom domain (opsional):**  
   Settings → Custom domains → Add → ikuti DNS (bisa domain gratis/murah).

**Troubleshooting Cloudflare:**
- Build gagal OOM? Tambah env `NODE_OPTIONS=--max-old-space-size=4096`
- Model TF gagal load di production? Pastikan HTTPS (otomatis di Pages)
- Cache: setelah update, purge cache atau hard refresh

---

### B) Vercel (Sangat mudah)

1. Push repo ke GitHub (sama seperti di atas).

2. Buka [vercel.com](https://vercel.com) → **Add New** → **Project** → Import repo.

3. Framework: **Vite** (terdeteksi otomatis).
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. Klik **Deploy**.

5. Dapat URL `xxx.vercel.app`.

**Catatan Vercel Hobby:** free plan untuk **non-commercial / personal**.  
Kalau dipakai bisnis, pilih Cloudflare Pages atau Netlify.

---

### C) Netlify

1. [app.netlify.com](https://app.netlify.com) → Add new site → Import from Git  
   **atau** drag folder `dist` ke [app.netlify.com/drop](https://app.netlify.com/drop) setelah `npm run build`.

2. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`

3. Deploy.

---

### D) GitHub Pages (static)

```bash
npm run build
# deploy dist/ ke branch gh-pages (pakai action atau manual)
```

Tambahkan di `vite.config.ts` jika repo bukan root domain:
```ts
base: '/nama-repo/',
```

---

## Struktur Project

```
image-upscaler-react/
├── index.html
├── package.json
├── vite.config.ts
├── public/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── types/index.ts
│   ├── lib/upscaler.ts      ← AI core (ESRGAN + sharpen + denoise)
│   └── components/
│       ├── Header.tsx
│       ├── DropZone.tsx
│       ├── SettingsPanel.tsx
│       ├── ImageCard.tsx
│       └── ComparisonSlider.tsx
└── README.md
```

---

## Tips Kualitas Maksimal

| Setting | Rekomendasi |
|---------|-------------|
| Model | **Thick** |
| Scale | **2×** (paling stabil) |
| Patch | **128** |
| Mode | Sharpen Max untuk ketajaman ekstra |

- Foto sangat besar (>2000px): resize dulu atau pakai Slim + patch 64.
- Batch: diproses 1-per-1 agar tidak crash RAM.
- Model di-download sekali lalu di-cache browser.

---

## Fitur yang Ada vs Batasan

**Ada (gratis client-side):**
- Upscale AI, sharpen, denoise ringan, batch, slider, multi download

**Belum (butuh model/server lebih berat):**
- Watermark remover AI generatif (butuh inpainting model besar)
- Face restore GFPGAN (lebih cocok desktop seperti Upscayl/NextGenUp)
- Video upscale real-time

Kalau butuh watermark remove / face restore level pro offline, self-host **NextGenUp** atau **Upscayl** di PC.

---

## Lisensi

Kode app bebas dipakai.  
UpscalerJS / ESRGAN / TF.js mengikuti lisensi open-source masing-masing.

---

**Selamat deploy!** Kalau error build, kirim log-nya.
