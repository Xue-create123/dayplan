import React from 'react';
import { X, MessageSquare, CheckCircle, Circle, BarChart3 } from 'lucide-react';
import { Task } from '../types';

interface DailyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewText: string;
  tasks: Task[]; // Tasks for the reviewed day
  onOpenChat: () => void;
  dateStr: string;
}

const DailyReviewModal: React.FC<DailyReviewModalProps> = ({ 
  isOpen, onClose, reviewText, tasks, onOpenChat, dateStr 
}) => {
  if (!isOpen) return null;

  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

  // Simple Markdown Renderer (Bold)
  const renderReviewText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
        }
        return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex justify-between items-center shrink-0">
          <div>
             <h2 className="text-2xl font-bold flex items-center gap-2">
                <BarChart3 size={24} /> {dateStr} 复盘报告
             </h2>
             <p className="text-slate-300 text-sm mt-1">回顾过去，优化未来</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X size={28} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-8">
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-green-600">{completionRate}%</span>
                    <span className="text-sm text-green-800 font-medium">任务完成率</span>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-blue-600">{completed}/{total}</span>
                    <span className="text-sm text-blue-800 font-medium">已完成任务</span>
                </div>
            </div>

            {/* AI Analysis */}
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">AI 导师分析</h3>
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {reviewText ? renderReviewText(reviewText) : "正在生成分析..."}
                </div>
            </div>

             {/* Unfinished Tasks List (if any) */}
             {tasks.some(t => t.status !== 'completed') && (
                <div>
                     <h3 className="text-lg font-bold text-gray-900 mb-3">待优化任务</h3>
                     <ul className="space-y-2">
                         {tasks.filter(t => t.status !== 'completed').map(t => (
                             <li key={t.id} className="flex items-center gap-2 text-gray-600 bg-white border border-gray-100 p-2 rounded-lg">
                                 <Circle size={16} />
                                 <span>{t.title}</span>
                             </li>
                         ))}
                     </ul>
                </div>
             )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
            <button 
                onClick={onClose}
                className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-xl transition-colors"
            >
                关闭
            </button>
            <button 
                onClick={() => {
                    onClose();
                    onOpenChat();
                }}
                className="px-5 py-2.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 flex items-center gap-2 shadow-lg shadow-slate-900/20 transition-all hover:scale-105"
            >
                <MessageSquare size={18} />
                深入讨论与调整
            </button>
        </div>
      </div>
    </div>
  );
};

export default DailyReviewModal;