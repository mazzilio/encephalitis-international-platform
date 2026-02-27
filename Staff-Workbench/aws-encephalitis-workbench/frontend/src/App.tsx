import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, BrainCircuit, Activity, Search, User, ChevronRight, Database, CheckCircle, AlertCircle, ArrowLeft, Heart, Stethoscope, Clock, FileText, Video, Globe, BookOpen, Mail, Keyboard, Zap, FileEdit, Tag, Inbox, MessageSquare } from 'lucide-react';
import FileUploader from './components/FileUploader';
import OutputSection from './components/OutputSection';
import { suggestResources, generateDraft } from './services/aws-bedrock';
import { AppState, MockProfile, Resource } from './types';
import { MOCK_PROFILES, MOCK_INBOX } from './data/mockProfiles';

const INITIAL_STATE: AppState = {
  jsonFileContent: null,
  jsonFileName: null,
  step: 'SEARCH',
  formData: {
    name: '',
    role: '',
    diagnosis: '',
    stage: '',
    concerns: ''
  },
  suggestedResources: [],
  selectedResourceIds: [],
  isLoading: false,
  loadingMessage: '',
  error: null,
  response: null,
};

const COMMON_TOPICS = [
  "Memory Loss", "Behavior/Anger", "Fatigue", "Seizures", 
  "Sleep Issues", "Return to Work", "School/Education", 
  "Legal/Financial", "Hospital Discharge", "Rehab Access",
  "Depression/Anxiety", "Social Isolation"
];

const COMMON_DIAGNOSES = [
  "Anti-NMDAR", "HSV Encephalitis", "LGI1 Antibody", 
  "Autoimmune (Unspecified)", "Viral (Unspecified)", "ADEM"
];

// --- Sub-components ---

interface OptionCardProps {
    selected: boolean;
    onClick: () => void;
    icon?: React.ElementType;
    label: string;
    shortcut?: string;
    subLabel?: string;
}

const OptionCard: React.FC<OptionCardProps> = ({ selected, onClick, icon: Icon, label, shortcut, subLabel }) => (
    <button
        onClick={onClick}
        className={`relative group w-full text-left p-4 rounded-2xl border transition-all duration-200 ease-out h-full
        ${selected 
            ? 'border-rose-500 bg-rose-50 ring-1 ring-rose-500 shadow-md' 
            : 'border-slate-200 bg-white hover:border-rose-300 hover:shadow-md hover:-translate-y-0.5'
        }`}
    >
        <div className="flex items-start gap-3">
            {Icon && (
                <div className={`p-2.5 rounded-xl transition-colors shrink-0 ${selected ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-rose-100 group-hover:text-rose-600'}`}>
                    <Icon className="w-5 h-5" />
                </div>
            )}
            <div className="flex-grow">
                <span className={`font-bold block ${selected ? 'text-rose-900' : 'text-slate-900'}`}>{label}</span>
                {subLabel && <span className="text-xs text-slate-500 mt-1 block leading-tight">{subLabel}</span>}
            </div>
        </div>
        {shortcut && (
            <div className={`absolute top-3 right-3 text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded border shadow-sm uppercase ${selected ? 'border-rose-200 text-rose-700 bg-white' : 'border-slate-200 text-slate-400 bg-slate-50'}`}>
                {shortcut}
            </div>
        )}
    </button>
);

