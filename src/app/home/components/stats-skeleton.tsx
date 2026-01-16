import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StatsCardSkeleton() {
  return (
    <Card className="bg-[#1a1a35] border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-gray-400 text-sm font-medium">
          <div className="h-4 w-32 bg-gray-700 animate-pulse rounded"></div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-9 w-16 bg-gray-700 animate-pulse rounded"></div>
      </CardContent>
    </Card>
  );
}

export function StatsCardsSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatsCardSkeleton />
      <StatsCardSkeleton />
      <StatsCardSkeleton />
    </div>
  );
}
