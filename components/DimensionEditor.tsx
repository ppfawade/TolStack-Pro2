import React from 'react';
import { Dimension, DimensionType, DistributionType } from '../types';
import { Trash2, Plus, Info, MoveVertical, Settings2, AlertTriangle } from 'lucide-react';
import { MANUFACTURING_PROCESSES } from '../constants';

interface Props {
  dimensions: Dimension[];
  onChange: (dims: Dimension[]) => void;
  lowerSpecLimit?: number;
  upperSpecLimit?: number;
}

export const DimensionEditor: React.FC<Props> = ({ dimensions, onChange, lowerSpecLimit, upperSpecLimit }) => {
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
              <th className="px-4 py-4 min-w-[150px]">Name & Type</th>
              <th className="px-4 py-4 min-w-[140px]">Process (Auto-Tol)</th>
              <th className="px-4 py-4 w-24">Nominal</th>
              <th className="px-4 py-4 w-20 text-emerald-700">Tol (+)</th>
              <th className="px-4 py-4 w-20 text-rose-700">Tol (-)</th>
              <th className="px-4 py-4 w-40 text-slate-400">Range Visualizer</th>
              <th className="px-4 py-4 min-w-[120px]">Distribution</th>
              <th className="px-4 py-4 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {dimensions.length === 0 && (
               <tr>
                 <td colSpan={8} className="px-6 py-16 text-center">
                   <div className="flex flex-col items-center justify-center opacity-40">
                     <MoveVertical size={48} className="text-slate-400 mb-2" />
                     <p className="text-slate-500 font-medium">Empty Chain</p>
                     <p className="text-xs text-slate-400">Add dimensions to start building your stack.</p>
                   </div>
                 </td>
               </tr>
            )}
            {dimensions.map((dim, idx) => {
              const dimLSL = dim.nominal - dim.tolMinus;
              const dimUSL = dim.nominal + dim.tolPlus;
              const exceedsLimits = (lowerSpecLimit !== undefined && dimLSL < lowerSpecLimit) || 
                                    (upperSpecLimit !== undefined && dimUSL > upperSpecLimit);

              return (
              <tr key={dim.id} className={`group transition-colors ${exceedsLimits ? 'bg-rose-50/50 hover:bg-rose-50' : 'hover:bg-blue-50/30'}`}>
                <td className="px-4 py-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-300 w-4">{idx + 1}</span>
                      {exceedsLimits && <AlertTriangle size={14} className="text-rose-500 shrink-0" title="Dimension range exceeds target limits" />}
                      <input 
                        type="text" 
                        value={dim.name} 
                        onChange={(e) => updateDimension(dim.id, 'name', e.target.value)}
                        className="w-full bg-transparent border-b border-transparent focus:border-blue-500 focus:outline-none px-0 py-0.5 font-medium text-slate-900 placeholder-slate-300"
                        placeholder="Name"
                      />
                    </div>
                    <div className="flex gap-1 pl-6">
                      <select 
                        value={dim.sign}
                        onChange={(e) => updateDimension(dim.id, 'sign', parseInt(e.target.value))}
                        className={`block rounded-md border-0 py-0.5 px-1.5 text-white font-bold text-[10px] shadow-sm cursor-pointer ${dim.sign === 1 ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'}`}
                      >
                        <option value={1}>+</option>
                        <option value={-1}>-</option>
                      </select>
                      <select 
                        value={dim.type}
                        onChange={(e) => updateDimension(dim.id, 'type', e.target.value)}
                        className="block rounded-md border-0 py-0.5 px-1.5 text-slate-600 text-[10px] font-medium shadow-sm ring-1 ring-inset ring-slate-200 bg-white cursor-pointer"
                      >
                        <option value={DimensionType.Linear}>Linear</option>
                        <option value={DimensionType.Hole}>Hole</option>
                        <option value={DimensionType.Shaft}>Shaft</option>
                      </select>
                    </div>
                  </div>
                </td>
                
                {/* Manufacturing Process */}
                <td className="px-4 py-3 align-top">
                  <select 
                    value={dim.process || ''}
                    onChange={(e) => updateDimension(dim.id, 'process', e.target.value)}
                    className="w-full rounded-lg border-0 py-2 px-2 text-xs text-slate-700 font-medium shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-blue-600 bg-white cursor-pointer"
                  >
                    <option value="">Custom / Manual</option>
                    {MANUFACTURING_PROCESSES.map((proc, i) => (
                      <option key={i} value={proc.process}>{proc.process}</option>
                    ))}
                  </select>
                  {dim.process && (
                     <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                       <Settings2 size={10} />
                       <span>Auto-set: ±{MANUFACTURING_PROCESSES.find(p => p.process === dim.process)?.typicalTol}</span>
                     </div>
                  )}
                </td>

                <td className="px-4 py-3 align-top">
                  <input 
                    type="number" 
                    value={dim.nominal} 
                    onChange={(e) => updateDimension(dim.id, 'nominal', parseFloat(e.target.value))}
                    className="w-20 rounded-lg border-0 bg-slate-50 py-2 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-blue-600 text-sm font-mono"
                    placeholder="Nom"
                  />
                </td>
                <td className="px-4 py-3 align-top">
                  <input 
                    type="number" 
                    step="0.001"
                    value={dim.tolPlus} 
                    onChange={(e) => updateDimension(dim.id, 'tolPlus', parseFloat(e.target.value))}
                    className="w-16 rounded-lg border-0 bg-emerald-50 py-2 px-2 text-emerald-700 shadow-sm ring-1 ring-inset ring-emerald-200 focus:ring-2 focus:ring-inset focus:ring-emerald-600 text-xs font-mono"
                    placeholder="+Tol"
                  />
                </td>
                <td className="px-4 py-3 align-top">
                  <input 
                    type="number" 
                    step="0.001"
                    value={dim.tolMinus} 
                    onChange={(e) => updateDimension(dim.id, 'tolMinus', parseFloat(e.target.value))}
                    className="w-16 rounded-lg border-0 bg-rose-50 py-2 px-2 text-rose-700 shadow-sm ring-1 ring-inset ring-rose-200 focus:ring-2 focus:ring-inset focus:ring-rose-600 text-xs font-mono"
                    placeholder="-Tol"
                  />
                </td>
                
                {/* Calculated Limits & Visualizer */}
                <td className="px-4 py-3 align-top">
                  <div 
                    className="flex flex-col gap-2 pt-1 w-32 cursor-help" 
                    title={`Range: ${(dim.nominal - dim.tolMinus).toFixed(3)} to ${(dim.nominal + dim.tolPlus).toFixed(3)}\nSpread: ${(dim.tolPlus + dim.tolMinus).toFixed(3)}`}
                  >
                    <div className={`flex justify-between text-[10px] font-mono leading-none ${exceedsLimits ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                      <span>{(dim.nominal - dim.tolMinus).toFixed(2)}</span>
                      <span>{(dim.nominal + dim.tolPlus).toFixed(2)}</span>
                    </div>
                    <div className={`relative h-2.5 bg-slate-100 rounded-full w-full flex items-center overflow-hidden ring-1 ${exceedsLimits ? 'ring-rose-300' : 'ring-slate-200/50'}`}>
                      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-400 z-10"></div>
                      <div 
                        className="absolute right-1/2 h-full bg-rose-400 opacity-80 transition-all duration-300"
                        style={{ width: `${(dim.tolMinus / maxTolMinus) * 50}%` }}
                      ></div>
                      <div 
                        className="absolute left-1/2 h-full bg-emerald-400 opacity-80 transition-all duration-300"
                        style={{ width: `${(dim.tolPlus / maxTolPlus) * 50}%` }}
                      ></div>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3 align-top">
                  <select 
                    value={dim.distribution}
                    onChange={(e) => updateDimension(dim.id, 'distribution', e.target.value)}
                    className="w-full rounded-lg border-0 py-2 px-2 text-xs text-slate-600 bg-white ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-blue-600 cursor-pointer"
                  >
                    {Object.values(DistributionType).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  {dim.distribution === DistributionType.Normal && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                      <span>Cpk:</span>
                      <input 
                        type="number" 
                        step="0.1"
                        value={dim.cpk || 1.33}
                        onChange={(e) => updateDimension(dim.id, 'cpk', parseFloat(e.target.value))}
                        className="w-10 bg-transparent border-b border-slate-200 p-0 text-center text-slate-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-right align-top">
                  <button 
                    onClick={() => removeDimension(dim.id)}
                    className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full p-2 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
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
  );
};