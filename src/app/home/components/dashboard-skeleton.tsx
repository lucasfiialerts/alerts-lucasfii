export function DashboardSkeleton() {
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

        {/* Dashboard Content Skeleton - Add padding for mobile nav */}
        <main className="p-4 md:p-6 space-y-6 pb-20 md:pb-6">
          {/* Greeting Skeleton */}
          <div className="space-y-4">
            <div className="w-48 h-9 bg-gray-700 rounded animate-pulse"></div>
            <div className="w-full h-16 bg-gray-800/50 rounded-lg animate-pulse"></div>
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((card) => (
              <div
                key={card}
                className="bg-[#1a1a35] border border-gray-800 rounded-lg p-6"
              >
                <div className="space-y-3">
                  <div className="w-32 h-4 bg-gray-700 rounded animate-pulse"></div>
                  <div className="w-16 h-8 bg-gray-700 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Market Indices Skeleton */}
          <div className="bg-[#1a1a35] border border-gray-800 rounded-lg p-6">
            <div className="flex flex-row items-center justify-between mb-6">
              <div className="w-40 h-6 bg-gray-700 rounded animate-pulse"></div>
              <div className="flex space-x-2">
                {[1, 2, 3].map((btn) => (
                  <div
                    key={btn}
                    className="w-16 h-8 bg-gray-700 rounded animate-pulse"
                  ></div>
                ))}
              </div>
            </div>
            <div className="h-64 bg-[#0f0f23] rounded-lg p-4">
              <div className="w-48 h-4 bg-gray-700 rounded animate-pulse mb-4"></div>
              <div className="w-full h-48 bg-gray-800 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Bottom Section Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dividendos Skeleton */}
            <div className="bg-[#1a1a35] border border-gray-800 rounded-lg p-6">
              <div className="flex flex-row items-center justify-between mb-6">
                <div className="w-24 h-6 bg-gray-700 rounded animate-pulse"></div>
                <div className="flex space-x-2">
                  <div className="w-20 h-8 bg-gray-700 rounded animate-pulse"></div>
                  <div className="w-12 h-8 bg-gray-700 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="bg-[#0f0f23] p-4 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div className="space-y-2">
                    <div className="w-16 h-5 bg-gray-700 rounded animate-pulse"></div>
                    <div className="w-20 h-4 bg-gray-700 rounded animate-pulse"></div>
                  </div>
                  <div className="w-12 h-5 bg-gray-700 rounded animate-pulse"></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="w-32 h-4 bg-gray-700 rounded animate-pulse"></div>
                  <div className="w-24 h-8 bg-gray-700 rounded animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Relatórios Skeleton */}
            <div className="bg-[#1a1a35] border border-gray-800 rounded-lg p-6">
              <div className="w-32 h-6 bg-gray-700 rounded animate-pulse mb-6"></div>
              <div className="flex items-center justify-center h-32">
                <div className="w-20 h-4 bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Alert Skeleton */}
          <div className="bg-gray-800/20 border border-gray-700 rounded-lg p-4">
            <div className="w-3/4 h-4 bg-gray-700 rounded animate-pulse"></div>
          </div>
        </main>
      </div>

      {/* Bottom Navigation Skeleton - Mobile only */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1a1a35] border-t border-gray-800 lg:hidden z-50">
        <div className="grid grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="flex flex-col items-center justify-center py-2 px-3">
              <div className="w-6 h-6 bg-gray-700 rounded animate-pulse mb-1"></div>
              <div className="w-12 h-3 bg-gray-700 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
