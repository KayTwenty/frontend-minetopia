// Loading skeleton for the servers list page (server component)
export default function ServersLoading() {
  return (
    <div className="flex flex-col gap-8 animate-pulse">

      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <div className="h-7 w-24 bg-white/8 rounded-xl" />
          <div className="h-3.5 w-16 bg-white/5 rounded-full" />
        </div>
        <div className="h-9 w-32 bg-white/8 rounded-full" />
      </div>

      {/* server rows */}
      <div className="flex flex-col gap-2">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className="border border-white/8 rounded-xl px-6 py-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-14 h-18 bg-white/8 rounded-xl shrink-0" />
              <div className="flex flex-col gap-2">
                <div className="h-4 w-40 bg-white/8 rounded-md" />
                <div className="h-3 w-52 bg-white/5 rounded-md" />
              </div>
            </div>
            <div className="h-5 w-16 bg-white/5 rounded-full" />
          </div>
        ))}
      </div>

    </div>
  )
}
