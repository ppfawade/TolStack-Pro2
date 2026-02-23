import React from 'react';
import { 
  ComposedChart, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Area, 
  ReferenceLine,
  Cell
} from 'recharts';
import { SimulationResult, StackupConfig } from '../types';
import { Info } from 'lucide-react';

interface Props {
  results: SimulationResult;
  config: StackupConfig;
}

export const ResultCharts: React.FC<Props> = ({ results, config }) => {
  const { monteCarlo, contributions } = results;
  const { histogram } = monteCarlo;

  // Prepare data for Bell Curve + Histogram
  const chartData = histogram.map(item => ({
    ...item,
    // Add a simple smoothing/curve mock for visual appeal if needed, 
    // or just rely on the histogram bars
  }));

  const maxFreq = Math.max(...histogram.map(h => h.count));

  return (
    <div className="space-y-8">
      
      {/* Monte Carlo Distribution */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Monte Carlo Simulation</h3>
            <p className="text-sm text-slate-500">Distribution of calculated gaps (10,000 iterations)</p>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="flex items-center gap-1 group/tooltip relative">
              <div className="text-2xl font-bold text-blue-600">
                {monteCarlo.mean.toFixed(3)} <span className="text-xs text-slate-400 font-normal">Mean</span>
              </div>
              <Info size={14} className="text-slate-400 cursor-help" />
              <div className="absolute bottom-full right-0 mb-2 hidden w-56 p-2.5 text-xs text-slate-100 bg-slate-800 rounded-lg shadow-xl group-hover/tooltip:block z-50 font-normal normal-case tracking-normal text-left">
                The average gap or dimension resulting from the Monte Carlo simulation.
                <div className="absolute top-full right-4 border-4 border-transparent border-t-slate-800"></div>
              </div>
            </div>
            <div className="flex items-center gap-1 group/tooltip relative mt-1">
              <div className="text-sm text-slate-500">
                σ = {monteCarlo.stdDev.toFixed(3)}
              </div>
              <Info size={12} className="text-slate-400 cursor-help" />
              <div className="absolute bottom-full right-0 mb-2 hidden w-56 p-2.5 text-xs text-slate-100 bg-slate-800 rounded-lg shadow-xl group-hover/tooltip:block z-50 font-normal normal-case tracking-normal text-left">
                Standard Deviation (σ). Measures the amount of variation or dispersion of the simulated values.
                <div className="absolute top-full right-4 border-4 border-transparent border-t-slate-800"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="bin" 
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickFormatter={(val) => val.toFixed(2)}
                label={{ value: 'Gap / Stackup Dimension (mm)', position: 'insideBottom', offset: -5, fontSize: 12 }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#64748b' }} 
              />
              <Tooltip 
                formatter={(value: number) => [value, 'Frequency']}
                labelFormatter={(label: number) => `Gap: ${label.toFixed(3)}`}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="count" fill="#3b82f6" barSize={20} radius={[4, 4, 0, 0]} opacity={0.8} />
              
              {/* Spec Limits */}
              {config.upperSpecLimit !== null && (
                <ReferenceLine x={config.upperSpecLimit} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'USL', fill: '#ef4444', fontSize: 10 }} />
              )}
              {config.lowerSpecLimit !== null && (
                <ReferenceLine x={config.lowerSpecLimit} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'LSL', fill: '#ef4444', fontSize: 10 }} />
              )}
              
              {/* Zero Line for Clearance Check */}
              <ReferenceLine x={0} stroke="#10b981" strokeWidth={2} label={{ value: 'Zero Gap', fill: '#10b981', fontSize: 10 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Contribution Analysis */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Contribution Analysis</h3>
        <p className="text-sm text-slate-500 mb-6">Percentage of total variance contributed by each dimension</p>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              layout="vertical" 
              data={contributions} 
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" unit="%" tick={{ fontSize: 12 }} domain={[0, 100]} />
              <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Contribution']}
                contentStyle={{ borderRadius: '8px' }}
              />
              <Bar dataKey="percent" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={24}>
                {contributions.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.percent > 30 ? '#f43f5e' : '#8b5cf6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
