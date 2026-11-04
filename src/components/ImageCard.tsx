import { Download, Loader2, CheckCircle2, XCircle, Trash2 } from 'lucide-react'
import type { ImageItem } from '../types'
import { downloadDataUrl, dataUrlToJpg } from '../lib/upscaler'

interface Props {
  item: ImageItem
  onRemove: (id: string) => void
  onSelect: (id: string) => void
  selected?: boolean
}

export function ImageCard({ item, onRemove, onSelect, selected }: Props) {
  return (
    <div
      className={`rounded-xl border bg-dark-900 overflow-hidden transition cursor-pointer ${
        selected ? 'border-sky-500 ring-1 ring-sky-500/40' : 'border-slate-800 hover:border-slate-700'
      }`}
      onClick={() => onSelect(item.id)}
    >
      <div className="relative aspect-video bg-dark-950 flex items-center justify-center overflow-hidden">
        <img
          src={item.resultSrc || item.originalSrc}
          alt={item.name}
          className="max-w-full max-h-full object-contain"
        />
        {item.status === 'processing' && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
            <span className="text-sm font-medium text-sky-300">{Math.round(item.progress * 100)}%</span>
          </div>
        )}
        {item.status === 'done' && (
          <div className="absolute top-2 right-2 bg-emerald-500/90 text-white rounded-full p-1">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        )}
        {item.status === 'error' && (
          <div className="absolute top-2 right-2 bg-red-500/90 text-white rounded-full p-1">
            <XCircle className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{item.name}</p>
            <p className="text-xs text-slate-500">
              {item.width}×{item.height}
              {item.resultWidth ? ` → ${item.resultWidth}×${item.resultHeight}` : ''}
              {item.elapsedSec != null ? ` · ${item.elapsedSec}s` : ''}
            </p>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10"
            onClick={(e) => {
              e.stopPropagation()
              onRemove(item.id)
            }}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        {item.status === 'error' && (
          <p className="text-xs text-red-400">{item.error}</p>
        )}
        {item.status === 'done' && item.resultSrc && (
          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 text-xs py-2 rounded-lg btn-primary text-white font-medium flex items-center justify-center gap-1"
              onClick={async (e) => {
                e.stopPropagation()
                downloadDataUrl(item.resultSrc!, `upscaled-${item.name.replace(/\.\w+$/, '')}.png`)
              }}
            >
              <Download className="w-3.5 h-3.5" /> PNG
            </button>
            <button
              type="button"
              className="flex-1 text-xs py-2 rounded-lg border border-slate-700 bg-dark-800 text-slate-300 font-medium"
              onClick={async (e) => {
                e.stopPropagation()
                const jpg = await dataUrlToJpg(item.resultSrc!)
                downloadDataUrl(jpg, `upscaled-${item.name.replace(/\.\w+$/, '')}.jpg`)
              }}
            >
              JPG
            </button>
          </div>
        )}
        {item.status === 'processing' && (
          <div className="w-full h-1.5 bg-dark-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-blue-400 transition-all"
              style={{ width: `${item.progress * 100}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
