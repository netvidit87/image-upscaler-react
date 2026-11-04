import * as tf from '@tensorflow/tfjs'
import Upscaler from 'upscaler'
import x2Slim from '@upscalerjs/esrgan-slim/2x'
import x4Slim from '@upscalerjs/esrgan-slim/4x'
import x2Medium from '@upscalerjs/esrgan-medium/2x'
import x4Medium from '@upscalerjs/esrgan-medium/4x'
import x2Thick from '@upscalerjs/esrgan-thick/2x'
import x4Thick from '@upscalerjs/esrgan-thick/4x'
import type { QualityModel, ScaleOption, ProcessMode } from '../types'

let tfReady = false
let backendName = 'unknown'

export async function ensureTf() {
  if (tfReady) return backendName
  await tf.ready()
  try {
    await tf.setBackend('webgl')
    await tf.ready()
  } catch {
    // cpu fallback
  }
  // free unused tensors aggressively
  try {
    tf.env().set('WEBGL_DELETE_TEXTURE_THRESHOLD', 0)
  } catch {
    /* ignore */
  }
  tfReady = true
  backendName = tf.getBackend()
  console.log('[AI] TF backend:', backendName)
  return backendName
}

function getModel(quality: QualityModel, scale: ScaleOption) {
  if (quality === 'thick') return scale === 4 ? x4Thick : x2Thick
  if (quality === 'medium') return scale === 4 ? x4Medium : x2Medium
  return scale === 4 ? x4Slim : x2Slim
}

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Gagal memuat gambar'))
    img.src = src
  })
}

/** Resize so upscale output stays browser-friendly */
export async function fitImageForUpscale(
  src: string,
  scale: number,
  maxOutSide = 2048,
): Promise<{ src: string; width: number; height: number; resized: boolean }> {
  const img = await loadHtmlImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  const outW = w * scale
  const outH = h * scale
  const maxSide = Math.max(outW, outH)
  if (maxSide <= maxOutSide) {
    return { src, width: w, height: h, resized: false }
  }
  const factor = maxOutSide / maxSide
  const nw = Math.max(1, Math.round(w * factor))
  const nh = Math.max(1, Math.round(h * factor))
  const canvas = document.createElement('canvas')
  canvas.width = nw
  canvas.height = nh
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, nw, nh)
  return { src: canvas.toDataURL('image/png'), width: nw, height: nh, resized: true }
}

export function sharpenCanvas(src: string, amount = 0.55, radius = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const w = img.naturalWidth
      const h = img.naturalHeight
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)

      const blurred = document.createElement('canvas')
      blurred.width = w
      blurred.height = h
      const bctx = blurred.getContext('2d')!
      bctx.filter = `blur(${radius}px)`
      bctx.drawImage(img, 0, 0)

      const orig = ctx.getImageData(0, 0, w, h)
      const blur = bctx.getImageData(0, 0, w, h)
      const out = ctx.createImageData(w, h)

      for (let i = 0; i < orig.data.length; i += 4) {
        for (let c = 0; c < 3; c++) {
          const o = orig.data[i + c]
          const b = blur.data[i + c]
          out.data[i + c] = Math.min(255, Math.max(0, o + amount * (o - b)))
        }
        out.data[i + 3] = orig.data[i + 3]
      }
      ctx.putImageData(out, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = reject
    img.src = src
  })
}

export function lightDenoise(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const w = img.naturalWidth
      const h = img.naturalHeight
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.filter = 'blur(0.5px)'
      ctx.drawImage(img, 0, 0)
      ctx.filter = 'none'
      ctx.globalAlpha = 0.5
      ctx.drawImage(img, 0, 0)
      ctx.globalAlpha = 1
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = reject
    img.src = src
  })
}

function yieldToUI() {
  return new Promise<void>((r) => setTimeout(r, 30))
}

export interface UpscaleOptions {
  src: string
  quality: QualityModel
  scale: ScaleOption
  patchSize: number
  mode: ProcessMode
  onProgress?: (p: number, label?: string) => void
  signal?: AbortSignal
}

