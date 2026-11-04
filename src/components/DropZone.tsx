import { useCallback, useState } from 'react'
import { Upload, Images } from 'lucide-react'

interface Props {
  onFiles: (files: File[]) => void
  disabled?: boolean
}

export function DropZone({ onFiles, disabled }: Props) {
  const [drag, setDrag] = useState(false)

  const pick = useCallback(
    (list: FileList | File[] | null) => {
      if (!list || disabled) return
      const files = Array.from(list).filter((f) => f.type.startsWith('image/'))
      if (files.length) onFiles(files)
    },
    [onFiles, disabled],
  )

  return (
    <div
      className={`drop-zone relative border-2 border-dashed border-slate-700 rounded-2xl bg-dark-900/50 p-10 sm:p-14 text-center cursor-pointer hover:border-sky-500/50 transition-all ${
        drag ? 'dragover' : ''
      } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      onDragEnter={(e) => {
        e.preventDefault()
        setDrag(true)
      }}
      onDragOver={(e) => {
        e.preventDefault()
        setDrag(true)
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDrag(false)
        pick(e.dataTransfer.files)
      }}
      onClick={() => document.getElementById('file-input-multi')?.click()}
    >
      <input
        id="file-input-multi"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/bmp"
        multiple
        className="hidden"
        onChange={(e) => pick(e.target.files)}
      />
      <div className="pointer-events-none">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-sky-500/10 flex items-center justify-center">
          {drag ? <Images className="w-8 h-8 text-sky-400" /> : <Upload className="w-8 h-8 text-sky-400" />}
        </div>
        <p className="text-lg font-semibold text-slate-200 mb-2">
          Drag & Drop gambar di sini
        </p>
        <p className="text-sm text-slate-400 mb-2">atau klik untuk memilih · <strong className="text-sky-300">bisa banyak file (batch)</strong></p>
        <p className="text-xs text-slate-500">JPG · PNG · WebP · Paste (Ctrl+V) juga didukung</p>
      </div>
    </div>
  )
}
