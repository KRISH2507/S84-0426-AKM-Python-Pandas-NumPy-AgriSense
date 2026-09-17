export default function Loading() {
  return (
    <div className="flex flex-col gap-8 max-w-[1100px] w-full mx-auto animate-pulse py-2">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-2.5 border-b-[0.5px] border-[#D9CEB8] pb-6">
        <div className="h-4 w-28 bg-[#D9CEB8]/50 rounded-md" />
        <div className="h-8 w-64 bg-[#D9CEB8]/60 rounded-lg" />
        <div className="h-4 w-96 max-w-full bg-[#D9CEB8]/40 rounded-md" />
      </div>

      {/* Filter / Tabs Skeleton */}
      <div className="flex flex-wrap gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-8 w-20 bg-[#D9CEB8]/40 rounded-[24px]" />
        ))}
      </div>

      {/* Content Cards Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[380px] bg-[#FDFAF4] border-[0.5px] border-[#D9CEB8] rounded-[16px] p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div className="h-5 w-40 bg-[#D9CEB8]/50 rounded-md" />
            <div className="h-6 w-24 bg-[#D9CEB8]/40 rounded-full" />
          </div>
          <div className="h-[260px] w-full bg-[#F5F1EA] rounded-[10px]" />
        </div>

        <div className="h-[380px] bg-[#FDFAF4] border-[0.5px] border-[#D9CEB8] rounded-[16px] p-6 flex flex-col gap-4">
          <div className="h-5 w-32 bg-[#D9CEB8]/50 rounded-md" />
          <div className="flex-1 bg-[#F5F1EA] rounded-[10px]" />
        </div>
      </div>
    </div>
  );
}
