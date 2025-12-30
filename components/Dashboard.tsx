import React, { useState, useMemo, useRef } from 'react';
import { Task, TaskTag, Subtask } from '../types';
import { Play, CheckCircle, Clock, Plus, ChevronLeft, ChevronRight, X, Edit2, Trash2, Calendar } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface DashboardProps {
  tasks: Task[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'deferredCount' | 'status' | 'date'>) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
    tasks, selectedDate, onDateChange, onUpdateTask, onDeleteTask, onAddTask 
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDuration, setTaskDuration] = useState(30);
  const [taskTag, setTaskTag] = useState<TaskTag>('Work');
  const [taskSubtasks, setTaskSubtasks] = useState<string[]>([]);
  const [currentSubtask, setCurrentSubtask] = useState('');
  
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const dateInputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    const totalMinutes = tasks.reduce((acc, t) => acc + (Number(t.estimatedDuration) || 0), 0);
    const completedMinutes = tasks
      .filter(t => t.status === 'completed')
      .reduce((acc, t) => acc + (Number(t.estimatedDuration) || 0), 0);
    const progress = totalMinutes === 0 ? 0 : Math.round((completedMinutes / totalMinutes) * 100);
    return { 
      total: tasks.length, 
      completed: tasks.filter(t => t.status === 'completed').length, 
      progress, 
      totalMinutes, 
      completedMinutes 
    };
  }, [tasks]);

  const toggleTaskStatus = (task: Task) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    onUpdateTask({ ...task, status: nextStatus, actualEndTime: nextStatus === 'completed' ? Date.now() : undefined });
  };

  const resetForm = () => {
    setTaskTitle('');
    setTaskDuration(30);
    setTaskTag('Work');
    setTaskSubtasks([]);
    setCurrentSubtask('');
    setEditingTask(null);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    
    if (editingTask) {
      onUpdateTask({
        ...editingTask,
        title: taskTitle,
        estimatedDuration: Number(taskDuration),
        tag: taskTag,
        subtasks: taskSubtasks.map((title, idx) => {
          const existing = editingTask.subtasks?.[idx];
          return {
            id: existing?.id || crypto.randomUUID(),
            title,
            isCompleted: existing?.isCompleted || false
          };
        })
      });
    } else {
      onAddTask({
        title: taskTitle,
        estimatedDuration: Number(taskDuration),
        tag: taskTag,
        subtasks: taskSubtasks.map(title => ({
          id: crypto.randomUUID(),
          title,
          isCompleted: false
        }))
      });
    }

    resetForm();
    setShowAddModal(false);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDuration(task.estimatedDuration);
    setTaskTag(task.tag);
    setTaskSubtasks(task.subtasks?.map(s => s.title) || []);
    setShowAddModal(true);
  };

  const addSubtaskInput = () => {
    if (currentSubtask.trim()) {
      setTaskSubtasks([...taskSubtasks, currentSubtask.trim()]);
      setCurrentSubtask('');
    }
  };

  const removeSubtaskInput = (index: number) => {
    setTaskSubtasks(taskSubtasks.filter((_, i) => i !== index));
  };

  const getTagColor = (tag: TaskTag) => {
    switch (tag) {
      case 'Work': return 'bg-slate-900 text-white';
      case 'Study': return 'bg-blue-50 text-blue-700';
      case 'Life': return 'bg-slate-100 text-slate-600';
      case 'Health': return 'bg-red-50 text-red-600';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  const triggerCalendar = () => {
    dateInputRef.current?.showPicker?.();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Date Header Section */}
      <div className="flex flex-col items-center mb-8 relative">
        <div className="flex items-center gap-8 mb-4">
          <button onClick={() => onDateChange(addDays(selectedDate, -1))} className="text-slate-300 hover:text-slate-900 transition-colors p-2">
            <ChevronLeft size={24} />
          </button>
          
          <div className="date-picker-wrapper group" onClick={triggerCalendar}>
            <input 
              ref={dateInputRef}
              type="date" 
              className="hidden-date-input"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => onDateChange(new Date(e.target.value))}
            />
            <div className="text-center group-hover:scale-105 transition-transform">
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-2">
                {format(selectedDate, 'MM月dd日', { locale: zhCN })}
                <Calendar size={18} className="text-slate-200 group-hover:text-slate-400" />
              </h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">
                {format(selectedDate, 'EEEE', { locale: zhCN })}
              </p>
            </div>
          </div>

          <button onClick={() => onDateChange(addDays(selectedDate, 1))} className="text-slate-300 hover:text-slate-900 transition-colors p-2">
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Progress Bar (Time Based) */}
        {stats.totalMinutes > 0 && (
          <>
            <div className="w-full max-w-[240px] h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-slate-900 transition-all duration-700 ease-out"
                style={{ width: `${stats.progress}%` }}
              />
            </div>
            <div className="flex gap-4 mt-2">
              <span className="text-[10px] font-bold text-slate-900 uppercase tracking-tighter">
                完成度 {stats.progress}%
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                {stats.completedMinutes} / {stats.totalMinutes} MIN
              </span>
            </div>
          </>
        )}
      </div>

      {/* Main Task List */}
      <div className="flex-1 px-4 sm:px-0">
        <div className="flex justify-between items-baseline mb-6">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">今日行动</h2>
          <div className="flex gap-2 text-[10px] font-bold text-slate-400">
             <span>{stats.completed}/{stats.total} 任务</span>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="py-20 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-center">
            <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">还没有任何计划</p>
            <button onClick={() => setShowAddModal(true)} className="mt-4 text-xs font-black text-slate-900 underline underline-offset-4">立即创建任务</button>
          </div>
        ) : (
          <div className="space-y-3 pb-32">
            {tasks.map(task => {
              const isExpanded = expandedTasks.has(task.id);
              const isCompleted = task.status === 'completed';
              
              return (
                <div key={task.id} className={`bg-white rounded-2xl border transition-all ${isCompleted ? 'border-slate-50 opacity-60' : 'border-slate-100 shadow-sm'}`}>
                  <div className="p-4 flex items-center gap-4">
                    <button onClick={() => toggleTaskStatus(task)} className={`shrink-0 transition-all ${isCompleted ? 'text-emerald-500' : 'text-slate-200 hover:text-slate-900'}`}>
                      <CheckCircle size={24} fill={isCompleted ? "currentColor" : "none"} />
                    </button>
                    
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => task.subtasks && task.subtasks.length > 0 && setExpandedTasks(new Set(isExpanded ? [...expandedTasks].filter(id => id !== task.id) : [...expandedTasks, task.id]))}>
                      <h3 className={`font-bold text-sm truncate ${isCompleted ? 'line-through text-slate-300' : 'text-slate-900'}`}>
                        {task.title}
                      </h3>
                      <div className="flex gap-2 mt-1">
                        <span className={`text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded ${getTagColor(task.tag)}`}>
                          {task.tag}
                        </span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                          <Clock size={8} /> {task.estimatedDuration}m
                        </span>
                        {task.subtasks && task.subtasks.length > 0 && (
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                            {task.subtasks.filter(s => s.isCompleted).length}/{task.subtasks.length} 子任务
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-1 shrink-0">
                       <button 
                         onClick={(e) => { e.stopPropagation(); openEdit(task); }} 
                         className="p-2 text-slate-300 hover:text-slate-900 transition-colors"
                         title="编辑"
                       >
                          <Edit2 size={14} />
                       </button>
                       <button 
                         onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }} 
                         className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                         title="删除"
                       >
                          <Trash2 size={14} />
                       </button>
                    </div>
                  </div>
                  
                  {task.subtasks && isExpanded && (
                    <div className="px-4 pb-4 space-y-2 border-t border-slate-50 pt-3">
                      {task.subtasks.map(sub => (
                        <div key={sub.id} className="flex items-center gap-3 pl-8">
                          <button 
                            onClick={() => {
                              const updatedSub = task.subtasks?.map(s => s.id === sub.id ? { ...s, isCompleted: !s.isCompleted } : s);
                              onUpdateTask({ ...task, subtasks: updatedSub });
                            }} 
                            className={sub.isCompleted ? 'text-emerald-400' : 'text-slate-200'}
                          >
                            <CheckCircle size={16} fill={sub.isCompleted ? "currentColor" : "none"} />
                          </button>
                          <span className={`text-xs font-medium ${sub.isCompleted ? 'line-through text-slate-300' : 'text-slate-600'}`}>
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

      {/* Floating Add Button */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
        <button 
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="bg-slate-900 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform active:scale-95"
        >
          <Plus size={28} />
        </button>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-4">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 animate-in slide-in-from-bottom sm:zoom-in duration-300">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                       {editingTask ? '编辑任务' : '添加新任务'}
                    </h3>
                    <button onClick={() => { setShowAddModal(false); resetForm(); }} className="text-slate-300 hover:text-slate-900"><X size={20}/></button>
                </div>
                <form onSubmit={handleSaveTask} className="space-y-5">
                    <input 
                        autoFocus
                        className="w-full text-lg font-bold outline-none border-b-2 border-slate-100 focus:border-slate-900 pb-2 transition-colors placeholder:text-slate-200"
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        placeholder="想做什么？"
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">预计时长 (MIN)</label>
                            <input 
                                type="number"
                                className="w-full bg-slate-50 p-2.5 rounded-xl font-bold outline-none focus:ring-2 ring-slate-900/5 transition-all"
                                value={taskDuration}
                                onChange={(e) => setTaskDuration(Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">分类标签</label>
                            <select 
                                className="w-full bg-slate-50 p-2.5 rounded-xl font-bold outline-none appearance-none"
                                value={taskTag}
                                onChange={(e) => setTaskTag(e.target.value as TaskTag)}
                            >
                                <option value="Work">Work</option>
                                <option value="Study">Study</option>
                                <option value="Life">Life</option>
                                <option value="Health">Health</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">任务拆解 (SUBTASKS)</label>
                        <div className="flex gap-2">
                            <input 
                                className="flex-1 bg-slate-50 p-2.5 rounded-xl text-sm font-medium outline-none"
                                placeholder="输入子任务..."
                                value={currentSubtask}
                                onChange={(e) => setCurrentSubtask(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtaskInput())}
                            />
                            <button type="button" onClick={addSubtaskInput} className="bg-slate-100 text-slate-900 px-3 rounded-xl hover:bg-slate-200 transition-colors">
                                <Plus size={18} />
                            </button>
                        </div>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                            {taskSubtasks.map((st, i) => (
                                <div key={i} className="flex justify-between items-center bg-slate-50/50 px-3 py-2 rounded-lg text-xs font-medium text-slate-600">
                                    <span>{st}</span>
                                    <button type="button" onClick={() => removeSubtaskInput(i)} className="text-slate-300 hover:text-red-500"><X size={14}/></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3">
                       {editingTask && (
                         <button 
                            type="button"
                            onClick={() => { onDeleteTask(editingTask.id); setShowAddModal(false); resetForm(); }}
                            className="flex-1 py-4 bg-red-50 text-red-600 rounded-2xl font-black text-sm active:scale-95 transition-all"
                          >
                             删除任务
                          </button>
                       )}
                       <button className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 active:scale-95 transition-all">
                          {editingTask ? '确认更新' : '确认保存'}
                       </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;