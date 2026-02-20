// Loading skeleton for the main dashboard page (server component)
export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-10 animate-pulse">

      {/* welcome */}
      <div className="flex items-end justify-between border-b border-white/8 pb-8">
        <div className="flex flex-col gap-2.5">
          <div className="h-3 w-20 bg-white/8 rounded-full" />
          <div className="h-9 w-60 bg-white/8 rounded-xl" />
          <div className="h-4 w-40 bg-white/5 rounded-lg" />
        </div>
        <div className="h-10 w-32 bg-white/8 rounded-xl shrink-0" />
      </div>

      {/* stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-36 border border-white/8 rounded-2xl" />
        ))}
      </div>

      {/* recent servers header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="h-3 w-32 bg-white/8 rounded-full" />
          <div className="h-3 w-14 bg-white/5 rounded-full" />
        </div>
        {/* server rows */}
        <div className="border border-white/8 rounded-2xl overflow-hidden divide-y divide-white/6">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <div className="w-14 h-18 bg-white/8 rounded-xl shrink-0" />
              <div className="flex flex-col gap-2 flex-1">
                <div className="h-4 w-36 bg-white/8 rounded-md" />
                <div className="h-3 w-24 bg-white/5 rounded-md" />
              </div>
              <div className="h-5 w-16 bg-white/5 rounded-full" />
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
