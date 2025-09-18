import { LazyLoader } from "@/components/ui/lazy-loader";

export default function ProductsLoading() {
  return (
    <div className="min-h-screen bg-fade">
      {/* Navigation skeleton */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
      
      <main className="p-6">
        <div className="mx-auto max-w-7xl">
          {/* Page header skeleton */}
          <div className="mb-8">
            <div className="h-9 bg-gray-200 rounded w-32 animate-pulse mb-2"></div>
            <div className="h-5 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>

          {/* Tabs skeleton */}
          <div className="space-y-6">
            <div className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <nav className="-mb-px flex space-x-8">
                  {["Parks", "Entry Type", "Category", "Seasons", "Park Pricing", "Camping Type", "Camping Price"].map((tab) => (
                    <div key={tab} className="py-2 px-1 border-b-2 font-medium text-sm text-gray-400 border-transparent">
                      {tab}
                    </div>
                  ))}
                </nav>
              </div>
            </div>
            
            {/* Content skeleton */}
            <div className="bg-white rounded-lg shadow">
              <LazyLoader delay={0} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
