import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MyFollowStatsCardSkeleton() {
  return (
    <Card className="bg-[#1a1a35] border-gray-700/50 shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
        <CardTitle className="text-xs sm:text-sm font-medium text-gray-400 leading-tight">
          <div className="h-4 w-24 bg-gray-700 animate-pulse rounded"></div>
        </CardTitle>
        <div className="w-4 h-4 bg-gray-700 animate-pulse rounded"></div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-0">
        <div className="h-8 w-12 bg-gray-700 animate-pulse rounded mb-1"></div>
        <div className="h-3 w-16 bg-gray-700 animate-pulse rounded"></div>
      </CardContent>
    </Card>
  );
}

export function MyFollowStatsCardsSkeletonGrid() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
      <MyFollowStatsCardSkeleton />
      <MyFollowStatsCardSkeleton />
      <div className="col-span-2 lg:col-span-1">
        <MyFollowStatsCardSkeleton />
      </div>
    </div>
  );
}