const ResourceCard = ({ resource, selected, onToggle }: { resource: Resource, selected: boolean, onToggle: () => void }) => {
    const Icon = resource.type === 'Video' ? Video : resource.type === 'PDF' ? FileText : resource.type === 'Book' ? BookOpen : Globe;
    
    return (
        <div 
            onClick={onToggle}
            className={`
                relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col h-full
                ${selected 
                    ? 'border-rose-500 bg-rose-50/30 shadow-md ring-1 ring-rose-500/20' 
                    : 'border-slate-100 bg-white hover:border-rose-200 hover:shadow-lg hover:-translate-y-1'
                }
            `}
        >
            <div className="flex justify-between items-start mb-3">
                <div className={`
                    flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider
                    ${resource.type === 'Video' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}
                `}>
                    <Icon className="w-3 h-3" />
                    {resource.type}
                </div>
                <div className={`
                    w-6 h-6 rounded-full flex items-center justify-center transition-all
                    ${selected ? 'bg-rose-500 text-white scale-110' : 'bg-slate-100 text-slate-300'}
                `}>
                    {selected && <CheckCircle className="w-4 h-4" />}
                </div>
            </div>

            <h4 className={`font-bold text-lg mb-2 leading-tight ${selected ? 'text-rose-900' : 'text-slate-900'}`}>
                {resource.title}
            </h4>
            
            <p className="text-slate-500 text-sm leading-relaxed mb-4 flex-grow">
                {resource.excerpt}
            </p>

            <div className="mt-auto pt-4 border-t border-slate-100/50 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    {resource.timeToRead}
                </div>
                {selected && (
                    <span className="text-xs font-bold text-rose-600 animate-fadeIn">Selected</span>
                )}
            </div>
            
            {/* Context Badge */}
            <div className="absolute -top-3 left-4 bg-teal-50 border border-teal-100 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                {resource.matchReason}
            </div>
        </div>
    );
};

