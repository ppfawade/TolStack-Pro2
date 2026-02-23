import React from 'react';
import { Dimension, SimulationResult } from '../types';

interface Props {
  dimensions: Dimension[];
  results: SimulationResult | null;
}

export const StackupPlot: React.FC<Props> = ({ dimensions, results }) => {
  if (dimensions.length === 0 || !results) return null;

  // Calculate cumulative nominals
  let currentPos = 0;
  const bars = dimensions.map((dim, index) => {
    const start = currentPos;
    const end = currentPos + (dim.nominal * dim.sign);
    currentPos = end;
    return {
      ...dim,
      index,
      start,
      end,
      value: dim.nominal * dim.sign,
      label: `#${index + 1} ${dim.name}`
    };
  });

  const finalNominal = currentPos;
  
  // Find min and max values to scale the plot
  let minVal = 0;
  let maxVal = 0;
  
  bars.forEach(bar => {
    minVal = Math.min(minVal, bar.start, bar.end);
    maxVal = Math.max(maxVal, bar.start, bar.end);
  });
  
  // Include tolerances in min/max
  minVal = Math.min(minVal, results.worstCase.min);
  maxVal = Math.max(maxVal, results.worstCase.max);
  
  // Add some padding
  const range = maxVal - minVal;
  const padding = range * 0.1 || 1;
  const plotMin = minVal - padding;
  const plotMax = maxVal + padding;
  const plotRange = plotMax - plotMin;

  const getPercentage = (val: number) => ((val - plotMin) / plotRange) * 100;

  return (
    <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 mb-6">
      <h3 className="text-sm font-bold text-slate-500 uppercase mb-6">Outputs: Stackup plot with worst case & root sum squared (RSS) tolerances</h3>
      
      <div className="relative w-full text-xs font-mono">
        {/* Zero line (or final nominal line) */}
        <div 
          className="absolute top-0 bottom-0 w-px bg-slate-400 z-0"
          style={{ left: `${getPercentage(finalNominal)}%` }}
        ></div>
        
        {/* Dimensions Bars */}
        <div className="space-y-4 relative z-10">
          {bars.map((bar) => {
            const left = Math.min(bar.start, bar.end);
            const width = Math.abs(bar.end - bar.start);
            const isPositive = bar.end > bar.start;
            
            return (
              <div key={bar.id} className="flex items-center group">
                <div className="w-48 text-right pr-4 text-indigo-900 text-sm truncate" title={bar.label}>
                  {bar.label}
                </div>
                <div className="flex-1 relative h-6">
                  <div 
                    className="absolute h-full bg-[#2e2b70] rounded-sm flex items-center px-2 text-white text-[10px] overflow-hidden whitespace-nowrap"
                    style={{ 
                      left: `${getPercentage(left)}%`, 
                      width: `${(width / plotRange) * 100}%`,
                      justifyContent: isPositive ? 'flex-end' : 'flex-start'
                    }}
                  >
                  </div>
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 text-[10px] text-slate-600"
                    style={{ 
                      left: isPositive ? `${getPercentage(bar.end) + 1}%` : 'auto',
                      right: !isPositive ? `${100 - getPercentage(bar.end) + 1}%` : 'auto'
                    }}
                  >
                    {bar.value > 0 ? '' : '-'}{Math.abs(bar.value).toFixed(4)} ± {Math.max(bar.tolPlus, bar.tolMinus).toFixed(4)}
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Average assembly dimension */}
          <div className="flex items-center mt-6 pt-4">
            <div className="w-48 text-right pr-4 text-slate-600 text-sm">
              Average assembly dimension
            </div>
            <div className="flex-1 relative h-6">
              <div 
                className="absolute top-1/2 -translate-y-1/2 text-slate-700 font-bold"
                style={{ left: `${getPercentage(finalNominal)}%`, transform: 'translateX(-50%)' }}
              >
                {finalNominal.toFixed(4)}
              </div>
            </div>
          </div>
          
          {/* Worst case tolerance */}
          <div className="flex items-center">
            <div className="w-48 text-right pr-4 text-[#4598b5] text-sm">
              Worse case tolerance
            </div>
            <div className="flex-1 relative h-6">
              <div 
                className="absolute h-4 top-1 bg-[#4598b5] rounded-sm"
                style={{ 
                  left: `${getPercentage(results.worstCase.min)}%`, 
                  width: `${((results.worstCase.max - results.worstCase.min) / plotRange) * 100}%` 
                }}
              ></div>
              <div 
                className="absolute top-1/2 -translate-y-1/2 text-[10px] text-slate-600"
                style={{ right: `${100 - getPercentage(results.worstCase.min) + 1}%` }}
              >
                {(results.worstCase.min - finalNominal).toFixed(4)}
              </div>
              <div 
                className="absolute top-1/2 -translate-y-1/2 text-[10px] text-slate-600"
                style={{ left: `${getPercentage(results.worstCase.max) + 1}%` }}
              >
                {(results.worstCase.max - finalNominal).toFixed(4)}
              </div>
            </div>
          </div>
          
          {/* RSS tolerance */}
          <div className="flex items-center">
            <div className="w-48 text-right pr-4 text-[#e87a74] text-sm">
              RSS tolerance
            </div>
            <div className="flex-1 relative h-6">
              <div 
                className="absolute h-4 top-1 bg-[#e87a74] rounded-sm"
                style={{ 
                  left: `${getPercentage(results.rss.min)}%`, 
                  width: `${((results.rss.max - results.rss.min) / plotRange) * 100}%` 
                }}
              ></div>
              <div 
                className="absolute top-1/2 -translate-y-1/2 text-[10px] text-slate-600"
                style={{ right: `${100 - getPercentage(results.rss.min) + 1}%` }}
              >
                {(results.rss.min - finalNominal).toFixed(4)}
              </div>
              <div 
                className="absolute top-1/2 -translate-y-1/2 text-[10px] text-slate-600"
                style={{ left: `${getPercentage(results.rss.max) + 1}%` }}
              >
                {(results.rss.max - finalNominal).toFixed(4)}
              </div>
            </div>
          </div>
          
        </div>
      </div>

      <div className="mt-12">
        <h3 className="text-sm font-bold text-slate-500 uppercase mb-6">Outputs: Dimension analysis with worst case and RSS tolerance failure rates</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="border-b border-slate-300 text-slate-900 font-bold">
              <tr>
                <th className="py-3 px-4 font-bold">Dimension</th>
                <th className="py-3 px-4 font-bold">Nominal</th>
                <th className="py-3 px-4 font-bold">Tolerance</th>
                <th className="py-3 px-4 font-bold">Std. Deviation</th>
                <th className="py-3 px-4 font-bold">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dimensions.map((dim, index) => {
                const tol = Math.max(dim.tolPlus, dim.tolMinus);
                const stdDev = tol / (3 * (dim.cpk || 1.33));
                const variance = stdDev * stdDev;
                const isEven = index % 2 === 0;
                
                return (
                  <tr key={dim.id} className={isEven ? 'bg-white' : 'bg-slate-50'}>
                    <td className="py-3 px-4 text-slate-600">#{index + 1} {dim.name}</td>
                    <td className="py-3 px-4 text-slate-600">{(dim.nominal * dim.sign).toFixed(4)}</td>
                    <td className="py-3 px-4 text-slate-600">± {tol.toFixed(4)}</td>
                    <td className="py-3 px-4 text-slate-600">{stdDev.toFixed(4)}</td>
                    <td className="py-3 px-4 text-slate-600">{variance.toFixed(8)}</td>
                  </tr>
                );
              })}
              
              {/* Worst case stackup */}
              <tr className="bg-cyan-100/50 font-medium">
                <td className="py-3 px-4 text-slate-800">Worst case stackup</td>
                <td className="py-3 px-4 text-slate-800">{finalNominal.toFixed(4)}</td>
                <td className="py-3 px-4 text-slate-800">± {Math.max(results.worstCase.max - finalNominal, finalNominal - results.worstCase.min).toFixed(4)}</td>
                <td className="py-3 px-4 text-slate-800">{(Math.max(results.worstCase.max - finalNominal, finalNominal - results.worstCase.min) / 3).toFixed(4)}</td>
                <td className="py-3 px-4 text-slate-800">{Math.pow(Math.max(results.worstCase.max - finalNominal, finalNominal - results.worstCase.min) / 3, 2).toFixed(8)}</td>
              </tr>
              
              {/* RSS stackup */}
              <tr className="bg-rose-200/50 font-medium">
                <td className="py-3 px-4 text-slate-800">RSS stackup</td>
                <td className="py-3 px-4 text-slate-800">{finalNominal.toFixed(4)}</td>
                <td className="py-3 px-4 text-slate-800">± {Math.max(results.rss.max - finalNominal, finalNominal - results.rss.min).toFixed(4)}</td>
                <td className="py-3 px-4 text-slate-800">{results.rss.sigma.toFixed(4)}</td>
                <td className="py-3 px-4 text-slate-800">{Math.pow(results.rss.sigma, 2).toFixed(8)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
