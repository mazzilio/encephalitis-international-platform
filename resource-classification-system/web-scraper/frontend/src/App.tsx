import React, { useState, useEffect } from 'react';
import { Play, Download, Database, BrainCircuit, FileCode, Timer } from 'lucide-react';
import { api } from './services/api';
import { Dashboard } from './components/Dashboard';
import { ProcessList } from './components/ProcessList';
import { AppState, ProcessingStatus, ClassifiedPage } from '../../shared/types';

const EXAMPLE_SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.encephalitis.info/what-is-encephalitis</loc>
  </url>
  <url>
    <loc>https://www.encephalitis.info/types-of-encephalitis/autoimmune-encephalitis</loc>
  </url>
</urlset>`;

export default function App() {
  const [sitemapInput, setSitemapInput] = useState<string>('');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [batchId, setBatchId] = useState<string>('');
  const [queue, setQueue] = useState<ProcessingStatus[]>([]);
  const [results, setResults] = useState<ClassifiedPage[]>([]);
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState<string>('');

  useEffect(() => {
    if (appState === AppState.PROCESSING && batchId) {
      const interval = setInterval(async () => {
        try {
          const status = await api.getStatus(batchId);
          setQueue(status.items);
          setProgress(status.progress);

          if (status.progress === 100) {
            const resultsData = await api.getResults(batchId);
            setResults(resultsData);
            setAppState(AppState.COMPLETED);
            clearInterval(interval);
          }
        } catch (error) {
          console.error('Error fetching status:', error);
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [appState, batchId]);

  const handleStart = async () => {
    if (!sitemapInput.trim()) {
      alert('Please paste a valid Sitemap XML.');
      return;
    }

    try {
      const response = await api.processSitemap(sitemapInput);
      setBatchId(response.batchId);
      setAppState(AppState.PROCESSING);
      setProgress(0);
      setResults([]);
    } catch (error) {
      console.error('Error starting process:', error);
      alert('Failed to start processing. Please try again.');
    }
  };

  const downloadJson = async () => {
    if (!batchId) return;

    try {
      const data = await api.getResults(batchId);
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute('href', dataStr);
      downloadAnchorNode.setAttribute('download', `results-${batchId}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (error) {
      console.error('Error downloading results:', error);
      alert('Failed to download results.');
    }
  };

  const loadExample = () => {
    setSitemapInput(EXAMPLE_SITEMAP);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <BrainCircuit size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">AWS Web Scraper</h1>
              <p className="text-xs text-slate-500 font-medium">Resource Classification Tool</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-400">Powered by</p>
              <p className="text-sm font-semibold text-slate-700">Claude Opus 4.5</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                <FileCode size={18} /> Sitemap XML
              </h2>
              <button
                onClick={loadExample}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
                disabled={appState === AppState.PROCESSING}
              >
                Load Example
              </button>
            </div>

            <textarea
              value={sitemapInput}
              onChange={(e) => setSitemapInput(e.target.value)}
              className="w-full flex-1 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[300px]"
              placeholder="Paste your sitemap XML here..."
              disabled={appState === AppState.PROCESSING}
            />

            <div className="mt-4 pt-4 border-t border-slate-100">
              {appState === AppState.PROCESSING ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-end text-xs text-slate-500 mb-1">
                    <span className="flex items-center gap-1.5 font-medium text-slate-600">
                      Processing...
                    </span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleStart}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Play size={18} fill="currentColor" />
                  Run Process
                </button>
              )}
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <Database className="text-slate-400" size={20} />
              <div>
                <h3 className="text-sm font-semibold text-slate-700">Export Data</h3>
                <p className="text-xs text-slate-500">{results.length} records ready</p>
              </div>
            </div>
            <button
              onClick={downloadJson}
              disabled={results.length === 0}
              className={`w-full py-2 border rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors
                ${results.length > 0
                  ? 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  : 'border-slate-100 text-slate-300 cursor-not-allowed'
                }`}
            >
              <Download size={16} />
              Download JSON
            </button>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="min-h-[300px]">
            <Dashboard results={results} />
          </div>
          <ProcessList items={queue} />
        </div>
      </main>
    </div>
  );
}
