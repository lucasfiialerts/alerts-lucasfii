export function StepByStepSkeleton() {
  return (
    <div className="min-h-screen bg-[#0f0f23] text-white flex">
      {/* Sidebar Skeleton - Hidden on mobile */}
  <div className="hidden lg:block w-64 bg-[#1a1a35] border-r border-gray-800">
        {/* Logo Skeleton */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-700 rounded-lg animate-pulse"></div>
            <div className="w-32 h-6 bg-gray-700 rounded animate-pulse"></div>
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
              <div className="w-28 h-4 bg-gray-700 rounded animate-pulse"></div>
            </div>
          ))}
        </nav>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1">
        {/* Header Skeleton - Mobile only */}
  <header className="lg:hidden bg-[#1a1a35] border-b border-gray-800 px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="w-32 h-8 bg-gray-700 rounded animate-pulse"></div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-700 rounded animate-pulse"></div>
              <div className="w-8 h-8 bg-gray-700 rounded-full animate-pulse"></div>
            </div>
          </div>
        </header>

        {/* Step-by-Step Content Skeleton */}
        <main className="p-4 md:p-6 space-y-6 pb-20 md:pb-6 bg-[#0f0f23] min-h-screen">
          {/* Hero Section Skeleton */}
          <div className="text-center mb-12">
            <div className="w-96 h-8 bg-gray-700 rounded animate-pulse mx-auto mb-4"></div>
            <div className="w-[32rem] h-4 bg-gray-700 rounded animate-pulse mx-auto"></div>
          </div>

          {/* Steps Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="bg-[#1a1a35] border border-gray-800 rounded-lg p-6">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-gray-700 rounded-lg animate-pulse"></div>
                  <div className="w-32 h-5 bg-gray-700 rounded animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="w-full h-3 bg-gray-700 rounded animate-pulse"></div>
                    <div className="w-3/4 h-3 bg-gray-700 rounded animate-pulse"></div>
                    <div className="w-1/2 h-3 bg-gray-700 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Intelligent Alerts Section Skeleton */}
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-64 h-7 bg-gray-700 rounded animate-pulse mx-auto mb-2"></div>
              <div className="w-80 h-4 bg-gray-700 rounded animate-pulse mx-auto"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((alert) => (
                <div key={alert} className="bg-[#1a1a35] border border-gray-800 rounded-lg p-6">
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-gray-700 rounded-lg animate-pulse"></div>
                    <div className="w-28 h-5 bg-gray-700 rounded animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="w-full h-3 bg-gray-700 rounded animate-pulse"></div>
                      <div className="w-5/6 h-3 bg-gray-700 rounded animate-pulse"></div>
                      <div className="w-2/3 h-3 bg-gray-700 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action Skeleton */}
          <div className="text-center">
            <div className="w-32 h-12 bg-gray-700 rounded-lg animate-pulse mx-auto"></div>
          </div>
        </main>

        {/* WhatsApp Status Skeleton */}
        <div className="fixed bottom-4 left-4 md:bottom-4 bottom-24">
          <div className="flex items-center space-x-2 bg-gray-700 px-3 py-2 rounded-full animate-pulse">
            <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
            <div className="w-32 h-4 bg-gray-600 rounded"></div>
          </div>
          <div className="w-40 h-3 bg-gray-700 rounded animate-pulse mt-1 ml-5"></div>
        </div>
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
