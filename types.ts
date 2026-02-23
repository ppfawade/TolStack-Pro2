export enum DistributionType {
  Normal = 'Normal',
  Uniform = 'Uniform',
  Bernoulli = 'Bernoulli',
  Trapezoidal = 'Trapezoidal',
}

export enum DimensionType {
  Linear = 'Linear',
  Hole = 'Hole',
  Shaft = 'Shaft',
  Radial = 'Radial'
}

export interface Dimension {
  id: string;
  name: string;
  nominal: number;
  tolPlus: number; // Positive value
  tolMinus: number; // Positive value representing the subtraction
  sign: 1 | -1; // 1 for addition (part of loop), -1 for subtraction (closing the loop/gap)
  distribution: DistributionType;
  cpk: number; // Process capability index (default 1.33 or 1.67)
  type: DimensionType;
  process?: string; // ID or Name of selected manufacturing process
}

export interface StackupConfig {
  id: string;
  name: string;
  description: string;
  targetGapNominal: number;
  upperSpecLimit: number | null;
  lowerSpecLimit: number | null;
  dimensions: Dimension[];
}

export interface SimulationResult {
  worstCase: {
    min: number;
    max: number;
    nominal: number;
  };
  rss: {
    min: number;
    max: number;
    nominal: number;
    sigma: number;
  };
  monteCarlo: {
    min: number;
    max: number;
    mean: number;
    stdDev: number;
    samples: number[];
    histogram: { bin: number; count: number }[];
    yield: number; // Percentage of parts passing spec
  };
  contributions: { name: string; percent: number }[];
}

export interface ProcessCapability {
  process: string;
  typicalTol: number; // +/- mm
  minCpk: number;
  costFactor: number; // 1 = low, 5 = high
}