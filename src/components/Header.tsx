export function Header() {
  return (
    <header className="border-b border-slate-800/80 bg-dark-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-xl font-bold shadow-lg shadow-sky-500/20">
            ✦
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">AI Image Sharpener Pro</h1>
            <p className="text-xs text-slate-400">React · Vite · 100% Client-Side AI</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="hidden sm:inline px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            ● Privat
          </span>
          <span className="px-2 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
            No Upload
          </span>
        </div>
      </div>
    </header>
  )
}
