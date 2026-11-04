import { useCallback, useEffect, useState } from 'react'
import { Sparkles, Play, Eraser, Download } from 'lucide-react'
import { Header } from './components/Header'
import { DropZone } from './components/DropZone'
import { SettingsPanel } from './components/SettingsPanel'
import { ImageCard } from './components/ImageCard'
import { ComparisonSlider } from './components/ComparisonSlider'
import { loadImageFile, processImage, downloadDataUrl } from './lib/upscaler'
import type { ImageItem, ProcessSettings } from './types'

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

export default function App() {
  const [items, setItems] = useState<ImageItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [settings, setSettings] = useState<ProcessSettings>({
    mode: 'upscale',
    scale: 2,
    quality: 'thick',
    patchSize: 96,
  })

  const selected = items.find((i) => i.id === selectedId) || items[0] || null

  const addFiles = useCallback(async (files: File[]) => {
    const next: ImageItem[] = []
    for (const file of files) {
      if (file.size > 30 * 1024 * 1024) {
        alert(`${file.name} terlalu besar (>30MB). Lewati.`)
        continue
      }
      try {
        const { src, width, height } = await loadImageFile(file)
        next.push({
          id: uid(),
          file,
          name: file.name,
          originalSrc: src,
          width,
          height,
          sizeKB: Math.round(file.size / 1024),
          status: 'idle',
          progress: 0,
        })
      } catch {
        alert(`Gagal memuat ${file.name}`)
      }
    }
    if (!next.length) return
    setItems((prev) => [...prev, ...next])
    setSelectedId((id) => id || next[0].id)
  }, [])

  // Paste support
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      const files: File[] = []
      for (const it of items) {
        if (it.type.startsWith('image/')) {
          const f = it.getAsFile()
          if (f) files.push(f)
        }
      }
      if (files.length) addFiles(files)
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [addFiles])

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
    setSelectedId((cur) => (cur === id ? null : cur))
  }

  const clearAll = () => {
    if (busy) return
    setItems([])
    setSelectedId(null)
  }

  const updateItem = (id: string, patch: Partial<ImageItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)))
  }

  const processOne = async (item: ImageItem) => {
    updateItem(item.id, { status: 'processing', progress: 0, error: undefined })
    const start = performance.now()
    try {
      const resultSrc = await processImage({
        src: item.originalSrc,
        quality: settings.quality,
        scale: settings.scale,
        patchSize: settings.patchSize,
        mode: settings.mode,
        onProgress: (p) => updateItem(item.id, { progress: p }),
      })
      // measure result size
      const dims = await new Promise<{ w: number; h: number }>((res) => {
        const img = new Image()
        img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight })
        img.src = resultSrc
      })
      updateItem(item.id, {
        status: 'done',
        progress: 1,
        resultSrc,
        resultWidth: dims.w,
        resultHeight: dims.h,
        elapsedSec: Number(((performance.now() - start) / 1000).toFixed(1)),
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memproses'
      updateItem(item.id, { status: 'error', error: msg, progress: 0 })
    }
  }

  const processAll = async () => {
    if (busy || !items.length) return
    setBusy(true)
    const queue = items.filter((i) => i.status === 'idle' || i.status === 'error' || !i.resultSrc)
    // Sequential to avoid OOM on browser
    for (const item of queue) {
      await processOne(item)
    }
    // Also reprocess if user wants all – for simplicity only pending
    setBusy(false)
  }

  const processSelected = async () => {
    if (!selected || busy) return
    setBusy(true)
    await processOne(selected)
    setBusy(false)
  }

  const downloadAllZipHint = () => {
    // Without jszip dep: download each PNG sequentially
    const done = items.filter((i) => i.resultSrc)
    if (!done.length) return
    done.forEach((i, idx) => {
      setTimeout(() => {
        downloadDataUrl(i.resultSrc!, `upscaled-${i.name.replace(/\.\w+$/, '')}.png`)
      }, idx * 400)
    })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 space-y-8">
        {/* Hero */}
        <section className="text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 bg-gradient-to-r from-white via-sky-100 to-sky-300 bg-clip-text text-transparent">
            Buat Gambar Lebih Tajam & Berkualitas Tinggi
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
            Upscale AI · Sharpen · Denoise · <strong className="text-slate-200">Batch processing</strong>.
            Semua berjalan di browser — gambar tidak pernah di-upload.
          </p>
        </section>

        {/* Upload */}
        {!items.length && <DropZone onFiles={addFiles} disabled={busy} />}

        {items.length > 0 && (
          <>
            {/* Settings + actions */}
            <SettingsPanel settings={settings} onChange={setSettings} disabled={busy} />

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={processSelected}
                className="btn-primary flex-1 py-3.5 rounded-xl font-semibold text-white text-sm shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Proses Gambar Terpilih
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={processAll}
                className="flex-1 py-3.5 rounded-xl font-semibold text-sm border border-sky-500/50 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Proses Semua (Batch)
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => document.getElementById('file-input-multi')?.click()}
                className="py-3.5 px-5 rounded-xl border border-slate-700 bg-dark-800 text-slate-300 text-sm font-medium"
              >
                + Tambah
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={clearAll}
                className="py-3.5 px-5 rounded-xl border border-slate-700 bg-dark-800 text-slate-400 text-sm font-medium flex items-center gap-1"
              >
                <Eraser className="w-4 h-4" /> Clear
              </button>
            </div>

            {/* Hidden multi input for add more */}
            <input
              id="file-input-multi"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addFiles(Array.from(e.target.files))}
            />

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <ImageCard
                  key={item.id}
                  item={item}
                  selected={selected?.id === item.id}
                  onSelect={setSelectedId}
                  onRemove={removeItem}
                />
              ))}
            </div>

            {/* Download all */}
            {items.some((i) => i.resultSrc) && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={downloadAllZipHint}
                  className="inline-flex items-center gap-2 py-3 px-6 rounded-xl border border-slate-700 bg-dark-800 text-slate-200 text-sm font-medium hover:border-sky-500/50"
                >
                  <Download className="w-4 h-4" /> Download Semua Hasil (PNG)
                </button>
              </div>
            )}

            {/* Detail selected */}
            {selected && (
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-300">
                  Detail: {selected.name}
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-dark-900 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-800 text-sm font-medium text-slate-400">
                      Asli · {selected.width}×{selected.height}
                    </div>
                    <div className="p-4 flex justify-center bg-dark-950/50 min-h-[200px]">
                      <img src={selected.originalSrc} alt="asli" className="max-h-[360px] rounded-lg" />
                    </div>
                  </div>
                  <div className="bg-dark-900 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-800 text-sm font-medium text-sky-300">
                      Hasil AI
                      {selected.resultWidth
                        ? ` · ${selected.resultWidth}×${selected.resultHeight}`
                        : ''}
                    </div>
                    <div className="p-4 flex justify-center bg-dark-950/50 min-h-[200px]">
                      {selected.resultSrc ? (
                        <img src={selected.resultSrc} alt="hasil" className="max-h-[360px] rounded-lg" />
                      ) : (
                        <p className="text-slate-600 text-sm self-center">Belum diproses</p>
                      )}
                    </div>
                  </div>
                </div>
                {selected.resultSrc && (
                  <ComparisonSlider original={selected.originalSrc} result={selected.resultSrc} />
                )}
              </section>
            )}
          </>
        )}

        {/* Tips */}
        <section className="bg-dark-900/60 border border-slate-800 rounded-2xl p-6">
          <h3 className="font-semibold text-slate-200 mb-3">💡 Tips Hasil Maksimal</h3>
          <ul className="text-sm text-slate-400 space-y-2 list-disc list-inside">
            <li>
              Model <strong className="text-sky-300">Thick</strong> + Patch <strong className="text-sky-300">128</strong> + scale 2× = paling tajam.
            </li>
            <li>
              Mode <strong className="text-sky-300">Sharpen Max</strong> menambah unsharp mask setelah AI upscale.
            </li>
            <li>
              Mode <strong className="text-sky-300">Denoise + Upscale</strong> cocok untuk foto noisy / JPEG buruk.
            </li>
            <li>Batch diproses berurutan agar browser tidak kehabisan RAM.</li>
            <li>Model di-cache browser setelah unduhan pertama — berikutnya lebih cepat / offline-capable.</li>
          </ul>
        </section>

        <footer className="text-center text-xs text-slate-600 pb-8">
          <p>
            React + Vite + UpscalerJS + TensorFlow.js · ESRGAN · 100% Client-Side · MIT-friendly stack
          </p>
          <p className="mt-1">Gratis · Tanpa watermark · Tanpa akun · Tanpa server AI</p>
        </footer>
      </main>
    </div>
  )
}
