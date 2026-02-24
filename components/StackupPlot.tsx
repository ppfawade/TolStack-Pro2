import React, { useMemo, useState } from 'react';
import { Dimension, SimulationResult } from '../types';

interface Props {
  dimensions: Dimension[];
  results: SimulationResult | null;
}

export const StackupPlot: React.FC<Props> = ({ dimensions, results }) => {
  const [tooltip, setTooltip] = useState<{x: number, y: number, data: any} | null>(null);

  const plotData = useMemo(() => {
    let currentPos = 0;
    const data = dimensions.map((d, i) => {
      const start = currentPos;
      const change = d.nominal * d.sign;
      const end = currentPos + change;
      currentPos = end;
      return {
        ...d,
        start,
        end,
        change,
        index: i
      };
    });
    
    const totalNominal = currentPos;
    return { data, totalNominal };
  }, [dimensions]);

  if (dimensions.length === 0) return null;

  // Calculate bounds for scaling
  const allPoints = plotData.data.flatMap(d => [d.start, d.end, d.end + d.tolPlus, d.end - d.tolMinus]);
  if (results) {
    allPoints.push(results.worstCase.min, results.worstCase.max);
    allPoints.push(results.rss.min, results.rss.max);
  }
  
  // Add 0 to ensure we see the start
  allPoints.push(0);

  const minX = Math.min(...allPoints);
  const maxX = Math.max(...allPoints);
  const range = maxX - minX || 1;
  const padding = range * 0.15; // 15% padding
  
  const plotMin = minX - padding;
  const plotMax = maxX + padding;
  const plotRange = plotMax - plotMin;

  const width = 800;
  const rowHeight = 40;
  const headerHeight = 30;
  const footerHeight = results ? 120 : 20;
  const height = headerHeight + (dimensions.length * rowHeight) + footerHeight;
  
  const xScale = (val: number) => ((val - plotMin) / plotRange) * width;

  return (
    <div className="w-full overflow-x-auto bg-white rounded-xl border border-slate-200 p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-slate-900">Stackup Visualization</h3>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-blue-500 rounded-sm opacity-80"></div>
            <span className="text-slate-600">Positive Contribution</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-rose-500 rounded-sm opacity-80"></div>
            <span className="text-slate-600">Negative Contribution</span>
          </div>
        </div>
      </div>
      
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="font-sans text-xs overflow-visible">
        {/* Grid lines */}
        <line x1={xScale(0)} y1={0} x2={xScale(0)} y2={height} stroke="#cbd5e1" strokeWidth={1} />
        
        {/* Dimensions */}
        {plotData.data.map((d, i) => {
          const y = headerHeight + i * rowHeight;
          const barStart = xScale(Math.min(d.start, d.end));
          const barWidth = Math.abs(xScale(d.end) - xScale(d.start));
          const color = d.sign === 1 ? "#3b82f6" : "#f43f5e"; // Blue for +, Red for -
          
          return (
            <g key={d.id} className="group hover:opacity-100 transition-opacity">
              {/* Label */}
              <text x={10} y={y + rowHeight/2} dy=".35em" fill="#475569" fontSize={11} fontWeight="500">
                #{i+1} {d.name.length > 20 ? d.name.substring(0, 20) + '...' : d.name}
              </text>
              
              {/* Connecting line from previous */}
              {i > 0 && (
                <line 
                  x1={xScale(d.start)} 
                  y1={y - 10} 
                  x2={xScale(d.start)} 
                  y2={y + 10} 
                  stroke="#cbd5e1" 
                  strokeWidth={1} 
                  strokeDasharray="2 2"
                />
              )}

              {/* Main Bar */}
              <rect 
                x={barStart} 
                y={y + 8} 
                width={Math.max(barWidth, 2)} 
                height={rowHeight - 16} 
                fill={color} 
                opacity={0.9} 
                rx={2}
                className="hover:opacity-100 transition-opacity cursor-crosshair"
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltip({
                    x: rect.left + rect.width / 2,
                    y: rect.top,
                    data: d
                  });
                }}
                onMouseLeave={() => setTooltip(null)}
              />

              {/* Tolerance whiskers */}
              <g opacity={0.6}>
                <line 
                  x1={xScale(d.end - d.tolMinus)} 
                  y1={y + rowHeight/2} 
                  x2={xScale(d.end + d.tolPlus)} 
                  y2={y + rowHeight/2} 
                  stroke="#1e293b" 
                  strokeWidth={1} 
                />
                <line 
                  x1={xScale(d.end - d.tolMinus)} 
                  y1={y + 8} 
                  x2={xScale(d.end - d.tolMinus)} 
                  y2={y + rowHeight - 8} 
                  stroke="#1e293b" 
                  strokeWidth={1} 
                />
                <line 
                  x1={xScale(d.end + d.tolPlus)} 
                  y1={y + 8} 
                  x2={xScale(d.end + d.tolPlus)} 
                  y2={y + rowHeight - 8} 
                  stroke="#1e293b" 
                  strokeWidth={1} 
                />
              </g>
              
              {/* Value label */}
              <text x={xScale(d.end)} y={y + rowHeight/2 - 14} textAnchor="middle" fontSize={9} fill="#64748b" fontWeight="500">
                {d.nominal.toFixed(3)}
              </text>
            </g>
          );
        })}

        {/* Total / Results */}
        {results && (
          <g transform={`translate(0, ${headerHeight + dimensions.length * rowHeight + 20})`}>
            {/* Nominal Line */}
            <line 
              x1={xScale(plotData.totalNominal)} 
              y1={-20} 
              x2={xScale(plotData.totalNominal)} 
              y2={90} 
              stroke="#64748b" 
              strokeWidth={1} 
              strokeDasharray="4 4" 
            />
            <text x={xScale(plotData.totalNominal)} y={-10} textAnchor="middle" fontSize={10} fill="#475569" fontWeight="bold">
              Nominal: {plotData.totalNominal.toFixed(3)}
            </text>

            {/* Worst Case */}
            <g transform="translate(0, 10)">
              <text x={10} y={12} fill="#475569" fontSize={11} fontWeight="bold">Worst Case Stackup</text>
              <rect 
                x={xScale(results.worstCase.min)} 
                y={0} 
                width={Math.max(xScale(results.worstCase.max) - xScale(results.worstCase.min), 2)} 
                height={20} 
                fill="#0ea5e9" // Sky blue
                opacity={0.2} 
                rx={4}
              />
              <rect 
                x={xScale(results.worstCase.min)} 
                y={0} 
                width={Math.max(xScale(results.worstCase.max) - xScale(results.worstCase.min), 2)} 
                height={20} 
                fill="none"
                stroke="#0ea5e9"
                strokeWidth={1}
                rx={4}
              />
              {/* Min/Max markers */}
              <line x1={xScale(results.worstCase.min)} y1={0} x2={xScale(results.worstCase.min)} y2={20} stroke="#0ea5e9" strokeWidth={2} />
              <line x1={xScale(results.worstCase.max)} y1={0} x2={xScale(results.worstCase.max)} y2={20} stroke="#0ea5e9" strokeWidth={2} />
              
              <text x={xScale(results.worstCase.min)} y={32} textAnchor="middle" fontSize={10} fill="#0ea5e9" fontWeight="500">{results.worstCase.min.toFixed(3)}</text>
              <text x={xScale(results.worstCase.max)} y={32} textAnchor="middle" fontSize={10} fill="#0ea5e9" fontWeight="500">{results.worstCase.max.toFixed(3)}</text>
            </g>

            {/* RSS */}
            <g transform="translate(0, 55)">
              <text x={10} y={12} fill="#475569" fontSize={11} fontWeight="bold">RSS Stackup (3σ)</text>
              <rect 
                x={xScale(results.rss.min)} 
                y={0} 
                width={Math.max(xScale(results.rss.max) - xScale(results.rss.min), 2)} 
                height={20} 
                fill="#f43f5e" // Rose
                opacity={0.2} 
                rx={4}
              />
              <rect 
                x={xScale(results.rss.min)} 
                y={0} 
                width={Math.max(xScale(results.rss.max) - xScale(results.rss.min), 2)} 
                height={20} 
                fill="none"
                stroke="#f43f5e"
                strokeWidth={1}
                rx={4}
              />
              {/* Min/Max markers */}
              <line x1={xScale(results.rss.min)} y1={0} x2={xScale(results.rss.min)} y2={20} stroke="#f43f5e" strokeWidth={2} />
              <line x1={xScale(results.rss.max)} y1={0} x2={xScale(results.rss.max)} y2={20} stroke="#f43f5e" strokeWidth={2} />

              <text x={xScale(results.rss.min)} y={32} textAnchor="middle" fontSize={10} fill="#f43f5e" fontWeight="500">{results.rss.min.toFixed(3)}</text>
              <text x={xScale(results.rss.max)} y={32} textAnchor="middle" fontSize={10} fill="#f43f5e" fontWeight="500">{results.rss.max.toFixed(3)}</text>
            </g>
          </g>
        )}
      </svg>

      {/* Interactive Tooltip */}
      {tooltip && (
        <div 
          className="fixed z-50 bg-slate-900/95 backdrop-blur-sm text-white text-xs rounded-lg p-3 shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{ left: tooltip.x, top: tooltip.y - 8 }}
        >
          <div className="font-bold mb-2 pb-1 border-b border-slate-700">{tooltip.data.name}</div>
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-slate-300">
            <span>Nominal:</span>
            <span className="text-right font-mono text-white">{tooltip.data.nominal.toFixed(3)}</span>
            <span>Tolerance:</span>
            <span className="text-right font-mono text-white">+{tooltip.data.tolPlus} / -{tooltip.data.tolMinus}</span>
            <span>Distribution:</span>
            <span className="text-right text-white">{tooltip.data.distribution}</span>
          </div>
          {/* Arrow */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900/95"></div>
        </div>
      )}
    </div>
  );
};
