export type QualityModel = 'slim' | 'medium' | 'thick'
export type ScaleOption = 2 | 4
export type ProcessMode = 'upscale' | 'sharpen' | 'denoise'

export interface ImageItem {
  id: string
  file: File
  name: string
  originalSrc: string
  width: number
  height: number
  sizeKB: number
  resultSrc?: string
  resultWidth?: number
  resultHeight?: number
  status: 'idle' | 'processing' | 'done' | 'error'
  progress: number
  error?: string
  elapsedSec?: number
}

export interface ProcessSettings {
  mode: ProcessMode
  scale: ScaleOption
  quality: QualityModel
  patchSize: number
}
