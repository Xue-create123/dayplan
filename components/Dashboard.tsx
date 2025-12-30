import React, { useState, useMemo } from 'react';
import { Task, TaskTag, Subtask } from '../types';
import { Play, CheckCircle, Clock, TrendingUp, AlertCircle, Plus, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Trash2, Newspaper } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface DashboardProps {
  tasks: Task[];
  dateStr: string;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  newsContent: string;
  onUpdateTask: (task: Task) => void;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'deferredCount' | 'status' | 'date'>) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
    tasks, dateStr, selectedDate, onDateChange, newsContent, onUpdateTask, onAddTask 
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState(30);
  const [newTaskTag, setNewTaskTag] = useState<TaskTag>('Work');
  const [newSubtasks, setNewSubtasks] = useState<{title: string, duration: number}[]>([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [subtaskDurationInput, setSubtaskDurationInput] = useState<string>('');

  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [isNewsExpanded, setIsNewsExpanded] = useState(false);

  const newsData = useMemo(() => {
    const lines = newsContent.split('\n').filter(l => l.trim() !== '');
    return {
        headline: lines[0] || '正在为您梳理经济动态...',
        summary: lines[1] || '请稍候，AI 正在同步全球资讯。',
        insight: lines.slice(2).join(' ') || '保持敏锐的洞察力。'
    };
  }, [newsContent]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, progress };
  }, [tasks]);

  const toggleTaskStatus = (task: Task) => {
    if (task.status === 'completed') {
        onUpdateTask({ ...task, status: 'pending', actualEndTime: undefined });
    } else {
        onUpdateTask({ ...task, status: 'completed', actualEndTime: Date.now() });
    }
  };

  const handleStartTask = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateTask({ ...task, status: 'in-progress', actualStartTime: Date.now() });
  };

  const toggleSubtask = (task: Task, subtaskId: string) => {
    const updatedSubtasks = task.subtasks?.map(st => 
        st.id === subtaskId ? { ...st, isCompleted: !st.isCompleted } : st
    );
    onUpdateTask({ ...task, subtasks: updatedSubtasks });
  };

  const toggleExpand = (taskId: string) => {
    const newSet = new Set(expandedTasks);
    if (newSet.has(taskId)) {
        newSet.delete(taskId);
    } else {
        newSet.add(taskId);
    }
    setExpandedTasks(newSet);
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    const formattedSubtasks: Subtask[] | undefined = newSubtasks.length > 0 
        ? newSubtasks.map(st => ({
            id: crypto.randomUUID(),
            title: st.title,
            duration: st.duration > 0 ? st.duration : undefined,
            isCompleted: false
        })) 
        : undefined;

    onAddTask({
      title: newTaskTitle,
      estimatedDuration: Number(newTaskDuration),
      tag: newTaskTag,
      subtasks: formattedSubtasks
    });

    setNewTaskTitle('');
    setNewSubtasks([]);
    setShowAddModal(false);
  };

  const getTagColor = (tag: TaskTag) => {
    switch (tag) {
      case 'Work': return 'bg-indigo-100 text-indigo-700';
      case 'Study': return 'bg-amber-100 text-amber-700';
      case 'Life': return 'bg-emerald-100 text-emerald-700';
      case 'Health': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="flex flex-col h-full pb-20">
      {/* 1. Header with News Banner */}
      <div className="bg-white px-6 py-6 rounded-3xl shadow-sm border border-slate-100 z-10 mb-6">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
                <button onClick={() => onDateChange(addDays(selectedDate, -1))} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                    <ChevronLeft size={24} className="text-slate-400" />
                </button>
                <div className="text-center">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                        {format(selectedDate, 'MM月dd日', { locale: zhCN })}
                    </h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                        {format(selectedDate, 'EEEE', { locale: zhCN })}
                    </p>
                </div>
                <button onClick={() => onDateChange(addDays(selectedDate, 1))} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                    <ChevronRight size={24} className="text-slate-400" />
                </button>
            </div>
            
            <div className="hidden sm:block text-right">
                <div className="text-3xl font-black text-slate-900 leading-none">{stats.progress}%</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Daily Target</div>
            </div>
        </div>

        {/* Economic News Banner */}
        <div 
            className={`
                overflow-hidden transition-all duration-500 ease-in-out bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100 group
                ${isNewsExpanded ? 'max-h-96 ring-2 ring-slate-900 ring-offset-2' : 'max-h-16'}
            `}
            onClick={() => setIsNewsExpanded(!isNewsExpanded)}
        >
            <div className="flex items-center justify-between px-4 h-16">
                <div className="flex items-center gap-4 overflow-hidden">
                    <div className="bg-slate-900 p-2 rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                        <TrendingUp size={18} className="text-white" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                         <span className="text-sm font-bold text-slate-900 truncate">{newsData.headline}</span>
                         {!isNewsExpanded && <span className="text-xs text-slate-500 truncate">{newsData.summary}</span>}
                    </div>
                </div>
                <div className="shrink-0 ml-4">
                    {isNewsExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                </div>
            </div>
            
            <div className={`px-6 pb-6 transition-all duration-500 ${isNewsExpanded ? 'opacity-100 mt-2' : 'opacity-0'}`}>
                <p className="text-sm leading-relaxed text-slate-600 mb-4">{newsData.summary}</p>
                <div className="bg-white p-4 rounded-xl border border-slate-200 border-l-4 border-l-slate-900">
                    <p className="text-xs font-bold text-slate-900 italic leading-relaxed">
                        “{newsData.insight}”
                    </p>
                </div>
            </div>
        </div>
      </div>

      {/* 2. Task List Area */}
      <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
        <div className="flex justify-between items-end mb-6">
            <div>
                <h2 className="text-xl font-black text-slate-900">今日行动</h2>
                <p className="text-sm font-medium text-slate-400">目前共有 {tasks.length} 项日程安排</p>
            </div>
            <button 
                onClick={() => setShowAddModal(true)}
                className="bg-slate-900 text-white p-2.5 rounded-xl hover:scale-105 transition-all shadow-lg"
            >
                <Plus size={24} />
            </button>
        </div>

        {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                <div className="bg-slate-50 p-6 rounded-full mb-4">
                    <Clock size={40} className="text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">准备好开始了吗？</h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto">
                    点击右侧加号或使用下方 AI 助手来为您规划第一项任务。
                </p>
            </div>
        ) : (
            <div className="space-y-4">
                {tasks.map(task => {
                    const isExpanded = expandedTasks.has(task.id);
                    const isCompleted = task.status === 'completed';
                    
                    return (
                        <div key={task.id} className={`bg-white rounded-2xl border border-slate-100 shadow-sm transition-all overflow-hidden ${isCompleted ? 'bg-slate-50/50' : ''}`}>
                            <div className="p-5 flex items-start gap-4">
                                <button 
                                    onClick={() => toggleTaskStatus(task)}
                                    className={`mt-1 transition-all shrink-0 ${isCompleted ? 'text-emerald-500' : 'text-slate-200 hover:text-slate-400'}`}
                                >
                                    <CheckCircle size={28} fill={isCompleted ? "currentColor" : "none"} />
                                </button>
                                
                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => task.subtasks && toggleExpand(task.id)}>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${getTagColor(task.tag)}`}>
                                            {task.tag}
                                        </span>
                                        {task.deferredCount > 0 && (
                                            <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                                                <AlertCircle size={10} /> 延期 {task.deferredCount}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className={`font-bold text-slate-900 leading-tight ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                                        {task.title}
                                    </h3>
                                    <div className="flex items-center gap-4 mt-3 text-xs font-bold text-slate-400 uppercase tracking-tighter">
                                        <span className="flex items-center gap-1"><Clock size={12} /> {task.estimatedDuration}min</span>
                                        {task.subtasks && <span>{task.subtasks.filter(s => s.isCompleted).length}/{task.subtasks.length} 子项</span>}
                                    </div>
                                </div>

                                {!isCompleted && task.status === 'pending' && (
                                    <button 
                                        onClick={(e) => handleStartTask(task, e)}
                                        className="bg-slate-900 text-white p-2 rounded-xl"
                                    >
                                        <Play size={16} fill="currentColor" />
                                    </button>
                                )}
                            </div>
                            
                            {task.subtasks && isExpanded && (
                                <div className="px-5 pb-5 pt-2 space-y-2 border-t border-slate-50 bg-slate-50/30">
                                    {task.subtasks.map(sub => (
                                        <div key={sub.id} className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-100">
                                            <button 
                                                onClick={() => toggleSubtask(task, sub.id)}
                                                className={`transition-colors ${sub.isCompleted ? 'text-emerald-500' : 'text-slate-200 hover:text-slate-300'}`}
                                            >
                                                <CheckCircle size={18} fill={sub.isCompleted ? "currentColor" : "none"} />
                                            </button>
                                            <span className={`text-sm font-medium ${sub.isCompleted ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                                {sub.title}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        )}
      </div>

      {/* Manual Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="text-xl font-black text-slate-900">手动添加计划</h3>
                </div>
                <form onSubmit={handleManualAdd} className="p-6 space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">任务名称</label>
                        <input 
                            autoFocus
                            className="w-full p-3 bg-slate-50 rounded-xl border border-transparent focus:border-slate-900 outline-none transition-all font-bold"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            placeholder="如：深入分析 Q3 营收报告"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">预计时长 (MIN)</label>
                            <input 
                                type="number"
                                className="w-full p-3 bg-slate-50 rounded-xl outline-none font-bold"
                                value={newTaskDuration}
                                onChange={(e) => setNewTaskDuration(Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">分类</label>
                            <select 
                                className="w-full p-3 bg-slate-50 rounded-xl outline-none font-bold appearance-none"
                                value={newTaskTag}
                                onChange={(e) => setNewTaskTag(e.target.value as TaskTag)}
                            >
                                <option value="Work">Work</option>
                                <option value="Study">Study</option>
                                <option value="Life">Life</option>
                                <option value="Health">Health</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 font-bold text-slate-400 hover:text-slate-600 transition-colors">取消</button>
                        <button className="flex-1 py-3 bg-slate-900 text-white rounded-2xl font-black shadow-xl">保存任务</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;