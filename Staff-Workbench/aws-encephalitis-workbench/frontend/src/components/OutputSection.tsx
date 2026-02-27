import React, { useState, useEffect } from 'react';
import { Copy, Check, RefreshCw, Mail, ArrowRight, Download, Eye, Type, List, Edit3, Grid } from 'lucide-react';
import { DraftResponse, Resource } from '../types';

interface OutputSectionProps {
  content: DraftResponse | null;
  resources: Resource[];
  isLoading: boolean;
  onReset: () => void;
}

const OutputSection: React.FC<OutputSectionProps> = ({ content, resources, isLoading, onReset }) => {
  const [activeTab, setActiveTab] = useState<'BUILDER' | 'RESOURCES'>('BUILDER');
  const [copied, setCopied] = useState(false);

  // Builder State
  const [blocks, setBlocks] = useState<DraftResponse>({
      subject: '', opening: '', resourceIntro: '', closing: '', signOff: ''
  });
  const [enabledBlocks, setEnabledBlocks] = useState({
      subject: true, opening: true, resourceIntro: true, closing: true, signOff: true
  });

  useEffect(() => {
      if (content) {
          setBlocks(content);
      }
  }, [content]);

  const handleCopy = () => {
    let textToCopy = "";

    if (activeTab === 'BUILDER') {
        if (enabledBlocks.subject) textToCopy += `Subject: ${blocks.subject}\n\n`;
        if (enabledBlocks.opening) textToCopy += `${blocks.opening}\n\n`;
        if (enabledBlocks.resourceIntro) textToCopy += `${blocks.resourceIntro}\n\n`;
        
        // Add resources formatted for email
        resources.forEach(r => {
            textToCopy += `• ${r.title}: ${r.url}\n`;
        });
        textToCopy += "\n";

        if (enabledBlocks.closing) textToCopy += `${blocks.closing}\n\n`;
        if (enabledBlocks.signOff) textToCopy += `${blocks.signOff}`;
    } else {
        // Resource Only Copy
        textToCopy += "Here are the recommended resources:\n\n";
        resources.forEach(r => {
            textToCopy += `${r.title}\n${r.url}\n(${r.timeToRead})\n\n`;
        });
    }

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateBlock = (key: keyof DraftResponse, value: string) => {
      setBlocks(prev => ({ ...prev, [key]: value }));
  };

  const toggleBlock = (key: keyof typeof enabledBlocks) => {
      setEnabledBlocks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center min-h-[500px] bg-white rounded-3xl p-8">
        <div className="relative">
             <div className="w-16 h-16 border-4 border-slate-100 rounded-full"></div>
             <div className="w-16 h-16 border-4 border-rose-500 rounded-full border-t-transparent absolute top-0 animate-spin"></div>
        </div>
        <h3 className="mt-6 text-lg font-bold text-slate-900">Building Response Kit</h3>
        <p className="text-slate-500 text-sm mt-2">Assembling modular content blocks...</p>
      </div>
    );
  }

  if (!content) return null;

  return (
    <div className="flex flex-col h-full animate-fadeIn bg-slate-50">
      
      {/* Header with Tabs */}
      <div className="bg-slate-900 text-white p-4 md:p-6 rounded-t-3xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Mail className="w-5 h-5 text-rose-400" />
              Response Generator
            </h2>
            <div className="flex gap-2">
                <button
                    onClick={onReset}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-600"
                >
                    <RefreshCw className="w-3 h-3" /> Start Over
                </button>
                <button
                    onClick={handleCopy}
                    className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                    copied 
                        ? 'bg-teal-500 text-white' 
                        : 'bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-900/20'
                    }`}
                >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : activeTab === 'BUILDER' ? 'Copy Email' : 'Copy List'}
                </button>
            </div>
        </div>

        {/* Custom Tab Switcher */}
        <div className="bg-slate-800 p-1 rounded-xl inline-flex w-full md:w-auto">
            <button 
                onClick={() => setActiveTab('BUILDER')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'BUILDER' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
                <Edit3 className="w-4 h-4" /> Email Builder
            </button>
            <button 
                onClick={() => setActiveTab('RESOURCES')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'RESOURCES' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
                <List className="w-4 h-4" /> Resource Pack
            </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow border-x border-b border-slate-200 rounded-b-3xl overflow-hidden flex flex-col md:flex-row h-full">
          
        <div className="flex-1 overflow-y-auto bg-slate-50/50">
            
            {/* --- BUILDER MODE --- */}
            {activeTab === 'BUILDER' && (
                <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
                    
                    {/* Block: Subject */}
                    <div className={`transition-opacity ${enabledBlocks.subject ? 'opacity-100' : 'opacity-40'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <input type="checkbox" checked={enabledBlocks.subject} onChange={() => toggleBlock('subject')} className="accent-rose-600 w-4 h-4" />
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Subject Line</label>
                        </div>
                        <input 
                            value={blocks.subject}
                            onChange={(e) => updateBlock('subject', e.target.value)}
                            disabled={!enabledBlocks.subject}
                            className="w-full p-3 rounded-xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent font-medium text-slate-800 bg-white"
                        />
                    </div>

                    {/* Block: Opening */}
                    <div className={`transition-opacity ${enabledBlocks.opening ? 'opacity-100' : 'opacity-40'}`}>
                        <div className="flex items-center gap-2 mb-2">
                             <input type="checkbox" checked={enabledBlocks.opening} onChange={() => toggleBlock('opening')} className="accent-rose-600 w-4 h-4" />
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Opening & Empathy</label>
                        </div>
                        <textarea 
                            value={blocks.opening}
                            onChange={(e) => updateBlock('opening', e.target.value)}
                            disabled={!enabledBlocks.opening}
                            rows={3}
                            className="w-full p-3 rounded-xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent text-slate-700 leading-relaxed resize-none bg-white"
                        />
                    </div>

                    {/* Block: Resources (Read Only) */}
                    <div className="pl-6 border-l-2 border-rose-200 py-2">
                        <div className="flex items-center gap-2 mb-2">
                            <input type="checkbox" checked={enabledBlocks.resourceIntro} onChange={() => toggleBlock('resourceIntro')} className="accent-rose-600 w-4 h-4" />
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Resource Section</label>
                        </div>
                         <textarea 
                            value={blocks.resourceIntro}
                            onChange={(e) => updateBlock('resourceIntro', e.target.value)}
                            disabled={!enabledBlocks.resourceIntro}
                            rows={1}
                            className="w-full p-2 mb-3 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent text-slate-700 leading-relaxed resize-none"
                        />
                        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-sm">
                            {resources.map((r, i) => (
                                <div key={i} className="flex gap-3 items-start">
                                    <span className="text-rose-500 font-bold">•</span>
                                    <div>
                                        <p className="font-semibold text-slate-900 text-sm">{r.title}</p>
                                        <p className="text-slate-400 text-xs truncate">{r.url}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Block: Closing */}
                    <div className={`transition-opacity ${enabledBlocks.closing ? 'opacity-100' : 'opacity-40'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <input type="checkbox" checked={enabledBlocks.closing} onChange={() => toggleBlock('closing')} className="accent-rose-600 w-4 h-4" />
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Closing & Sign-off</label>
                        </div>
                         <textarea 
                            value={blocks.closing}
                            onChange={(e) => updateBlock('closing', e.target.value)}
                            disabled={!enabledBlocks.closing}
                            rows={2}
                            className="w-full p-3 mb-2 rounded-xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent text-slate-700 leading-relaxed resize-none bg-white"
                        />
                         <input 
                            value={blocks.signOff}
                            onChange={(e) => updateBlock('signOff', e.target.value)}
                            disabled={!enabledBlocks.signOff}
                            className="w-full p-3 rounded-xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent font-medium text-slate-800 bg-white"
                        />
                    </div>
                </div>
            )}

            {/* --- RESOURCES MODE --- */}
            {activeTab === 'RESOURCES' && (
                <div className="p-6 md:p-8 max-w-4xl mx-auto">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Resource Pack</h3>
                        <p className="text-slate-500 text-sm mb-6">Formatted for WhatsApp, Slack, or Clinical Notes.</p>
                        
                        <div className="space-y-6">
                            {resources.map((r, i) => (
                                <div key={i} className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 shrink-0 font-bold text-slate-400">
                                        {i + 1}
                                    </div>
                                    <div className="overflow-hidden">
                                        <h4 className="font-bold text-slate-900">{r.title}</h4>
                                        <a href={r.url} target="_blank" rel="noreferrer" className="text-rose-600 text-sm hover:underline block truncate mb-1">{r.url}</a>
                                        <div className="flex gap-2 mt-2">
                                            <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded">{r.type}</span>
                                            <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded">{r.timeToRead}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default OutputSection;