export function MyFollowSkeleton() {
  return (
    <div className="min-h-screen bg-[#0f0f23] text-white flex">
      {/* Sidebar Skeleton - Hidden on mobile */}
  <div className="hidden lg:block w-64 bg-[#1a1a35] border-r border-gray-800">
        {/* Logo Skeleton */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-700 rounded-lg animate-pulse"></div>
            <div className="w-20 h-6 bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Menu Items Skeleton */}
        <nav className="p-4 space-y-2">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg"
            >
              <div className="w-5 h-5 bg-gray-700 rounded animate-pulse"></div>
              <div className="w-24 h-4 bg-gray-700 rounded animate-pulse"></div>
            </div>
          ))}
        </nav>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1">
        {/* Header Skeleton */}
        <header className="bg-[#1a1a35] border-b border-gray-800 px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="w-16 md:w-20 h-6 md:h-8 bg-gray-700 rounded animate-pulse"></div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-700 rounded animate-pulse"></div>
              <div className="w-8 h-8 bg-gray-700 rounded-full animate-pulse"></div>
            </div>
          </div>
        </header>

        {/* Page Content Skeleton */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 pb-24 md:pb-6 bg-[#0d1117] min-h-screen overflow-hidden">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
            {/* Page Header Skeleton */}
            <div className="mb-6 sm:mb-8">
              <div className="w-64 h-8 bg-gray-700 rounded animate-pulse mb-2"></div>
              <div className="w-96 h-5 bg-gray-700 rounded animate-pulse"></div>
            </div>

            {/* Action Buttons Skeleton */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="w-full sm:w-32 h-10 bg-gray-700 rounded animate-pulse"></div>
              <div className="w-full sm:w-40 h-10 bg-gray-700 rounded animate-pulse"></div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {[1, 2, 3].map((item) => (
                <div key={item} className="bg-[#1a1a35] border border-gray-700/50 shadow-xl rounded-lg p-3 sm:p-4">
                  <div className="flex items-center justify-between space-y-0 pb-2">
                    <div className="w-20 h-4 bg-gray-700 rounded animate-pulse"></div>
                    <div className="w-6 h-6 bg-gray-700 rounded animate-pulse"></div>
                  </div>
                  <div className="pt-2">
                    <div className="w-8 h-8 bg-gray-700 rounded animate-pulse mb-1"></div>
                    <div className="w-16 h-3 bg-gray-700 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Content Area Skeleton */}
            <div className="bg-[#1a1a35] border border-gray-700/50 shadow-xl rounded-lg">
              <div className="p-4 sm:p-6">
                {/* Empty State Skeleton */}
                <div className="text-center py-8 sm:py-12">
                  <div className="w-16 h-16 bg-gray-700 rounded-full mx-auto mb-4 animate-pulse"></div>
                  <div className="w-64 h-6 bg-gray-700 rounded mx-auto mb-2 animate-pulse"></div>
                  <div className="w-80 h-4 bg-gray-700 rounded mx-auto mb-6 animate-pulse"></div>
                  <div className="w-48 h-10 bg-gray-700 rounded mx-auto animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Skeleton */}
  <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#1a1a35] border-t border-gray-800 px-4 py-2">
        <div className="flex justify-around">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="flex flex-col items-center space-y-1">
              <div className="w-6 h-6 bg-gray-700 rounded animate-pulse"></div>
              <div className="w-8 h-3 bg-gray-700 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}