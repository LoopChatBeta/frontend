// backend/services/CostEstimator.ts

export interface CostBreakdownItem {
  code: string;
  description: string;
  cost: number;
}

export interface CostEstimateResult {
  total: number;
  breakdown: CostBreakdownItem[];
}

export class CostEstimator {
  async calculateEstimate(
    cptCodes: string[]
  ): Promise<CostEstimateResult> {
    console.log(
      `[CostEstimator] Calculating estimate for CPT codes: ${cptCodes.join(", ")}`
    );

    // Mock pricing for the hackathon demo.
    const breakdown: CostBreakdownItem[] = cptCodes.map((code) => {
      switch (code) {
        case "99203":
          return {
            code,
            description: "New patient office visit",
            cost: 30,
          };

        case "73560":
          return {
            code,
            description: "Knee X-ray",
            cost: 25,
          };

        default:
          return {
            code,
            description: "Medical service",
            cost: 0,
          };
      }
    });

    const total = breakdown.reduce(
      (sum, item) => sum + item.cost,
      0
    );

    return {
      total,
      breakdown,
    };
  }
}
