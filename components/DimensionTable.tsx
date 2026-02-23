import React from 'react';
import { Dimension, DimensionType } from '../types';
import { MANUFACTURING_PROCESSES } from '../constants';
import { ArrowRight } from 'lucide-react';

interface Props {
  dimensions: Dimension[];
}

export const DimensionTable: React.FC<Props> = ({ dimensions }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-bold text-slate-900 text-sm">Dimension Loop Details</h3>
      </div>
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs tracking-wider">
          <tr>
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Sign</th>
            <th className="px-4 py-3">Process</th>
            <th className="px-4 py-3 text-right">Nominal</th>
            <th className="px-4 py-3 text-right">Tol (+)</th>
            <th className="px-4 py-3 text-right">Tol (-)</th>
            <th className="px-4 py-3">Distribution</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {dimensions.map((dim, idx) => (
            <tr key={dim.id}>
              <td className="px-4 py-3 text-slate-400 font-mono text-xs">{idx + 1}</td>
              <td className="px-4 py-3 font-medium text-slate-900">{dim.name}</td>
              <td className="px-4 py-3 text-slate-600">{dim.type}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${dim.sign === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {dim.sign === 1 ? '+' : '-'}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-600">
                {dim.process || <span className="text-slate-400 italic">Manual</span>}
              </td>
              <td className="px-4 py-3 text-right font-mono text-slate-700">{dim.nominal.toFixed(3)}</td>
              <td className="px-4 py-3 text-right font-mono text-emerald-600">+{dim.tolPlus.toFixed(3)}</td>
              <td className="px-4 py-3 text-right font-mono text-rose-600">-{dim.tolMinus.toFixed(3)}</td>
              <td className="px-4 py-3 text-slate-600 text-xs">
                {dim.distribution}
                {dim.distribution === 'Normal' && dim.cpk && (
                  <span className="ml-1 text-slate-400">(Cpk: {dim.cpk})</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
