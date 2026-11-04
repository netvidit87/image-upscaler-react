import { useEffect, useRef, useState } from 'react'

interface Props {
  original: string
  result: string
}

export function ComparisonSlider({ original, result }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState(50)
  const dragging = useRef(false)

  useEffect(() => {
    const move = (clientX: number) => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
      setPos((x / rect.width) * 100)
    }
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current) return
      e.preventDefault()
      const cx = 'touches' in e ? e.touches[0].clientX : e.clientX
      move(cx)
    }
    const stop = () => {
      dragging.current = false
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('mouseup', stop)
    window.addEventListener('touchend', stop)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('mouseup', stop)
      window.removeEventListener('touchend', stop)
    }
  }, [])

  return (
    <div className="bg-dark-900 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center">
        <span className="text-sm font-semibold text-slate-300">Perbandingan (geser)</span>
        <span className="text-xs text-slate-500">← Asli | Hasil →</span>
      </div>
      <div
        ref={containerRef}
        className="comparison-container relative w-full bg-black max-h-[520px]"
        onClick={(e) => {
          const rect = containerRef.current!.getBoundingClientRect()
          setPos(((e.clientX - rect.left) / rect.width) * 100)
        }}
      >
        <img src={result} alt="Hasil" className="w-full h-auto block max-h-[520px] object-contain mx-auto" />
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
          <img
            src={original}
            alt="Asli"
            className="absolute top-0 left-0 h-full object-cover"
            style={{ width: containerRef.current?.clientWidth || '100%' }}
          />
        </div>
        <div
          className="comparison-slider"
          style={{ left: `${pos}%` }}
          onMouseDown={() => {
            dragging.current = true
          }}
          onTouchStart={() => {
            dragging.current = true
          }}
        />
      </div>
    </div>
  )
}
