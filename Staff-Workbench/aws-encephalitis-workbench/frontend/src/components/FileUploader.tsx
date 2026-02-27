import React, { useCallback } from 'react';
import { Upload, FileJson, CheckCircle, Database } from 'lucide-react';

interface FileUploaderProps {
  onFileLoaded: (content: string, name: string) => void;
  fileName: string | null;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileLoaded, fileName }) => {
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onFileLoaded(content, file.name);
    };
    reader.readAsText(file);
  }, [onFileLoaded]);

  return (
    <div className="w-full">
      <div className="relative group">
        <input
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div className={`
          border border-dashed rounded-2xl p-6 flex items-center justify-between transition-all duration-300
          ${fileName 
            ? 'border-teal-500 bg-teal-50/50' 
            : 'border-slate-300 bg-white hover:border-rose-400 hover:bg-slate-50 hover:shadow-sm'}
        `}>
          <div className="flex items-center gap-4">
             <div className={`p-3 rounded-full ${fileName ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>
                {fileName ? <Database className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
             </div>
             <div className="text-left">
                <p className={`text-sm font-semibold ${fileName ? 'text-teal-900' : 'text-slate-900'}`}>
                    {fileName ? 'Knowledge Base Active' : 'Upload Content Database'}
                </p>
                <p className="text-xs text-slate-500">
                    {fileName ? fileName : 'JSON files only'}
                </p>
             </div>
          </div>
          
          {fileName && <CheckCircle className="w-5 h-5 text-teal-500" />}
        </div>
      </div>
    </div>
  );
};

export default FileUploader;
