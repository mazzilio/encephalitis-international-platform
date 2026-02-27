import React from 'react';
import { CheckCircle, XCircle, Loader, Clock } from 'lucide-react';
import { ProcessingStatus } from '../../../shared/types';

interface ProcessListProps {
  items: ProcessingStatus[];
}

export const ProcessList: React.FC<ProcessListProps> = ({ items }) => {
  if (items.length === 0) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'error':
        return <XCircle size={16} className="text-red-500" />;
      case 'scraping':
      case 'classifying':
        return <Loader size={16} className="text-blue-500 animate-spin" />;
      default:
        return <Clock size={16} className="text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'error':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'scraping':
      case 'classifying':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Processing Queue</h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {items.map((item, index) => (
          <div
            key={index}
            className={`flex items-center gap-3 p-3 rounded-lg border ${getStatusColor(item.status)}`}
          >
            {getStatusIcon(item.status)}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono truncate">{item.url}</p>
              {item.error && (
                <p className="text-xs text-red-600 mt-1">{item.error}</p>
              )}
            </div>
            <span className="text-xs font-medium capitalize">{item.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