export default function App() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDbOpen, setIsDbOpen] = useState(false);
  const [intakeMode, setIntakeMode] = useState<'RAPID' | 'DETAILED'>('RAPID');
  
  const filteredProfiles = searchTerm 
    ? MOCK_PROFILES.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Keyboard Shortcuts for Intake
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (state.step !== 'INTAKE') return;
          // Don't trigger if user is typing in a field
          if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

          switch(e.key.toLowerCase()) {
              case '1': updateForm('role', 'Patient'); break;
              case '2': updateForm('role', 'Caregiver'); break;
              case '3': updateForm('role', 'Professional'); break;
              case '4': updateForm('role', 'Bereaved'); break;
              
              case 'a': updateForm('stage', 'Acute Hospital'); break;
              case 'b': updateForm('stage', 'Early Recovery'); break;
              case 'c': updateForm('stage', 'Long-term Management'); break;
              case 'd': updateForm('stage', 'Bereavement'); break;
              default: break;
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.step]);

  const handleFileLoaded = (content: string, name: string) => {
    setState(prev => ({ ...prev, jsonFileContent: content, jsonFileName: name, error: null }));
  };

  const selectProfile = (profile: MockProfile, source: 'CRM' | 'INBOX' = 'CRM') => {
    setState(prev => ({ 
      ...prev, 
      isLoading: true,
      loadingMessage: source === 'INBOX' 
        ? `Importing chat session from ${profile.name}...` 
        : `Syncing ${profile.name} from Beacon CRM...`
    }));

    setTimeout(() => {
      setState(prev => ({
        ...prev,
        isLoading: false,
        step: 'INTAKE',
        formData: {
          name: profile.name,
          role: profile.role,
          diagnosis: profile.diagnosis,
          stage: profile.stage,
          concerns: profile.recentNotes
        }
      }));
    }, 800);
  };

  const createNewProfile = () => {
    setState(prev => ({
      ...prev,
      step: 'INTAKE',
      formData: { name: searchTerm, role: '', diagnosis: '', stage: '', concerns: '' }
    }));
  };

  const updateForm = (field: string, value: string) => {
    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, [field]: value }
    }));
  };

  const toggleTopic = (topic: string) => {
      const current = state.formData.concerns;
      const parts = current.split(', ').filter(p => p.trim() !== '');
      
      if (parts.includes(topic)) {
          // Remove
          const newParts = parts.filter(p => p !== topic);
          updateForm('concerns', newParts.join(', '));
      } else {
          // Add
          const newText = current ? `${current}, ${topic}` : topic;
          updateForm('concerns', newText);
      }
  };

  // STEP 2 -> 3: Get Resources
  const handleSuggestResources = async () => {
    const { name, role, diagnosis, stage, concerns } = state.formData;
    const promptString = `${name}, ${role}. Diagnosis: ${diagnosis}. Stage: ${stage}. Key Concerns: ${concerns}`;

    setState(prev => ({ 
        ...prev, 
        isLoading: true, 
        loadingMessage: 'Analyzing profile & retrieving resources...', 
        error: null 
    }));

    try {
      const resources = await suggestResources(promptString, state.jsonFileContent);
      setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          suggestedResources: resources, 
          selectedResourceIds: resources.slice(0, 3).map(r => r.id), // Select first 3 by default
          step: 'SELECTION' 
      }));
    } catch (err: any) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: err.message || "Could not retrieve resources." 
      }));
    }
  };

  const toggleResource = (id: string) => {
      setState(prev => {
          const current = prev.selectedResourceIds;
          const updated = current.includes(id) 
            ? current.filter(rid => rid !== id)
            : [...current, id];
          return { ...prev, selectedResourceIds: updated };
      });
  };

  // STEP 3 -> 4: Generate Email
  const handleGenerateDraft = async () => {
      const { name, role, diagnosis, stage, concerns } = state.formData;
      const promptString = `${name}, ${role}. Diagnosis: ${diagnosis}. Stage: ${stage}. Key Concerns: ${concerns}`;
      
      const selectedResources = state.suggestedResources.filter(r => state.selectedResourceIds.includes(r.id));

      setState(prev => ({ 
          ...prev, 
          isLoading: true, 
          loadingMessage: 'Drafting modular response kit...', 
          error: null 
      }));

      try {
        const draft = await generateDraft(promptString, selectedResources);
        setState(prev => ({ ...prev, isLoading: false, response: draft, step: 'RESULT' }));
      } catch (err: any) {
        setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: err.message || "Could not generate draft." 
        }));
      }
  };

  const resetFlow = () => {
    setState(prev => ({
        ...prev,
        step: 'SEARCH',
        response: null,
        formData: INITIAL_STATE.formData,
        suggestedResources: [],
        selectedResourceIds: [],
        error: null
    }));
    setSearchTerm('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      
      {/* --- HEADER --- */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={resetFlow}>
            <div className="bg-slate-900 p-2.5 rounded-xl shadow-lg shadow-slate-900/10 group-hover:scale-105 transition-transform">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">Encephalitis<span className="text-rose-600">.</span>Workbench</h1>
              <span className="text-xs font-medium text-slate-500 tracking-wide uppercase mt-1 block">Staff Response Tool</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-500">
                  <span>Step:</span>
                  <span className={`font-bold ${state.step === 'SEARCH' ? 'text-rose-600' : ''}`}>Search</span>
                  <ArrowRight className="w-3 h-3 text-slate-300" />
                  <span className={`font-bold ${state.step === 'INTAKE' ? 'text-rose-600' : ''}`}>Intake</span>
                  <ArrowRight className="w-3 h-3 text-slate-300" />
                  <span className={`font-bold ${state.step === 'SELECTION' ? 'text-rose-600' : ''}`}>Resources</span>
                  <ArrowRight className="w-3 h-3 text-slate-300" />
                  <span className={`font-bold ${state.step === 'RESULT' ? 'text-rose-600' : ''}`}>Draft</span>
              </div>
              
              {/* Database Trigger Button */}
              <button 
                onClick={() => setIsDbOpen(true)}
                className={`p-2 rounded-lg transition-colors border ${state.jsonFileName ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300'}`}
                title="Upload Knowledge Base"
              >
                  <Database className="w-5 h-5" />
              </button>
          </div>
        </div>
      </header>

      {/* --- DRAWER --- */}
      {isDbOpen && (
        <div className="bg-white border-b border-slate-200 p-8 shadow-xl relative z-30 animate-in slide-in-from-top-4">
            <div className="max-w-xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-900 text-lg">System Configuration</h3>
                    <button onClick={() => setIsDbOpen(false)} className="text-slate-400 hover:text-rose-600 transition-colors">Close</button>
                </div>
                <FileUploader onFileLoaded={handleFileLoaded} fileName={state.jsonFileName} />
            </div>
        </div>
      )}

      {/* --- MAIN CONTENT --- */}
      <main className="flex-grow flex flex-col items-center justify-start pt-10 pb-20 px-4">
        
        {/* Loading Overlay */}
        {state.isLoading && (
            <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-in fade-in duration-500">
                <div className="p-8 flex flex-col items-center max-w-sm w-full text-center">
                    <div className="relative mb-8">
                        <div className="w-20 h-20 border-4 border-slate-100 rounded-full"></div>
                        <div className="w-20 h-20 border-4 border-rose-600 rounded-full border-t-transparent absolute top-0 animate-spin"></div>
                        <BrainCircuit className="w-8 h-8 text-slate-900 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Processing</h3>
                    <p className="text-slate-500">{state.loadingMessage}</p>
                </div>
            </div>
        )}

        {/* STEP 1: CRM SEARCH */}
        {state.step === 'SEARCH' && (
            <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="text-center mb-8">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">Who are we helping today?</h2>
                    <p className="text-slate-500 text-lg">Manage incoming requests or search the CRM.</p>
                </div>
                
                {/* --- IN TRAY SECTION --- */}
                {!searchTerm && (
                    <div className="mb-10">
                        <div className="flex items-center gap-2 mb-4">
                             <div className="bg-rose-100 text-rose-600 p-1.5 rounded-lg">
                                <Inbox className="w-5 h-5" />
                             </div>
                             <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">In Tray / Web Enquiries</h3>
                             <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{MOCK_INBOX.length} New</span>
                        </div>
                        
                        <div className="space-y-3">
                            {MOCK_INBOX.map((item) => (
                                <div 
                                    key={item.id}
                                    onClick={() => selectProfile(item, 'INBOX')}
                                    className="bg-white p-5 rounded-2xl border-l-4 border-rose-500 border-y border-r border-slate-100 shadow-sm hover:shadow-md cursor-pointer transition-all hover:translate-x-1 group relative overflow-hidden"
                                >
                                    <div className="flex justify-between items-start mb-2 relative z-10">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-900 text-lg group-hover:text-rose-600 transition-colors">{item.name}</span>
                                            <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase">{item.role}</span>
                                        </div>
                                        <span className="text-xs font-bold text-rose-500 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {item.lastContact}
                                        </span>
                                    </div>
                                    <p className="text-slate-600 text-sm mb-3 line-clamp-2 pr-8">{item.recentNotes}</p>
                                    <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                                        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Chatbot Session</span>
                                        <span>•</span>
                                        <span>{item.diagnosis}</span>
                                    </div>
                                    <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-rose-50 text-rose-600 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                                        Action <ArrowRight className="w-3 h-3" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="relative group mb-8">
                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                        <Search className="h-6 w-6 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-16 pr-6 py-6 bg-white border border-slate-200 rounded-full text-xl placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 shadow-xl shadow-slate-200/40 transition-all"
                        placeholder="Search CRM name, email, or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus={false} 
                    />
                </div>

                {/* Results List */}
                {(searchTerm || filteredProfiles.length > 0) ? (
                    <div className="space-y-3">
                        {filteredProfiles.length > 0 ? (
                            filteredProfiles.map(profile => (
                                <button
                                    key={profile.id}
                                    onClick={() => selectProfile(profile)}
                                    className="w-full bg-white p-4 rounded-2xl border border-slate-100 hover:border-rose-200 hover:shadow-lg hover:scale-[1.01] transition-all flex items-center justify-between text-left group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 group-hover:bg-rose-100 group-hover:text-rose-600 transition-colors">
                                            <User className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-lg">{profile.name}</h4>
                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium text-xs uppercase">{profile.role}</span>
                                                <span>•</span>
                                                <span>{profile.diagnosis}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-rose-400" />
                                </button>
                            ))
                        ) : (
                            <button 
                                onClick={createNewProfile}
                                className="w-full p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl hover:border-rose-400 hover:bg-rose-50/30 transition-all group"
                            >
                                <p className="text-slate-900 font-bold text-lg mb-1">Create new case for "{searchTerm}"</p>
                                <p className="text-rose-600 text-sm font-medium flex items-center justify-center gap-1 group-hover:gap-2 transition-all">
                                    Start Intake <ArrowRight className="w-4 h-4" />
                                </p>
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="mt-12">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-px bg-slate-200 flex-grow"></div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Activity</span>
                            <div className="h-px bg-slate-200 flex-grow"></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {MOCK_PROFILES.slice(0, 4).map(p => (
                                <div key={p.id} onClick={() => selectProfile(p)} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md cursor-pointer transition-all hover:border-rose-200 group">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className={`text-[10px] font-bold uppercase tracking-wider py-1 px-2 rounded-lg ${
                                            p.role === 'Patient' ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                            {p.role}
                                        </div>
                                        <span className="text-xs text-slate-400">{p.lastContact}</span>
                                    </div>
                                    <h4 className="font-bold text-slate-900 group-hover:text-rose-700 transition-colors">{p.name}</h4>
                                    <p className="text-sm text-slate-500 truncate">{p.diagnosis}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* STEP 2: INTAKE (Dual Mode) */}
        {state.step === 'INTAKE' && (
            <div className="w-full max-w-5xl animate-in fade-in slide-in-from-right-12 duration-500">
                
                {/* Navigation & Mode Toggle */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                     <button 
                        onClick={() => setState(prev => ({ ...prev, step: 'SEARCH' }))}
                        className="flex items-center text-sm font-medium text-slate-500 hover:text-rose-600 transition-colors px-2 self-start md:self-auto"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Search
                    </button>

                    <div className="bg-slate-200 p-1 rounded-xl flex items-center">
                        <button 
                            onClick={() => setIntakeMode('RAPID')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${intakeMode === 'RAPID' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Zap className="w-4 h-4" /> Rapid Triage
                        </button>
                        <button 
                             onClick={() => setIntakeMode('DETAILED')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${intakeMode === 'DETAILED' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <FileEdit className="w-4 h-4" /> Detailed Notes
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
                    
                    {/* Common Header: Name */}
                    <div className="p-8 pb-4 border-b border-slate-100 bg-slate-50/50">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Patient / Caller Name</label>
                        <input 
                            type="text" 
                            value={state.formData.name}
                            onChange={(e) => updateForm('name', e.target.value)}
                            className="w-full px-0 py-2 bg-transparent border-0 border-b-2 border-slate-200 text-3xl font-bold text-slate-900 placeholder:text-slate-300 focus:ring-0 focus:border-rose-500 transition-all"
                            placeholder="Enter Name..."
                            autoFocus
                        />
                    </div>

                    {/* MODE SPECIFIC CONTENT */}
                    <div className="p-8">
                        
                        {intakeMode === 'RAPID' ? (
                            // --- RAPID MODE ---
                            <div className="space-y-10">
                                
                                {/* 1. Role */}
                                <div>
                                    <div className="flex justify-between items-end mb-4">
                                        <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                            <User className="w-4 h-4 text-rose-500" /> Who is the inquirer?
                                        </label>
                                        <div className="hidden md:flex gap-2 text-[10px] text-slate-400 font-mono border border-slate-100 px-2 py-1 rounded">
                                            <span>Press 1-4</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <OptionCard label="Patient" icon={User} selected={state.formData.role === 'Patient'} onClick={() => updateForm('role', 'Patient')} shortcut="1" />
                                        <OptionCard label="Caregiver" icon={Heart} selected={state.formData.role === 'Caregiver'} onClick={() => updateForm('role', 'Caregiver')} shortcut="2" />
                                        <OptionCard label="Professional" icon={Stethoscope} selected={state.formData.role === 'Professional'} onClick={() => updateForm('role', 'Professional')} shortcut="3" />
                                        <OptionCard label="Bereaved" icon={Activity} selected={state.formData.role === 'Bereaved'} onClick={() => updateForm('role', 'Bereaved')} shortcut="4" />
                                    </div>
                                </div>

                                {/* 2. Stage */}
                                <div>
                                     <div className="flex justify-between items-end mb-4">
                                        <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-rose-500" /> Current Stage?
                                        </label>
                                        <div className="hidden md:flex gap-2 text-[10px] text-slate-400 font-mono border border-slate-100 px-2 py-1 rounded">
                                            <span>Press A-D</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <OptionCard label="Acute Hospital" subLabel="ICU/Ward" selected={state.formData.stage === 'Acute Hospital'} onClick={() => updateForm('stage', 'Acute Hospital')} shortcut="A" />
                                        <OptionCard label="Early Recovery" subLabel="Home <1yr" selected={state.formData.stage === 'Early Recovery'} onClick={() => updateForm('stage', 'Early Recovery')} shortcut="B" />
                                        <OptionCard label="Long-term" subLabel=">1yr Mgmt" selected={state.formData.stage === 'Long-term Management'} onClick={() => updateForm('stage', 'Long-term Management')} shortcut="C" />
                                        <OptionCard label="Bereavement" subLabel="Loss Support" selected={state.formData.stage === 'Bereavement'} onClick={() => updateForm('stage', 'Bereavement')} shortcut="D" />
                                    </div>
                                </div>

                                {/* 3. Diagnosis (Chips) */}
                                <div>
                                    <label className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                                        <Activity className="w-4 h-4 text-rose-500" /> Diagnosis
                                    </label>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {COMMON_DIAGNOSES.map(d => (
                                            <button 
                                                key={d}
                                                onClick={() => updateForm('diagnosis', d)}
                                                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${state.formData.diagnosis === d ? 'bg-teal-500 text-white border-teal-500' : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300'}`}
                                            >
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                    <input 
                                        type="text" 
                                        value={state.formData.diagnosis}
                                        onChange={(e) => updateForm('diagnosis', e.target.value)}
                                        placeholder="Or type specific diagnosis..."
                                        className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                                    />
                                </div>

                                {/* 4. Concerns (Grid) */}
                                <div>
                                    <label className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                                        <AlertCircle className="w-4 h-4 text-rose-500" /> Key Concerns
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {COMMON_TOPICS.map(topic => {
                                            const isActive = state.formData.concerns.includes(topic);
                                            return (
                                                <button 
                                                    key={topic}
                                                    onClick={() => toggleTopic(topic)}
                                                    className={`
                                                        p-3 rounded-xl border text-left text-sm font-semibold transition-all flex items-center justify-between
                                                        ${isActive ? 'bg-rose-50 border-rose-400 text-rose-900' : 'bg-white border-slate-200 text-slate-600 hover:border-rose-200 hover:bg-slate-50'}
                                                    `}
                                                >
                                                    {topic}
                                                    {isActive && <CheckCircle className="w-4 h-4 text-rose-500" />}
                                                </button>
                                            )
                                        })}
                                    </div>
                                    <textarea 
                                        value={state.formData.concerns}
                                        onChange={(e) => updateForm('concerns', e.target.value)}
                                        placeholder="Add other specific notes..."
                                        className="w-full mt-4 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm min-h-[80px]"
                                    />
                                </div>

                            </div>
                        ) : (
                            // --- DETAILED MODE ---
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                <div className="md:col-span-4 space-y-6">
                                     {/* Role Select */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Role</label>
                                        <select 
                                            value={state.formData.role} 
                                            onChange={(e) => updateForm('role', e.target.value)}
                                            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                                        >
                                            <option value="">Select Role...</option>
                                            <option value="Patient">Patient</option>
                                            <option value="Caregiver">Caregiver</option>
                                            <option value="Professional">Professional</option>
                                            <option value="Bereaved">Bereaved</option>
                                        </select>
                                    </div>

                                    {/* Stage Select */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Stage</label>
                                        <select 
                                            value={state.formData.stage} 
                                            onChange={(e) => updateForm('stage', e.target.value)}
                                            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                                        >
                                            <option value="">Select Stage...</option>
                                            <option value="Acute Hospital">Acute Hospital</option>
                                            <option value="Early Recovery">Early Recovery</option>
                                            <option value="Long-term Management">Long-term Management</option>
                                            <option value="Bereavement">Bereavement</option>
                                        </select>
                                    </div>

                                    {/* Diagnosis Input */}
                                     <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Diagnosis</label>
                                        <input 
                                            type="text" 
                                            value={state.formData.diagnosis}
                                            onChange={(e) => updateForm('diagnosis', e.target.value)}
                                            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                                            placeholder="e.g. Anti-NMDAR"
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-8 flex flex-col h-full">
                                    <label className="text-sm font-bold text-slate-700 mb-2">Detailed Clinical Notes</label>
                                    <textarea 
                                        value={state.formData.concerns}
                                        onChange={(e) => updateForm('concerns', e.target.value)}
                                        className="w-full flex-grow min-h-[300px] p-5 bg-yellow-50/50 border border-yellow-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-yellow-400 focus:border-transparent leading-relaxed"
                                        placeholder="Paste full email content, call logs, or detailed symptom descriptions here..."
                                    />
                                </div>
                            </div>
                        )}

                        <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end">
                            <button 
                                    onClick={handleSuggestResources}
                                    disabled={!state.formData.name || !state.formData.concerns || !state.formData.role}
                                    className={`
                                    group relative overflow-hidden px-8 py-4 rounded-full font-bold text-white shadow-xl transition-all transform active:scale-[0.98]
                                    ${(!state.formData.name || !state.formData.concerns || !state.formData.role)
                                    ? 'bg-slate-300 cursor-not-allowed shadow-none'
                                    : 'bg-slate-900 hover:bg-slate-800 hover:shadow-2xl hover:shadow-slate-900/30'}
                                    `}
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-rose-400" />
                                    Retrieve Resources
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-6 text-slate-400 text-xs">
                    {intakeMode === 'RAPID' && (
                        <p className="flex justify-center items-center gap-4">
                            <span className="flex items-center gap-1"><Keyboard className="w-3 h-3" /> Shortcuts:</span>
                            <span><b>1-4</b> for Role</span>
                            <span>•</span>
                            <span><b>A-D</b> for Stage</span>
                        </p>
                    )}
                </div>
            </div>
        )}

        {/* STEP 3: HUMAN-IN-THE-LOOP RESOURCE SELECTION */}
        {state.step === 'SELECTION' && (
            <div className="w-full max-w-7xl animate-in fade-in slide-in-from-right-12 duration-500">
                <div className="flex justify-between items-center mb-8 px-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Curate Support Pack</h2>
                        <p className="text-slate-500">Select relevant resources for {state.formData.name}.</p>
                    </div>
                     <button 
                        onClick={() => setState(prev => ({ ...prev, step: 'INTAKE' }))}
                        className="flex items-center text-sm font-medium text-slate-500 hover:text-rose-600 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Modify Profile
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24 px-4">
                    {state.suggestedResources.map(resource => (
                        <div key={resource.id} className="h-full">
                            <ResourceCard 
                                resource={resource} 
                                selected={state.selectedResourceIds.includes(resource.id)}
                                onToggle={() => toggleResource(resource.id)}
                            />
                        </div>
                    ))}
                </div>

                {/* Floating Action Bar */}
                <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 p-6 z-40">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <div className="text-sm">
                            <span className="font-bold text-slate-900">{state.selectedResourceIds.length} resources</span> selected
                        </div>
                         <button 
                             onClick={handleGenerateDraft}
                             disabled={state.selectedResourceIds.length === 0}
                             className={`
                                px-8 py-3 rounded-full font-bold text-white shadow-lg flex items-center gap-2 transition-all
                                ${state.selectedResourceIds.length === 0
                                ? 'bg-slate-300 cursor-not-allowed'
                                : 'bg-rose-600 hover:bg-rose-700 hover:shadow-rose-500/30 hover:-translate-y-0.5'}
                             `}
                        >
                            <Mail className="w-5 h-5" />
                            Generate Response Kit
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* STEP 4: RESULT */}
        {state.step === 'RESULT' && (
            <div className="w-full max-w-5xl h-full flex flex-col animate-in fade-in zoom-in-95 duration-500">
                <button 
                    onClick={() => setState(prev => ({ ...prev, step: 'SELECTION' }))}
                    className="mb-4 self-start flex items-center text-sm font-medium text-slate-500 hover:text-rose-600 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Resources
                </button>
                
                <div className="flex-grow rounded-3xl shadow-2xl shadow-slate-200/60 overflow-hidden border border-slate-100 bg-white min-h-[600px]">
                    <OutputSection 
                        content={state.response} 
                        resources={state.suggestedResources.filter(r => state.selectedResourceIds.includes(r.id))}
                        isLoading={state.isLoading} 
                        onReset={resetFlow}
                    />
                </div>
            </div>
        )}

        {/* Error Toast */}
        {state.error && (
            <div className="fixed bottom-8 right-8 bg-white text-rose-700 p-4 rounded-2xl border border-rose-100 shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-5 z-50">
                <div className="bg-rose-100 p-2 rounded-full">
                    <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                    <p className="font-bold text-sm">Error</p>
                    <p className="text-sm text-rose-600/80">{state.error}</p>
                </div>
                <button onClick={() => setState(prev => ({...prev, error: null}))} className="ml-2 hover:bg-rose-50 p-1 rounded-full">
                    ×
                </button>
            </div>
        )}
      </main>
    </div>
  );
}