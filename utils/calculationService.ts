import { Dimension, SimulationResult, DistributionType } from '../types';

// Helper for Box-Muller transform to generate Normal distribution
const randomNormal = (mean: number, stdDev: number): number => {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + z * stdDev;
};

// Generate value based on distribution type
const sampleValue = (dim: Dimension): number => {
  const range = dim.tolPlus + dim.tolMinus;
  const mean = dim.nominal + (dim.tolPlus - dim.tolMinus) / 2;
  
  switch (dim.distribution) {
    case DistributionType.Normal:
      // Assuming tolerances represent +/- 3 sigma (Process Capability)
      // If Cpk is provided, we adjust sigma: Sigma = Tolerance / (3 * Cpk)
      const sigma = (range / 2) / (3 * (dim.cpk || 1.33)); 
      return randomNormal(mean, sigma);
    
    case DistributionType.Uniform:
      return (dim.nominal - dim.tolMinus) + Math.random() * range;
    
    case DistributionType.Trapezoidal:
       // Simplified trapezoid: sum of two uniforms
       const r1 = Math.random();
       const r2 = Math.random();
       return (dim.nominal - dim.tolMinus) + (r1 + r2) * (range / 2);

    case DistributionType.Bernoulli:
       // Extreme values only
       return Math.random() > 0.5 ? (dim.nominal + dim.tolPlus) : (dim.nominal - dim.tolMinus);

    default:
      return mean;
  }
};

export const calculateStackup = (
  dimensions: Dimension[], 
  upperLimit: number | null, 
  lowerLimit: number | null
): SimulationResult => {
  
  // 1. Worst Case Calculation
  let wcMax = 0;
  let wcMin = 0;
  let nominalSum = 0;

  dimensions.forEach(d => {
    const termNominal = d.nominal * d.sign;
    nominalSum += termNominal;

    // To maximize gap: Add Max of positive contributors, Subtract Min of negative contributors
    // To minimize gap: Add Min of positive contributors, Subtract Max of negative contributors
    
    if (d.sign === 1) {
      wcMax += (d.nominal + d.tolPlus);
      wcMin += (d.nominal - d.tolMinus);
    } else {
      wcMax -= (d.nominal - d.tolMinus);
      wcMin -= (d.nominal + d.tolPlus);
    }
  });

  // 2. RSS Calculation (Root Sum Square)
  // sigma_asm^2 = sum(sigma_i^2)
  let sumSigmaSq = 0;
  
  dimensions.forEach(d => {
    // Estimate sigma. Assuming tolerances are 3 sigma.
    // Average tolerance if asymmetric
    const avgTol = (d.tolPlus + d.tolMinus) / 2;
    // Adjust for Cpk. If Cpk is high, sigma is lower.
    const sigma = avgTol / (3 * (d.cpk || 1.0));
    sumSigmaSq += (sigma * sigma);
  });

  const sigmaAssm = Math.sqrt(sumSigmaSq);
  const rssMax = nominalSum + 3 * sigmaAssm;
  const rssMin = nominalSum - 3 * sigmaAssm;

  // 3. Monte Carlo Simulation
  const ITERATIONS = 10000;
  const samples: number[] = [];
  let passCount = 0;

  for (let i = 0; i < ITERATIONS; i++) {
    let stackVal = 0;
    dimensions.forEach(d => {
      stackVal += sampleValue(d) * d.sign;
    });
    samples.push(stackVal);

    let pass = true;
    if (upperLimit !== null && stackVal > upperLimit) pass = false;
    if (lowerLimit !== null && stackVal < lowerLimit) pass = false;
    if (pass) passCount++;
  }

  // Calculate MC Stats
  const sum = samples.reduce((a, b) => a + b, 0);
  const mcMean = sum / ITERATIONS;
  const sqDiffs = samples.map(v => (v - mcMean) * (v - mcMean));
  const mcStdDev = Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / ITERATIONS);
  
  // Sort for min/max (percentiles could be better but raw min/max for now)
  samples.sort((a, b) => a - b);

  // Generate Histogram Data
  const binCount = 40;
  const range = samples[samples.length - 1] - samples[0];
  const binSize = range / binCount;
  const histogram: { bin: number; count: number }[] = [];
  
  for (let i = 0; i < binCount; i++) {
    const binStart = samples[0] + i * binSize;
    const binEnd = binStart + binSize;
    const count = samples.filter(s => s >= binStart && s < binEnd).length;
    histogram.push({ bin: binStart + binSize / 2, count });
  }

  // Contribution Analysis (Percent of variance)
  const totalVariance = sumSigmaSq; // Reuse RSS calculation for theoretical contribution
  const contributions = dimensions.map(d => {
    const avgTol = (d.tolPlus + d.tolMinus) / 2;
    const sigma = avgTol / (3 * (d.cpk || 1.0));
    const variance = sigma * sigma;
    return {
      name: d.name,
      percent: totalVariance > 0 ? (variance / totalVariance) * 100 : 0
    };
  }).sort((a, b) => b.percent - a.percent);

  return {
    worstCase: { min: wcMin, max: wcMax, nominal: nominalSum },
    rss: { min: rssMin, max: rssMax, nominal: nominalSum, sigma: sigmaAssm },
    monteCarlo: {
      min: samples[0],
      max: samples[samples.length - 1],
      mean: mcMean,
      stdDev: mcStdDev,
      samples,
      histogram,
      yield: (passCount / ITERATIONS) * 100
    },
    contributions
  };
};
