import React, { useState, useEffect } from 'react';
import { Task } from './types';
import Dashboard from './components/Dashboard';
import ChatInterface from './components/ChatInterface';
import DailyReviewModal from './components/DailyReviewModal';
import { generateDailyReview } from './services/geminiService';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { PieChart, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewContext, setReviewContext] = useState('');
  const [isGeneratingReview, setIsGeneratingReview] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      const savedTasks = localStorage.getItem('strictpm_tasks');
      if (savedTasks) {
        try {
          setTasks(JSON.parse(savedTasks));
        } catch (e) {
          console.error("Failed to parse saved tasks", e);
        }
      }
      setIsInitialLoading(false);
    };
    initApp();
  }, []);

  useEffect(() => {
    if (!isInitialLoading) {
      localStorage.setItem('strictpm_tasks', JSON.stringify(tasks));
    }
  }, [tasks, isInitialLoading]);

  const addTask = (taskInput: Omit<Task, 'id' | 'createdAt' | 'deferredCount' | 'status' | 'date'>) => {
    const newTask: Task = {
        ...taskInput,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        status: 'pending',
        deferredCount: 0,
        date: format(selectedDate, 'yyyy-MM-dd')
    };
    setTasks(prev => [...prev, newTask]);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleAddFromAI = (aiTasks: any[]) => {
    const newTasks = aiTasks.map(t => ({
        id: crypto.randomUUID(),
        title: t.title,
        estimatedDuration: Number(t.estimatedDuration) || 30, // Fallback to 30 mins
        tag: t.tag || 'Other',
        status: 'pending' as const,
        deferredCount: 0,
        createdAt: Date.now(),
        date: t.date || format(selectedDate, 'yyyy-MM-dd'),
        subtasks: t.subtasks?.map((st: any) => ({
            id: crypto.randomUUID(),
            title: st.title,
            duration: st.duration,
            isCompleted: false
        })) || []
    }));
    setTasks(prev => [...prev, ...newTasks]);
  };

  const triggerDailyReview = async () => {
    setIsGeneratingReview(true);
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const daysTasks = tasks.filter(t => t.date === dateKey);
    const completed = daysTasks.filter(t => t.status === 'completed');
    const pending = daysTasks.filter(t => t.status !== 'completed');

    const reviewText = await generateDailyReview(
        completed, 
        pending, 
        format(selectedDate, 'yyyy年MM月dd日', { locale: zhCN })
    );
    
    setReviewContext(reviewText);
    setIsGeneratingReview(false);
    setIsReviewModalOpen(true);
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 text-slate-900 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 sm:px-0 flex flex-col pt-8 pb-12">
      <div className="flex justify-between items-center mb-8 px-4 sm:px-0 shrink-0">
        <div className="flex items-center gap-2">
            <PieChart size={24} className="text-slate-900" />
            <span className="font-black text-xl tracking-tighter text-slate-900 uppercase">StrictPM</span>
        </div>
        <button 
            onClick={triggerDailyReview}
            disabled={isGeneratingReview}
            className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest disabled:opacity-30"
        >
            {isGeneratingReview ? 'Reviewing...' : 'Daily Review'}
        </button>
      </div>

      <div className="flex-1">
        <Dashboard 
            tasks={tasks.filter(t => t.date === format(selectedDate, 'yyyy-MM-dd'))} 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onAddTask={addTask}
        />
      </div>

      <DailyReviewModal 
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        reviewText={reviewContext}
        tasks={tasks.filter(t => t.date === format(selectedDate, 'yyyy-MM-dd'))}
        dateStr={format(selectedDate, 'yyyy年MM月dd日')}
        onOpenChat={() => setIsChatOpen(true)}
      />

      <ChatInterface 
        tasks={tasks}
        onAddTasks={handleAddFromAI}
        isOpen={isChatOpen}
        setIsOpen={setIsChatOpen}
        dailyReviewContext={null} 
        currentDateContext={format(new Date(), 'yyyy-MM-dd (EEEE)', { locale: zhCN })}
      />
    </div>
  );
};

export default App;