import React, { useState, useMemo } from 'react';
import { Task, TaskTag, Subtask } from '../types';
import { Play, CheckCircle, Clock, TrendingUp, AlertCircle, Plus, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Trash2, Newspaper } from 'lucide-react';
import { format, addDays } from 'date-fns';
import zhCN from 'date-fns/locale/zh-CN';

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
  // Manual Add State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState(30);
  const [newTaskTag, setNewTaskTag] = useState<TaskTag>('Work');
  const [newSubtasks, setNewSubtasks] = useState<{title: string, duration: number}[]>([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [subtaskDurationInput, setSubtaskDurationInput] = useState<string>('');

  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [isNewsExpanded, setIsNewsExpanded] = useState(false);

  // Parse News Content
  const newsData = useMemo(() => {
    const lines = newsContent.split('\n').filter(l => l.trim() !== '');
    return {
        headline: lines[0] || '获取经济资讯中...',
        summary: lines[1] || '...',
        insight: lines.slice(2).join(' ') || ''
    };
  }, [newsContent]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, progress };
  }, [tasks]);

  // --- Actions ---

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

  const handleAddSubtaskToDraft = () => {
    if(!subtaskInput.trim()) return;
    setNewSubtasks(prev => [...prev, {
        title: subtaskInput, 
        duration: subtaskDurationInput ? parseInt(subtaskDurationInput) : 0 
    }]);
    setSubtaskInput('');
    setSubtaskDurationInput('');
  };

  const removeDraftSubtask = (idx: number) => {
    setNewSubtasks(prev => prev.filter((_, i) => i !== idx));
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    const formattedSubtasks: Subtask[] | undefined = newSubtasks.length > 0 
        ? newSubtasks.map(st => ({
            id: Date.now().toString() + Math.random(),
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

    // Reset
    setNewTaskTitle('');
    setNewSubtasks([]);
    setSubtaskInput('');
    setShowAddModal(false);
  };

  const getTagColor = (tag: TaskTag) => {
    switch (tag) {
      case 'Work': return 'bg-blue-100 text-blue-800';
      case 'Study': return 'bg-purple-100 text-purple-800';
      case 'Life': return 'bg-green-100 text-green-800';
      case 'Health': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex flex-col h-full pb-24">
      {/* 1. Header & Calendar (Centered) */}
      <div className="bg-white px-6 pt-6 pb-2 rounded-t-2xl shadow-sm border border-gray-100 z-10">
        <div className="flex flex-col items-center justify-center gap-3 mb-2">
            <div className="flex items-center gap-4 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                <button onClick={() => onDateChange(addDays(selectedDate, -1))} className="p-2 hover:bg-white rounded-lg text-gray-600 transition-all shadow-sm">
                    <ChevronLeft size={20} />
                </button>
                <div className="flex flex-col items-center px-4 cursor-pointer relative group">
                     {/* Hidden Date Input for picker functionality */}
                     <input 
                        type="date" 
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        value={format(selectedDate, 'yyyy-MM-dd')}
                        onChange={(e) => onDateChange(new Date(e.target.value))}
                    />
                    <span className="text-lg font-bold text-gray-900 leading-none">{format(selectedDate, 'MM月dd日', { locale: zhCN })}</span>
                    <span className="text-xs font-medium text-gray-500 uppercase">{format(selectedDate, 'EEEE', { locale: zhCN })}</span>
                </div>
                <button onClick={() => onDateChange(addDays(selectedDate, 1))} className="p-2 hover:bg-white rounded-lg text-gray-600 transition-all shadow-sm">
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>

        {/* Compact Economic News Banner */}
        <div 
            className={`
                mt-2 mb-4 overflow-hidden transition-all duration-300 ease-in-out bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100
                ${isNewsExpanded ? 'max-h-96' : 'max-h-12'}
            `}
            onClick={() => setIsNewsExpanded(!isNewsExpanded)}
        >
            <div className="flex items-center justify-between px-3 py-2.5">
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <div className="bg-blue-100 p-1 rounded-md shrink-0">
                        <TrendingUp size={16} className="text-blue-700" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                         <span className="text-xs font-bold text-slate-800 truncate">{newsData.headline}</span>
                         {!isNewsExpanded && <span className="text-[10px] text-slate-500 truncate">{newsData.summary}</span>}
                    </div>
                </div>
                { !isNewsExpanded && <ChevronDown size={14} className="text-slate-400 shrink-0 ml-2" /> }
                { isNewsExpanded && <ChevronUp size={14} className="text-slate-400 shrink-0 ml-2" /> }
            </div>
            
            <div className={`px-4 text-sm text-slate-600 border-t border-slate-200 transition-all duration-300 ${isNewsExpanded ? 'opacity-100 py-3' : 'opacity-0 py-0 h-0'}`}>
                <p className="mb-2 leading-relaxed text-slate-700">{newsData.summary}</p>
                <div className="flex items-start gap-2 bg-blue-50/50 p-2 rounded-md">
                    <Newspaper size={14} className="text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-800 font-medium italic">"{newsData.insight}"</p>
                </div>
            </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div 
                    className="bg-slate-900 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${stats.progress}%` }}
                ></div>
            </div>
            <div className="flex justify-between mt-1 text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                <span>今日进度</span>
                <span>{stats.progress}%</span>
            </div>
        </div>
      </div>

      {/* 2. Scrollable Action List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-0">
        <div className="flex justify-between items-center mb-4 px-2">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                行动清单 <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{tasks.length}</span>
            </h2>
            <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors text-xs font-bold uppercase tracking-wide shadow-sm"
            >
                <Plus size={14} /> 新建
            </button>
        </div>

        {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <CheckCircle size={32} className="text-gray-300" />
                </div>
                <p className="text-sm">今日暂无任务，享受当下或规划未来。</p>
            </div>
        ) : (
            <div className="space-y-3 pb-4">
                {tasks.map(task => {
                    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
                    const isExpanded = expandedTasks.has(task.id) || (hasSubtasks && task.status !== 'completed');
                    
                    return (
                    <div key={task.id} className={`bg-white rounded-xl border border-gray-100 shadow-sm transition-all hover:shadow-md group ${task.status === 'completed' ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                        <div className="p-4">
                            <div className="flex justify-between items-start">
                                <div className="flex-1 cursor-pointer min-w-0" onClick={() => hasSubtasks && toggleExpand(task.id)}>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${getTagColor(task.tag)}`}>
                                            {task.tag}
                                        </span>
                                        {task.deferredCount > 0 && (
                                            <span className="text-[10px] flex items-center gap-1 text-red-600 font-medium bg-red-50 px-1.5 py-0.5 rounded-md">
                                                <AlertCircle size={10} /> 延期 {task.deferredCount}次
                                            </span>
                                        )}
                                    </div>
                                    <h3 className={`font-semibold text-base leading-snug flex items-center gap-2 ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                        <span className="truncate">{task.title}</span>
                                        {hasSubtasks && (
                                            isExpanded ? <ChevronUp size={16} className="text-gray-400 shrink-0"/> : <ChevronDown size={16} className="text-gray-400 shrink-0"/>
                                        )}
                                    </h3>
                                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 font-medium">
                                        <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                            <Clock size={12} /> {task.estimatedDuration} min
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 ml-3 shrink-0">
                                    {task.status === 'pending' && (
                                        <button 
                                            onClick={(e) => handleStartTask(task, e)}
                                            className="p-2 text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors"
                                            title="开始任务"
                                        >
                                            <Play size={18} fill="currentColor" />
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => toggleTaskStatus(task)}
                                        className={`p-2 rounded-full transition-all duration-300 ${
                                            task.status === 'completed' 
                                            ? 'text-green-600 bg-green-100 ring-2 ring-green-200' 
                                            : task.status === 'in-progress' 
                                            ? 'text-green-600 bg-green-50 animate-pulse ring-1 ring-green-200'
                                            : 'text-gray-300 hover:text-green-500 hover:bg-gray-50'
                                        }`}
                                    >
                                        <CheckCircle size={22} fill={task.status === 'completed' ? "currentColor" : "none"} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        {/* Subtasks Section */}
                        {hasSubtasks && isExpanded && (
                            <div className="px-4 pb-3 pt-0">
                                <div className="space-y-1.5 pt-3 border-t border-dashed border-gray-200">
                                    {task.subtasks!.map(sub => (
                                        <div key={sub.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg group/sub transition-colors">
                                            <button 
                                                onClick={() => toggleSubtask(task, sub.id)}
                                                className={`transition-all duration-200 shrink-0 ${sub.isCompleted ? 'text-green-500 scale-110' : 'text-gray-300 hover:text-green-500'}`}
                                            >
                                                <CheckCircle size={16} fill={sub.isCompleted ? "currentColor" : "none"} />
                                            </button>
                                            <div className="flex-1 min-w-0 flex justify-between items-center gap-2">
                                                <span className={`text-sm truncate ${sub.isCompleted ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                                                    {sub.title}
                                                </span>
                                                {sub.duration && (
                                                     <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                                                        {sub.duration}m
                                                     </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )})}
            </div>
        )}
      </div>

      {/* Manual Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900">添加新任务</h3>
                </div>
                
                <div className="p-5 overflow-y-auto space-y-4">
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">任务标题</label>
                        <input 
                            type="text" 
                            required
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all outline-none"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            placeholder="例如：整理季度财务报表"
                        />
                    </div>
                    
                    <div className="flex gap-4">
                        <div className="flex-1 space-y-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">总时长 (分钟)</label>
                            <input 
                                type="number" 
                                required
                                min="5"
                                step="5"
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white outline-none"
                                value={newTaskDuration}
                                onChange={(e) => setNewTaskDuration(Number(e.target.value))}
                            />
                        </div>
                        <div className="flex-1 space-y-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">分类标签</label>
                            <select 
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white outline-none appearance-none"
                                value={newTaskTag}
                                onChange={(e) => setNewTaskTag(e.target.value as TaskTag)}
                            >
                                <option value="Work">Work</option>
                                <option value="Study">Study</option>
                                <option value="Life">Life</option>
                                <option value="Health">Health</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    {/* Subtasks Input Section */}
                    <div className="space-y-2 pt-2">
                         <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide flex justify-between">
                            <span>子任务拆分 (可选)</span>
                            <span className="text-slate-400 font-normal normal-case">拆分大任务</span>
                         </label>
                         
                         <div className="flex gap-2">
                             <input 
                                type="text"
                                className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:bg-white focus:ring-1 focus:ring-slate-300"
                                placeholder="子任务名称"
                                value={subtaskInput}
                                onChange={(e) => setSubtaskInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtaskToDraft())}
                             />
                             <input 
                                type="number"
                                className="w-20 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:bg-white focus:ring-1 focus:ring-slate-300"
                                placeholder="分钟"
                                value={subtaskDurationInput}
                                onChange={(e) => setSubtaskDurationInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtaskToDraft())}
                             />
                             <button 
                                type="button"
                                onClick={handleAddSubtaskToDraft}
                                className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
                             >
                                <Plus size={18} />
                             </button>
                         </div>

                         {/* Draft Subtasks List */}
                         {newSubtasks.length > 0 && (
                            <div className="space-y-1 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                {newSubtasks.map((st, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm p-1.5 bg-white rounded shadow-sm">
                                        <span className="truncate flex-1">{st.title}</span>
                                        <div className="flex items-center gap-2">
                                            {st.duration > 0 && <span className="text-xs text-gray-400 font-mono bg-gray-100 px-1 rounded">{st.duration}m</span>}
                                            <button onClick={() => removeDraftSubtask(idx)} className="text-red-400 hover:text-red-600">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                         )}
                    </div>
                </div>

                <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
                    <button 
                        type="button" 
                        onClick={() => setShowAddModal(false)}
                        className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-xl transition-colors"
                    >
                        取消
                    </button>
                    <button 
                        onClick={handleManualAdd}
                        className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-900/20"
                    >
                        确认添加
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;