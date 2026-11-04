import type { ProcessSettings, ProcessMode, QualityModel, ScaleOption } from '../types'

interface Props {
  settings: ProcessSettings
  onChange: (s: ProcessSettings) => void
  disabled?: boolean
}

const modes: { id: ProcessMode; label: string; desc: string }[] = [
  { id: 'upscale', label: 'Upscale AI', desc: 'Perbesar + tajam' },
  { id: 'sharpen', label: 'Sharpen Max', desc: 'Upscale + unsharp kuat' },
  { id: 'denoise', label: 'Denoise + Upscale', desc: 'Kurangi noise dulu' },
]

export function SettingsPanel({ settings, onChange, disabled }: Props) {
  const set = <K extends keyof ProcessSettings>(key: K, value: ProcessSettings[K]) =>
    onChange({ ...settings, [key]: value })

  return (
    <div className="bg-dark-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-2">Mode Proses</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {modes.map((m) => (
            <button
              key={m.id}
              type="button"
              disabled={disabled}
              onClick={() => set('mode', m.id)}
              className={`text-left px-3 py-3 rounded-xl border text-sm transition ${
                settings.mode === m.id
                  ? 'border-sky-500 bg-sky-500/15 text-sky-200'
                  : 'border-slate-700 bg-dark-800 text-slate-300 hover:border-slate-600'
              }`}
            >
              <div className="font-semibold">{m.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{m.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">Skala</label>
          <div className="flex gap-2">
            {([2, 4] as ScaleOption[]).map((s) => (
              <button
                key={s}
                type="button"
                disabled={disabled}
                onClick={() => set('scale', s)}
                className={`flex-1 py-2.5 rounded-xl border font-semibold text-sm transition ${
                  settings.scale === s
                    ? 'border-sky-500 bg-sky-500/20 text-sky-300'
                    : 'border-slate-700 bg-dark-800 text-slate-300'
                }`}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">Model AI</label>
          <select
            disabled={disabled}
            value={settings.quality}
            onChange={(e) => set('quality', e.target.value as QualityModel)}
            className="w-full py-2.5 px-3 rounded-xl bg-dark-800 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="slim">Cepat (Slim) — disarankan</option>
            <option value="medium">Seimbang (Medium)</option>
            <option value="thick">Maksimal (Thick) — lambat</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">Patch Size</label>
          <select
            disabled={disabled}
            value={settings.patchSize}
            onChange={(e) => set('patchSize', Number(e.target.value))}
            className="w-full py-2.5 px-3 rounded-xl bg-dark-800 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value={32}>32 – Paling aman</option>
            <option value={64}>64 – Disarankan</option>
            <option value={96}>96 – Lebih bagus</option>
            <option value={128}>128 – Berat (bisa hang)</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-200/90 leading-relaxed">
        <strong>Penting:</strong> Foto besar (1080p+) + <strong>Thick + 4× + patch 128</strong> sering
        macet di browser (RAM penuh). Mulai dengan <strong>Slim + 2× + patch 64</strong>. Model Thick
        otomatis dibatasi patch & ukuran agar tidak freeze.
      </div>
    </div>
  )
}
