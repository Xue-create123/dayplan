import React, { useState, useEffect } from 'react';
import { Task } from './types';
import Dashboard from './components/Dashboard';
import ChatInterface from './components/ChatInterface';
import DailyReviewModal from './components/DailyReviewModal';
import { fetchDailyEconomicNews, generateDailyReview } from './services/geminiService';
import { format } from 'date-fns';
import zhCN from 'date-fns/locale/zh-CN';
import { PieChart } from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dailyNews, setDailyNews] = useState<string>('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewContext, setReviewContext] = useState<string>('');
  const [isGeneratingReview, setIsGeneratingReview] = useState(false);

  // --- Initial Load ---
  useEffect(() => {
    // 1. Load Tasks from LocalStorage
    const savedTasks = localStorage.getItem('strictpm_tasks');
    if (savedTasks) {
        try {
            setTasks(JSON.parse(savedTasks));
        } catch (e) {
            console.error("Failed to parse tasks", e);
        }
    }

    // 2. Load or Fetch Daily News
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const newsKey = `strictpm_news_${todayStr}`;
    const savedNews = localStorage.getItem(newsKey);

    if (savedNews) {
        setDailyNews(savedNews);
    } else {
        fetchDailyEconomicNews().then(news => {
            setDailyNews(news);
            localStorage.setItem(newsKey, news);
        });
    }
  }, []);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('strictpm_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // --- Handlers ---
  const addTask = (taskInput: Omit<Task, 'id' | 'createdAt' | 'deferredCount' | 'status' | 'date'>) => {
    const newTask: Task = {
        ...taskInput,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        createdAt: Date.now(),
        status: 'pending',
        deferredCount: 0,
        date: format(selectedDate, 'yyyy-MM-dd') // Use currently selected date
    };
    setTasks(prev => [...prev, newTask]);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleAddFromAI = (aiTasks: any[]) => {
    const newTasks = aiTasks.map(t => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9) + Math.random(),
        title: t.title,
        estimatedDuration: t.estimatedDuration,
        tag: t.tag || 'Other',
        status: 'pending' as const,
        deferredCount: 0,
        createdAt: Date.now(),
        // Support AI returning specific date, otherwise use currently selected date
        date: t.date || format(selectedDate, 'yyyy-MM-dd'),
        subtasks: t.subtasks?.map((st: any) => ({
            id: Date.now().toString() + Math.random(),
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
    const deferred = daysTasks.filter(t => t.deferredCount > 0);

    const reviewText = await generateDailyReview(
        completed, 
        pending, 
        format(selectedDate, 'yyyy年MM月dd日', { locale: zhCN })
    );
    
    setReviewContext(reviewText);
    setIsGeneratingReview(false);
    setIsReviewModalOpen(true);
  };

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Navigation / Controls */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
            <div className="bg-slate-900 text-white p-2 rounded-lg">
                <PieChart size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">StrictPM</span>
        </div>
        <button 
            onClick={triggerDailyReview}
            disabled={isGeneratingReview}
            className="text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
        >
            {isGeneratingReview ? '生成分析中...' : '每日复盘'}
        </button>
      </div>

      <div className="h-[calc(100vh-140px)]">
        <Dashboard 
            tasks={tasks.filter(t => t.date === format(selectedDate, 'yyyy-MM-dd'))} 
            dateStr={format(selectedDate, 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            newsContent={dailyNews}
            onUpdateTask={handleUpdateTask}
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