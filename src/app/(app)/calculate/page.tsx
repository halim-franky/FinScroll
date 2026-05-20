import { OpportunityCalculator } from "@/components/OpportunityCalculator";

export default function CalculatePage() {
  return (
    <div className="h-[calc(100dvh-5rem)] overflow-y-auto">
      <div className="px-4 pt-6 pb-4">
        <div className="mb-5">
          <h1 className="text-2xl font-black text-zinc-50 tracking-tight">
            Wealth Calculator
          </h1>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
            See what your scroll time is costing you in compound wealth.
          </p>
        </div>
        <OpportunityCalculator />
      </div>
    </div>
  );
}
