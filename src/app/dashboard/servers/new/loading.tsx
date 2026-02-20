export default function NewServerLoading() {
  return (
    <div className="flex flex-col gap-8 animate-pulse">

      {/* Header */}
      <div className="flex flex-col gap-1.5">
        <div className="h-8 w-44 bg-white/8 rounded-xl" />
        <div className="h-4 w-64 bg-white/5 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">

        {/* Left column */}
        <div className="flex flex-col gap-6">

          {/* Server name */}
          <div className="flex flex-col gap-3">
            <div className="h-4 w-28 bg-white/8 rounded-lg" />
            <div className="h-11 w-full bg-white/5 border border-white/8 rounded-xl" />
          </div>

          {/* Version picker */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 bg-white/8 rounded-lg" />
              <div className="h-6 w-24 bg-white/5 rounded-lg" />
            </div>
            {/* Search bar */}
            <div className="h-9 w-full bg-white/5 border border-white/8 rounded-xl" />
            {/* Version grid */}
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="h-14 bg-white/5 border border-white/8 rounded-xl" />
              ))}
            </div>
          </div>

          {/* Plan cards */}
          <div className="flex flex-col gap-3">
            <div className="h-4 w-20 bg-white/8 rounded-lg" />
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map(i => (
                <div key={i} className="h-20 bg-white/5 border border-white/8 rounded-2xl" />
              ))}
            </div>
          </div>

          {/* Port */}
          <div className="flex flex-col gap-3">
            <div className="h-4 w-24 bg-white/8 rounded-lg" />
            <div className="h-11 w-48 bg-white/5 border border-white/8 rounded-xl" />
          </div>

        </div>

        {/* Right column — receipt */}
        <div className="flex flex-col gap-4 bg-white/4 border border-white/10 rounded-2xl p-5">
          <div className="h-5 w-28 bg-white/8 rounded-lg" />
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-3 w-20 bg-white/5 rounded-md" />
                <div className="h-3 w-16 bg-white/8 rounded-md" />
              </div>
            ))}
          </div>
          <div className="border-t border-white/8 pt-4 mt-1">
            <div className="flex items-center justify-between">
              <div className="h-4 w-16 bg-white/8 rounded-md" />
              <div className="h-6 w-20 bg-white/8 rounded-md" />
            </div>
          </div>
          <div className="h-11 w-full bg-white/8 rounded-xl mt-2" />
        </div>

      </div>
    </div>
  )
}
