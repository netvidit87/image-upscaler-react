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

export async function ensureTf() {
  if (tfReady) return
  await tf.ready()
  // Prefer WebGL for speed
  try {
    await tf.setBackend('webgl')
    await tf.ready()
  } catch {
    // fallback default
  }
  tfReady = true
  console.log('[AI] TF backend:', tf.getBackend())
}

function getModel(quality: QualityModel, scale: ScaleOption) {
  if (quality === 'thick') return scale === 4 ? x4Thick : x2Thick
  if (quality === 'medium') return scale === 4 ? x4Medium : x2Medium
  return scale === 4 ? x4Slim : x2Slim
}

/**
 * Canvas-based unsharp mask (sharpen) – free extra post-process
 */
export function sharpenCanvas(src: string, amount = 0.6, radius = 1): Promise<string> {
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

      // Simple high-pass via blur + blend
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

/**
 * Light denoise via canvas (bilateral-ish approximation) – no extra model needed
 */
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
      // slight blur then blend with original for denoise look
      ctx.filter = 'blur(0.6px)'
      ctx.drawImage(img, 0, 0)
      ctx.filter = 'none'
      ctx.globalAlpha = 0.45
      ctx.drawImage(img, 0, 0)
      ctx.globalAlpha = 1
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = reject
    img.src = src
  })
}

export interface UpscaleOptions {
  src: string
  quality: QualityModel
  scale: ScaleOption
  patchSize: number
  mode: ProcessMode
  onProgress?: (p: number) => void
  signal?: AbortSignal
}

export async function processImage(opts: UpscaleOptions): Promise<string> {
  await ensureTf()

  let workingSrc = opts.src

  // Pre-denoise if mode is denoise or as optional first step
  if (opts.mode === 'denoise') {
    opts.onProgress?.(0.05)
    workingSrc = await lightDenoise(workingSrc)
  }

  const model = getModel(opts.quality, opts.scale)
  const upscaler = new Upscaler({ model })

  try {
    if (opts.signal?.aborted) throw new Error('Dibatalkan')

    // Warmup helps first run
    try {
      await upscaler.warmup([{ patchSize: Math.min(opts.patchSize, 64), padding: 4 }])
    } catch {
      // ignore warmup failures
    }

    opts.onProgress?.(0.1)

    let result = await upscaler.upscale(workingSrc, {
      output: 'base64',
      patchSize: opts.patchSize,
      padding: 6,
      progress: (percent) => {
        // map 0-1 to 0.1-0.9
        opts.onProgress?.(0.1 + percent * 0.8)
      },
    })

    // Post sharpen for "sharpen" mode or always light sharpen for upscale
    if (opts.mode === 'sharpen' || opts.mode === 'upscale') {
      opts.onProgress?.(0.92)
      const amount = opts.mode === 'sharpen' ? 0.85 : 0.35
      result = await sharpenCanvas(result, amount, 1)
    }

    opts.onProgress?.(1)
    return result
  } finally {
    try {
      await upscaler.dispose()
    } catch {
      // ignore
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
