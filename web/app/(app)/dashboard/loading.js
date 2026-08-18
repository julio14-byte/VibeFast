export default function DashboardLoading() {
  return (
    <div className="dashboard-pos space-y-6 animate-pulse">
      <div className="rounded-2xl border border-base-300/60 bg-base-200 px-5 py-8 sm:px-8">
        <div className="h-3 w-24 rounded bg-base-300" />
        <div className="mt-3 h-8 w-64 max-w-full rounded bg-base-300" />
        <div className="mt-3 h-4 w-full max-w-xl rounded bg-base-300/70" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-xl border border-base-200 bg-base-100"
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-56 rounded-xl border border-base-200 bg-base-100" />
        <div className="h-56 rounded-xl border border-base-200 bg-base-100" />
      </div>

      <div className="h-64 rounded-xl border border-base-200 bg-base-100" />
    </div>
  )
}
