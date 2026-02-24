import React from 'react';
import { Dimension, DimensionType, DistributionType, SimulationResult } from '../types';
import { Trash2, Plus, Minus, Info, MoveVertical, Settings2, ChevronDown } from 'lucide-react';
import { MANUFACTURING_PROCESSES } from '../constants';
import { StackupPlot } from './StackupPlot';

interface Props {
  dimensions: Dimension[];
  onChange: (dims: Dimension[]) => void;
  lowerSpecLimit?: number;
  upperSpecLimit?: number;
  results: SimulationResult | null;
}

export const DimensionEditor: React.FC<Props> = ({ dimensions, onChange, lowerSpecLimit, upperSpecLimit, results }) => {
  const maxTolMinus = Math.max(...dimensions.map(d => d.tolMinus || 0), 0.001);
  const maxTolPlus = Math.max(...dimensions.map(d => d.tolPlus || 0), 0.001);

  const addDimension = () => {
    const newDim: Dimension = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Dim ${dimensions.length + 1}`,
      nominal: 10,
      tolPlus: 0.1,
      tolMinus: 0.1,
      sign: 1,
      distribution: DistributionType.Normal,
      cpk: 1.33,
      type: DimensionType.Linear,
      process: ''
    };
    onChange([...dimensions, newDim]);
  };

  const updateDimension = (id: string, field: keyof Dimension, value: any) => {
    onChange(dimensions.map(d => {
      if (d.id === id) {
        // Handle Process Auto-fill
        if (field === 'process') {
          const process = MANUFACTURING_PROCESSES.find(p => p.process === value);
          if (process) {
            return {
              ...d,
              process: value,
              tolPlus: process.typicalTol,
              tolMinus: process.typicalTol,
              cpk: process.minCpk,
              // Reset dist to Normal usually for processes, unless specified otherwise
              distribution: DistributionType.Normal
            };
          }
        }
        return { ...d, [field]: value };
      }
      return d;
    }));
  };

  const removeDimension = (id: string) => {
    onChange(dimensions.filter(d => d.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Stackup Visualization */}
      {dimensions.length > 0 && (
        <StackupPlot dimensions={dimensions} results={results} />
      )}

      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <div>
             <h2 className="text-lg font-bold text-slate-900">Dimension Loop</h2>
             <p className="text-sm text-slate-500">Define the geometric chain of dimensions and their manufacturing processes.</p>
          </div>
          <button 
            onClick={addDimension}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-md hover:shadow-lg"
          >
            <Plus size={16} /> Add Dimension
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase text-xs tracking-wider">
              <tr>
                <th className="px-2 py-3 w-24 text-center text-xs font-bold text-slate-900 uppercase tracking-wider">Direction</th>
                <th className="px-2 py-3 min-w-[180px] text-xs font-bold text-slate-900 uppercase tracking-wider">Name & Type</th>
                <th className="px-2 py-3 min-w-[140px] text-xs font-bold text-slate-900 uppercase tracking-wider">Process (Auto-Tol)</th>
                <th className="px-2 py-3 min-w-[100px] text-center text-xs font-bold text-slate-900 uppercase tracking-wider">Nominal</th>
                <th className="px-2 py-3 min-w-[100px] text-center text-xs font-bold text-emerald-700 uppercase tracking-wider">Tol (+)</th>
                <th className="px-2 py-3 min-w-[100px] text-center text-xs font-bold text-rose-700 uppercase tracking-wider">Tol (-)</th>
                <th className="px-2 py-3 min-w-[200px] text-xs font-bold text-slate-900 uppercase tracking-wider">Distribution</th>
                <th className="px-2 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dimensions.length === 0 && (
                 <tr>
                   <td colSpan={7} className="px-6 py-16 text-center">
                     <div className="flex flex-col items-center justify-center opacity-40">
                       <MoveVertical size={48} className="text-slate-400 mb-2" />
                       <p className="text-slate-500 font-medium">Empty Chain</p>
                       <p className="text-xs text-slate-400">Add dimensions to start building your stack.</p>
                     </div>
                   </td>
                 </tr>
              )}
              {dimensions.map((dim, idx) => {
                return (
                <tr key={dim.id} className="group hover:bg-slate-50 transition-colors">
                  {/* Direction */}
                  <td className="px-2 py-2 align-middle">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xs font-mono text-slate-400 w-4 text-right">{idx + 1}</span>
                      <div className="relative">
                        <div className={`flex items-center justify-center w-10 h-9 rounded-lg text-white shadow-sm transition-colors ${dim.sign === 1 ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                           {dim.sign === 1 ? <Plus size={18} strokeWidth={3} /> : <Minus size={18} strokeWidth={3} />}
                           <ChevronDown size={12} className="ml-0.5 opacity-80" />
                        </div>
                        <select
                          value={dim.sign}
                          onChange={(e) => updateDimension(dim.id, 'sign', parseInt(e.target.value))}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        >
                          <option value={1}>+ (Add)</option>
                          <option value={-1}>- (Sub)</option>
                        </select>
                      </div>
                    </div>
                  </td>

                  {/* Name & Type */}
                  <td className="px-2 py-2 align-middle">
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        maxLength={8}
                        value={dim.name} 
                        onChange={(e) => updateDimension(dim.id, 'name', e.target.value)}
                        className="w-20 h-9 rounded-lg border border-slate-200 px-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none shadow-sm transition-all"
                        placeholder="Name"
                      />
                      <select 
                        value={dim.type}
                        onChange={(e) => updateDimension(dim.id, 'type', e.target.value)}
                        className="h-9 rounded-lg border border-slate-200 px-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white cursor-pointer transition-all"
                      >
                        <option value={DimensionType.Linear}>Linear</option>
                        <option value={DimensionType.Hole}>Hole</option>
                        <option value={DimensionType.Shaft}>Shaft</option>
                      </select>
                    </div>
                  </td>
                  
                  {/* Process */}
                  <td className="px-2 py-2 align-middle">
                    <div className="relative">
                      <select 
                        value={dim.process || ''}
                        onChange={(e) => updateDimension(dim.id, 'process', e.target.value)}
                        className="w-full h-9 rounded-lg border border-slate-200 pl-2 pr-6 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white cursor-pointer transition-all appearance-none"
                      >
                        <option value="">Custom / Manual</option>
                        {MANUFACTURING_PROCESSES.map((proc, i) => (
                          <option key={i} value={proc.process}>{proc.process}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    {dim.process && (
                       <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400 px-1">
                         <Settings2 size={10} />
                         <span>Auto: ±{MANUFACTURING_PROCESSES.find(p => p.process === dim.process)?.typicalTol}</span>
                       </div>
                    )}
                  </td>

                  {/* Nominal */}
                  <td className="px-2 py-2 align-middle">
                    <input 
                      type="number" 
                      step="0.1"
                      value={Number.isNaN(dim.nominal) ? '' : dim.nominal} 
                      onChange={(e) => updateDimension(dim.id, 'nominal', parseFloat(e.target.value))}
                      className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-2 text-center text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none font-mono text-sm transition-all"
                      placeholder="Nom"
                    />
                  </td>

                  {/* Tol + */}
                  <td className="px-2 py-2 align-middle">
                    <input 
                      type="number" 
                      step="0.1"
                      value={Number.isNaN(dim.tolPlus) ? '' : dim.tolPlus} 
                      onChange={(e) => updateDimension(dim.id, 'tolPlus', parseFloat(e.target.value))}
                      className="w-full h-9 rounded-lg border border-emerald-200 bg-emerald-50 px-2 text-center text-emerald-700 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none font-mono text-sm transition-all"
                      placeholder="+Tol"
                    />
                  </td>

                  {/* Tol - */}
                  <td className="px-2 py-2 align-middle">
                    <input 
                      type="number" 
                      step="0.1"
                      value={Number.isNaN(dim.tolMinus) ? '' : dim.tolMinus} 
                      onChange={(e) => updateDimension(dim.id, 'tolMinus', parseFloat(e.target.value))}
                      className="w-full h-9 rounded-lg border border-rose-200 bg-rose-50 px-2 text-center text-rose-700 shadow-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none font-mono text-sm transition-all"
                      placeholder="-Tol"
                    />
                  </td>

                  {/* Distribution */}
                  <td className="px-2 py-2 align-middle">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <select 
                          value={dim.distribution}
                          onChange={(e) => updateDimension(dim.id, 'distribution', e.target.value)}
                          className="w-full h-9 rounded-lg border border-slate-200 pl-2 pr-6 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white cursor-pointer transition-all appearance-none"
                        >
                          {Object.values(DistributionType).map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                      
                      {dim.distribution === DistributionType.Normal && (
                        <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg border border-slate-200 px-2 h-9 shrink-0">
                          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Cpk:</span>
                          <input 
                            type="number" 
                            step="0.1"
                            value={dim.cpk === undefined || Number.isNaN(dim.cpk) ? '' : dim.cpk}
                            onChange={(e) => updateDimension(dim.id, 'cpk', parseFloat(e.target.value))}
                            className="w-12 bg-transparent border-none p-0 text-center text-sm text-slate-700 focus:ring-0 placeholder-slate-400"
                            placeholder="1.33"
                          />
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Delete */}
                  <td className="px-2 py-2 text-right align-middle">
                    <button 
                      onClick={() => removeDimension(dim.id)}
                      className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg p-2 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
        
        {dimensions.length > 0 && (
          <div className="bg-slate-50/50 p-4 border-t border-slate-100">
            <div className="flex items-start gap-3 text-xs text-slate-600 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
              <Info size={16} className="mt-0.5 shrink-0 text-blue-600" />
              <p>
                <strong>Engineering Tip:</strong> Selecting a <strong>Process</strong> automatically applies standard tolerance values. You can manually override these values if your specific supplier capability differs.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