export async function processImage(opts: UpscaleOptions): Promise<string> {
  const onProgress = opts.onProgress || (() => {})

  onProgress(0.02, 'Menyiapkan TensorFlow…')
  await ensureTf()
  await yieldToUI()

  let workingSrc = opts.src

  // Fit image so Thick/4x does not freeze browser
  onProgress(0.04, 'Menyesuaikan ukuran gambar…')
  const maxOut = opts.quality === 'thick' ? 1600 : opts.quality === 'medium' ? 2048 : 2560
  const fitted = await fitImageForUpscale(workingSrc, opts.scale, maxOut)
  workingSrc = fitted.src
  if (fitted.resized) {
    console.log('[AI] input di-resize ke', fitted.width, 'x', fitted.height, 'agar aman di browser')
  }
  await yieldToUI()

  if (opts.mode === 'denoise') {
    onProgress(0.06, 'Denoise…')
    workingSrc = await lightDenoise(workingSrc)
    await yieldToUI()
  }

  // Safer patch size (thick + large patch = hang)
  let patch = opts.patchSize
  if (opts.quality === 'thick') patch = Math.min(patch, 64)
  if (opts.scale === 4) patch = Math.min(patch, 64)
  if (opts.quality === 'medium') patch = Math.min(patch, 96)
  patch = Math.max(32, patch)

  onProgress(0.08, `Memuat model AI (${opts.quality} ${opts.scale}×)…`)
  await yieldToUI()

  const model = getModel(opts.quality, opts.scale)
  const upscaler = new Upscaler({
    model,
    // avoid hanging on slow first inference
  })

  try {
    if (opts.signal?.aborted) throw new Error('Dibatalkan')

    // NO warmup — sering bikin hang di browser + model thick
    onProgress(0.1, 'Memproses patch…')
    await yieldToUI()

    // Pass HTMLImageElement (lebih stabil dari dataURL panjang)
    const inputImg = await loadHtmlImage(workingSrc)

    let lastP = 0.1
    let result: string
    try {
      result = (await upscaler.upscale(inputImg, {
        output: 'base64',
        patchSize: patch,
        padding: 4,
        progress: (percent: number) => {
          // percent usually 0..1
          const p = typeof percent === 'number' ? percent : 0
          const mapped = 0.1 + Math.min(1, Math.max(0, p)) * 0.8
          if (mapped - lastP >= 0.01 || mapped >= 0.89) {
            lastP = mapped
            onProgress(mapped, `AI upscale ${Math.round(p * 100)}%`)
          }
        },
      })) as string
    } catch (e1) {
      console.warn('[AI] upscale attempt 1 failed, retry smaller patch', e1)
      onProgress(0.12, 'Retry patch lebih kecil…')
      // free memory
      try {
        tf.disposeVariables?.()
      } catch {
        /* */
      }
      await yieldToUI()
      result = (await upscaler.upscale(inputImg, {
        output: 'base64',
        patchSize: 32,
        padding: 2,
        progress: (percent: number) => {
          const p = typeof percent === 'number' ? percent : 0
          onProgress(0.12 + Math.min(1, Math.max(0, p)) * 0.78, `Retry ${Math.round(p * 100)}%`)
        },
      })) as string
    }

    if (opts.mode === 'sharpen' || opts.mode === 'upscale' || opts.mode === 'denoise') {
      onProgress(0.92, 'Sharpen akhir…')
      const amount = opts.mode === 'sharpen' ? 0.8 : 0.4
      result = await sharpenCanvas(result, amount, 0.8)
    }

    onProgress(1, 'Selesai')
    return result
  } catch (err) {
    console.error('[AI] processImage error', err)
    const msg =
      err instanceof Error
        ? err.message
        : typeof err === 'string'
          ? err
          : 'Gagal memproses (mungkin RAM penuh — coba Slim + 2× + patch 64)'
    throw new Error(msg)
  } finally {
    try {
      await upscaler.dispose()
    } catch {
      /* ignore */
    }
    try {
      // help GC
      if (tf.memory) {
        console.log('[AI] tf memory', tf.memory())
      }
    } catch {
      /* */
    }
  }
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}

export function dataUrlToJpg(dataUrl: string, quality = 0.92): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = img.naturalWidth
      c.height = img.naturalHeight
      c.getContext('2d')!.drawImage(img, 0, 0)
      resolve(c.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

export function loadImageFile(file: File): Promise<{ src: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const src = reader.result as string
      const img = new Image()
      img.onload = () => resolve({ src, width: img.naturalWidth, height: img.naturalHeight })
      img.onerror = reject
      img.src = src
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
