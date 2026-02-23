import React, { useState, useEffect, useRef } from 'react';
import { StackupConfig } from './types';
import { calculateStackup } from './utils/calculationService';
import { DimensionEditor } from './components/DimensionEditor';
import { ResultCharts } from './components/ResultCharts';
import { SummaryPanel } from './components/SummaryPanel';
import { FullReport } from './components/FullReport';
import { ArrowRight, Save, Upload, RotateCcw, Box, Layers, BarChart3, Calculator, Ruler, DraftingCompass, Grid, Settings2, Gauge, Wand2, FileJson, FileText, ChevronDown } from 'lucide-react';
import { MANUFACTURING_PROCESSES } from './constants';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'build' | 'analyze'>('build');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState<StackupConfig>({
    id: 'default',
    name: 'New Stackup Analysis',
    description: '',
    targetGapNominal: 0,
    upperSpecLimit: 0.5,
    lowerSpecLimit: 0,
    dimensions: []
  });

  const [results, setResults] = useState<any>(null);

  // Auto-calculate when dimensions change
  useEffect(() => {
    if (config.dimensions.length > 0) {
      const res = calculateStackup(config.dimensions, config.upperSpecLimit, config.lowerSpecLimit);
      setResults(res);
    } else {
      setResults(null);
    }
  }, [config.dimensions, config.upperSpecLimit, config.lowerSpecLimit]);

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `tolstack_${config.name.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setIsExportMenuOpen(false);
  };

  const handleExportPDF = async () => {
    setIsExportMenuOpen(false);
    if (!reportRef.current) return;
    
    // We no longer need to switch tabs because we render a dedicated hidden report component
    
    try {
      const imgData = await toPng(reportRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff', // white background for report
        pixelRatio: 2 // Higher quality
      });
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      // If height exceeds A4, we might need multi-page support, but for now let's just fit width
      // Ideally we'd split it, but that's complex. Let's just add the image.
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`tolstack_report_${config.name.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF report.");
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        setConfig(imported);
      } catch (err) {
        alert("Invalid config file");
      }
    };
    reader.readAsText(file);
  };

  const suggestStackLimits = () => {
    if (!results) return;
    // Suggest limits based on RSS Natural Process Limits (3 Sigma)
    // We round to 2 decimal places for cleanliness, but maybe 3 is better for precision.
    const suggestedLSL = Number(results.rss.min.toFixed(2));
    const suggestedUSL = Number(results.rss.max.toFixed(2));
    
    setConfig({
      ...config,
      lowerSpecLimit: suggestedLSL,
      upperSpecLimit: suggestedUSL
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 relative overflow-x-hidden selection:bg-blue-100 selection:text-blue-900">
      
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <Ruler className="absolute top-20 -left-10 text-slate-200/60 opacity-50 w-64 h-64 -rotate-12" />
        <DraftingCompass className="absolute bottom-10 -right-10 text-slate-200/60 opacity-50 w-96 h-96 rotate-12" />
        <Grid className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-100 opacity-60 w-[1000px] h-[1000px]" strokeWidth={0.5} />
        <Settings2 className="absolute top-40 right-20 text-slate-100 opacity-40 w-32 h-32 rotate-45" />
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-blue-200 shadow-lg">
              <Calculator size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">TolStack <span className="text-blue-600">Pro</span></h1>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Engineering Tolerance Analysis</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
               <Upload size={16} /> Import
               <input type="file" className="hidden" accept=".json" onChange={handleImport} />
             </label>
             <div className="relative">
               <button 
                 onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} 
                 className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
               >
                 <Save size={16} /> Export <ChevronDown size={14} />
               </button>
               {isExportMenuOpen && (
                 <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50">
                   <button 
                     onClick={handleExportJSON}
                     className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2"
                   >
                     <FileJson size={16} /> Export as JSON
                   </button>
                   <button 
                     onClick={handleExportPDF}
                     className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2"
                   >
                     <FileText size={16} /> Export as PDF Report
                   </button>
                 </div>
               )}
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        
        {/* Navigation Tabs */}
        <div className="flex justify-center mb-10">
          <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-2xl shadow-sm border border-slate-200 inline-flex ring-4 ring-slate-50">
            <button
              onClick={() => setActiveTab('build')}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'build' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <Layers size={18} /> Build Stack
            </button>
            <button
              onClick={() => setActiveTab('analyze')}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'analyze' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <BarChart3 size={18} /> Analyze Results
            </button>
          </div>
        </div>

        {activeTab === 'build' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
            {/* Left Column: Stack Settings */}
            <div className="space-y-6">
              <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-200/60">
                <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 pb-4 border-b border-slate-100">
                  <Box className="text-blue-600" size={20} /> Configuration
                </h2>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Stackup Name</label>
                    <input 
                      type="text" 
                      value={config.name}
                      onChange={(e) => setConfig({...config, name: e.target.value})}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      placeholder="e.g. Housing Assembly Gap"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Target Min (LSL)</label>
                      <input 
                        type="number" 
                        value={Number.isNaN(config.lowerSpecLimit) ? '' : (config.lowerSpecLimit ?? '')}
                        onChange={(e) => setConfig({...config, lowerSpecLimit: e.target.value === '' ? undefined : parseFloat(e.target.value)})}
                        placeholder="Optional"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Target Max (USL)</label>
                      <input 
                        type="number" 
                        value={Number.isNaN(config.upperSpecLimit) ? '' : (config.upperSpecLimit ?? '')}
                        onChange={(e) => setConfig({...config, upperSpecLimit: e.target.value === '' ? undefined : parseFloat(e.target.value)})}
                        placeholder="Optional"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      />
                    </div>
                  </div>
                  
                  {config.dimensions.length > 0 && results && (
                    <button 
                      onClick={suggestStackLimits}
                      className="w-full py-2 px-4 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wide border border-blue-100 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <Wand2 size={14} /> Suggest Specs from Stack
                    </button>
                  )}
                </div>
              </div>

              {/* Process Capability Guide */}
              <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-200/60">
                 <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Gauge size={16} className="text-slate-400" /> Process Capability Guide
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-red-800">Cpk &lt; 1.0</span>
                      <span className="text-[10px] uppercase font-bold text-red-600 bg-red-200 px-1.5 py-0.5 rounded">Poor</span>
                    </div>
                    <p className="text-[11px] text-red-700 leading-snug">
                      Process not capable. High scrap/rework rates. Requires 100% inspection. High cost.
                    </p>
                  </div>

                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-yellow-800">1.0 - 1.33</span>
                      <span className="text-[10px] uppercase font-bold text-yellow-600 bg-yellow-200 px-1.5 py-0.5 rounded">Marginal</span>
                    </div>
                    <p className="text-[11px] text-yellow-700 leading-snug">
                      Risk of defects if process drifts. Tight process control required.
                    </p>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-blue-800">1.33 (4σ)</span>
                      <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-200 px-1.5 py-0.5 rounded">Industry Std</span>
                    </div>
                    <p className="text-[11px] text-blue-700 leading-snug">
                      Statistical process control effective. Good balance of quality and manufacturing cost.
                    </p>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-emerald-800">&gt; 1.67 (6σ)</span>
                      <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-200 px-1.5 py-0.5 rounded">Excellent</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 leading-snug">
                      Virtually zero defects (3.4 PPM). Ideal for critical safety dimensions.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Reference Guide */}
              <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-200/60">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Ruler size={16} className="text-slate-400" /> Standard Tolerances
                </h3>
                <div className="text-xs space-y-0 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {MANUFACTURING_PROCESSES.map((proc, i) => (
                    <div key={i} className="flex justify-between items-center py-2.5 border-b border-slate-50 last:border-0 hover:bg-slate-50 px-2 rounded-md transition-colors">
                      <span className="text-slate-600 font-medium">{proc.process}</span>
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[10px]">±{proc.typicalTol}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Dimension Editor */}
            <div className="lg:col-span-2">
              <DimensionEditor 
                dimensions={config.dimensions}
                onChange={(dims) => setConfig({...config, dimensions: dims})}
                lowerSpecLimit={config.lowerSpecLimit}
                upperSpecLimit={config.upperSpecLimit}
                results={results}
              />
              
              {config.dimensions.length > 0 && (
                <div className="mt-8 flex justify-end animate-in slide-in-from-bottom-2 fade-in">
                   <button 
                    onClick={() => setActiveTab('analyze')}
                    className="flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 hover:scale-[1.02] transition-all shadow-xl shadow-blue-500/20"
                   >
                     Run Analysis <ArrowRight size={20} />
                   </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analyze' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {results ? (
              <div className="bg-slate-50/50 p-4 -m-4 rounded-xl">
                <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                  <div>
                     <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{config.name}</h2>
                     <div className="flex items-center gap-3 mt-2 text-slate-500 text-sm font-medium">
                        <span className="bg-slate-100 px-2 py-1 rounded text-slate-700 border border-slate-200">
                          {config.dimensions.length} Dimensions
                        </span>
                        <span>•</span>
                        <span>Limits: <span className="font-mono text-slate-900">[{config.lowerSpecLimit ?? '-'}, {config.upperSpecLimit ?? '-'}]</span></span>
                     </div>
                  </div>
                  <button 
                    onClick={() => setActiveTab('build')}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:text-blue-600 hover:border-blue-200 hover:shadow-sm transition-all"
                    data-html2canvas-ignore
                  >
                    <RotateCcw size={16} /> Edit Stack
                  </button>
                </div>

                <SummaryPanel results={results} config={config} />
                <ResultCharts results={results} config={config} />
              </div>
            ) : (
              <div className="text-center py-32 bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-dashed border-slate-200">
                <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Layers className="text-slate-300" size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">No Analysis Data</h3>
                <p className="text-slate-500 mb-8 max-w-md mx-auto">Define your tolerance loop in the builder tab to generate a stack-up analysis.</p>
                <button 
                  onClick={() => setActiveTab('build')}
                  className="bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                >
                  Go to Builder
                </button>
              </div>
            )}
          </div>
        )}
      </main>
      
      {/* Hidden Report Container for PDF Generation */}
      <div className="absolute left-[-9999px] top-0 w-[1000px]" ref={reportRef}>
        <FullReport config={config} results={results} />
      </div>
      
      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-slate-200/60 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <div>
            &copy; 2026 Prashant Fawade. All rights reserved.
          </div>
          <div className="flex items-center gap-1.5">
            Built with <span className="font-medium text-slate-700">Gemini</span> and <span className="font-medium text-slate-700">Vercel</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
