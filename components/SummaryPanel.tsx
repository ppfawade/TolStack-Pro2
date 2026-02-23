import React from 'react';
import { SimulationResult, StackupConfig } from '../types';
import { AlertTriangle, CheckCircle, XCircle, Gauge, TrendingUp, BarChart, Info } from 'lucide-react';

interface Props {
  results: SimulationResult;
  config: StackupConfig;
}

export const SummaryPanel: React.FC<Props> = ({ results, config }) => {
  const { worstCase, rss, monteCarlo } = results;

  const isSpecDefined = config.upperSpecLimit !== null || config.lowerSpecLimit !== null;
  
  // Calculate Cp/Cpk for the overall stack
  const calculateCapabilities = () => {
    if (config.upperSpecLimit === null || config.lowerSpecLimit === null) return { cp: 0, cpk: 0 };
    
    const sigma = monteCarlo.stdDev;
    const mean = monteCarlo.mean;
    const usl = config.upperSpecLimit;
    const lsl = config.lowerSpecLimit;
    
    const cp = (usl - lsl) / (6 * sigma);
    const cpu = (usl - mean) / (3 * sigma);
    const cpl = (mean - lsl) / (3 * sigma);
    const cpk = Math.min(cpu, cpl);
    
    return { cp, cpk };
  };

  const { cp, cpk } = calculateCapabilities();

  const ResultCard = ({ title, min, max, type, colorClass, icon: Icon, tooltip }: any) => (
    <div className="p-5 rounded-2xl bg-white/90 backdrop-blur-sm shadow-sm border border-slate-200/60 relative group hover:shadow-md transition-all">
      <div className={`absolute top-0 left-0 w-1.5 h-full rounded-l-2xl ${colorClass}`}></div>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-1.5 group/tooltip relative">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</h4>
          <Info size={14} className="text-slate-400 cursor-help" />
          <div className="absolute bottom-full left-0 mb-2 hidden w-64 p-3 text-xs text-slate-100 bg-slate-800 rounded-lg shadow-xl group-hover/tooltip:block z-[100] font-normal normal-case tracking-normal leading-relaxed">
            {tooltip}
            <div className="absolute top-full left-4 border-4 border-transparent border-t-slate-800"></div>
          </div>
        </div>
        {Icon && <Icon size={16} className="text-slate-300 group-hover:text-slate-400 transition-colors" />}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Min Gap</span>
          <span className="text-2xl font-bold text-slate-900 tracking-tight">{min.toFixed(3)}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Max Gap</span>
          <span className="text-2xl font-bold text-slate-900 tracking-tight">{max.toFixed(3)}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Stat Cards */}
      <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ResultCard 
          title="Worst Case" 
          min={worstCase.min} 
          max={worstCase.max} 
          type="WC"
          colorClass="bg-rose-500"
          icon={AlertTriangle}
          tooltip="Absolute worst-case scenario where all dimensions are simultaneously at their extreme limits. Highly unlikely but guarantees 100% assembly if limits are met."
        />
        <ResultCard 
          title="RSS (Stat)" 
          min={rss.min} 
          max={rss.max} 
          type="RSS"
          colorClass="bg-blue-500"
          icon={TrendingUp}
          tooltip="Root Sum Squared (RSS) assumes dimensions vary randomly and normally. It provides a realistic statistical tolerance range, typically representing ±3 sigma."
        />
        <ResultCard 
          title="Monte Carlo" 
          min={monteCarlo.min} 
          max={monteCarlo.max} 
          type="MC"
          colorClass="bg-purple-500"
          icon={BarChart}
          tooltip="Simulates thousands of random assemblies based on specified distributions. Provides the most accurate prediction of real-world manufacturing outcomes."
        />
      </div>

      {/* Yield & Capabilities */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-xl shadow-slate-200 flex flex-col justify-center relative">
        {/* Background texture for card */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          <Gauge className="absolute -bottom-6 -right-6 text-white opacity-5 w-32 h-32" />
        </div>
        
        {!isSpecDefined ? (
          <div className="text-center opacity-80 py-2">
             <AlertTriangle className="mx-auto mb-3 text-yellow-400" size={28} />
             <p className="text-sm font-medium">Define Upper/Lower limits to see Yield & Cpk</p>
          </div>
        ) : (
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6 border-b border-slate-700/50 pb-4">
              <div>
                <div className="flex items-center gap-1.5 group/tooltip relative mb-1">
                  <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Projected Yield</p>
                  <Info size={12} className="text-slate-400 cursor-help" />
                  <div className="absolute bottom-full left-0 mb-2 hidden w-56 p-2.5 text-xs text-slate-100 bg-slate-700 rounded-lg shadow-xl group-hover/tooltip:block z-50 font-normal normal-case tracking-normal">
                    Percentage of assemblies expected to fall within the specified upper and lower limits based on Monte Carlo simulation.
                    <div className="absolute top-full left-4 border-4 border-transparent border-t-slate-700"></div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-4xl font-bold tracking-tight ${monteCarlo.yield > 99 ? 'text-emerald-400' : monteCarlo.yield > 90 ? 'text-yellow-400' : 'text-rose-400'}`}>
                    {monteCarlo.yield.toFixed(2)}%
                  </span>
                  {monteCarlo.yield > 99.7 && <CheckCircle size={24} className="text-emerald-500" />}
                </div>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">Interference</p>
                <span className="text-xl font-mono text-slate-200">{(100 - monteCarlo.yield).toFixed(2)}%</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-slate-800/50 p-2 rounded-lg">
                <Gauge size={20} className="text-blue-400" />
              </div>
              <div>
                <div className="flex gap-6 text-sm">
                  <div className="flex items-center gap-1 group/tooltip relative">
                    <span>Cpk: <strong className={`text-lg ${cpk > 1.33 ? "text-emerald-400" : "text-yellow-400"}`}>{cpk.toFixed(2)}</strong></span>
                    <Info size={12} className="text-slate-400 cursor-help" />
                    <div className="absolute bottom-full left-0 mb-2 hidden w-56 p-2.5 text-xs text-slate-100 bg-slate-700 rounded-lg shadow-xl group-hover/tooltip:block z-50 font-normal normal-case tracking-normal">
                      Process Capability Index. Measures how close you are to your target and how consistent you are. Cpk &gt; 1.33 is industry standard.
                      <div className="absolute top-full left-4 border-4 border-transparent border-t-slate-700"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 group/tooltip relative">
                    <span>Cp: <strong className="text-lg text-slate-200">{cp.toFixed(2)}</strong></span>
                    <Info size={12} className="text-slate-400 cursor-help" />
                    <div className="absolute bottom-full left-0 mb-2 hidden w-56 p-2.5 text-xs text-slate-100 bg-slate-700 rounded-lg shadow-xl group-hover/tooltip:block z-50 font-normal normal-case tracking-normal">
                      Process Capability. Measures the spread of the process relative to the specification width, regardless of centering.
                      <div className="absolute top-full left-4 border-4 border-transparent border-t-slate-700"></div>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 font-medium uppercase tracking-wide">
                  {cpk > 1.33 ? "Process Capable (6σ)" : cpk > 1 ? "Marginal Process" : "Not Capable"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};