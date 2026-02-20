// Shown immediately on navigation to a server detail page while the
// component loads — mirrors the in-component skeleton shape exactly.
export default function ServerLoading() {
  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 pb-10 animate-pulse">

      {/* header card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-18 rounded-xl bg-white/8 shrink-0" />
          <div className="flex flex-col gap-2.5">
            <div className="h-7 w-48 bg-white/8 rounded-xl" />
            <div className="h-4 w-32 bg-white/5 rounded-lg" />
          </div>
        </div>
        <div className="h-8 w-20 bg-white/5 rounded-lg shrink-0" />
      </div>

      {/* tab bar */}
      <div className="h-12 bg-white/5 border border-white/10 rounded-xl" />

      {/* stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-2xl h-28" />
        ))}
      </div>

      {/* address bar */}
      <div className="bg-white/5 border border-white/10 rounded-2xl h-16" />

      {/* power buttons */}
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-xl h-14" />
        ))}
      </div>

      {/* console */}
      <div className="bg-white/5 border border-white/10 rounded-xl h-64" />

    </div>
  )
}
