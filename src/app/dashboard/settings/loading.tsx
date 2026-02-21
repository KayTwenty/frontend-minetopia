export default function SettingsLoading() {
  return (
    <div className="flex flex-col gap-8 max-w-xl animate-pulse">
      <div className="flex flex-col gap-1.5">
        <div className="h-8 w-28 bg-white/8 rounded-xl" />
        <div className="h-4 w-56 bg-white/5 rounded-lg" />
      </div>

      {/* Profile card */}
      <div className="bg-white/4 border border-white/10 rounded-2xl p-6 flex flex-col gap-5">
        <div className="flex items-center gap-4 pb-5 border-b border-white/8">
          <div className="w-14 h-14 rounded-2xl bg-white/8 shrink-0" />
          <div className="flex flex-col gap-2">
            <div className="h-5 w-36 bg-white/8 rounded-lg" />
            <div className="h-3.5 w-48 bg-white/5 rounded-md" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="h-3 w-24 bg-white/5 rounded-md" />
          <div className="h-11 bg-white/5 border border-white/8 rounded-xl" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="h-3 w-16 bg-white/5 rounded-md" />
          <div className="h-11 bg-white/5 border border-white/8 rounded-xl" />
        </div>
      </div>

      {/* Security card */}
      <div className="bg-white/4 border border-white/10 rounded-2xl p-6 flex flex-col gap-5">
        <div className="h-4 w-20 bg-white/8 rounded-lg pb-5 border-b border-white/8" />
        <div className="h-11 bg-white/5 border border-white/8 rounded-xl" />
        <div className="h-11 bg-white/5 border border-white/8 rounded-xl" />
        <div className="h-10 w-36 bg-white/8 rounded-xl" />
      </div>

      {/* Danger zone */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 h-32" />
    </div>
  )
}
