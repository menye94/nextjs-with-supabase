export default function MotorVehiclesLoading() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
      </div>
      <div className="space-y-4">
        {/* Tabs skeleton */}
        <div className="flex space-x-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 w-24 bg-muted animate-pulse rounded" />
          ))}
        </div>
        
        {/* Content skeleton */}
        <div className="space-y-6">
          {/* Stats cards skeleton */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
          
          {/* Additional content skeleton */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-48 bg-muted animate-pulse rounded-lg" />
            <div className="h-48 bg-muted animate-pulse rounded-lg" />
          </div>
          
          <div className="h-96 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    </div>
  );
}
