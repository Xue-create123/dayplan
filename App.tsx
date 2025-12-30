import React, { useState, useEffect } from 'react';
import { Task } from './types';
import Dashboard from './components/Dashboard';
import ChatInterface from './components/ChatInterface';
import DailyReviewModal from './components/DailyReviewModal';
import { fetchDailyEconomicNews, generateDailyReview } from './services/geminiService';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { PieChart, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dailyNews, setDailyNews] = useState<string>('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewContext, setReviewContext] = useState('');
  const [isGeneratingReview, setIsGeneratingReview] = useState(false);

  // --- Initial Load ---
  useEffect(() => {
    const initApp = async () => {
      // 1. Load Tasks from LocalStorage
      const savedTasks = localStorage.getItem('strictpm_tasks');
      if (savedTasks) {
        try {
          const parsed = JSON.parse(savedTasks);
          setTasks(parsed);
        } catch (e) {
          console.error("Failed to parse saved tasks", e);
        }
      }

      // 2. Load or Fetch Daily News
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const newsKey = `strictpm_news_${todayStr}`;
      const savedNews = localStorage.getItem(newsKey);

      if (savedNews) {
        setDailyNews(savedNews);
      } else {
        try {
          const news = await fetchDailyEconomicNews();
          setDailyNews(news);
          localStorage.setItem(newsKey, news);
        } catch (e) {
          console.error("News fetch failed", e);
          setDailyNews("经济简报\n今日全球市场运行平稳，暂无重大宏观波动。\n保持节奏，专注核心目标。");
        }
      }
      
      setIsInitialLoading(false);
    };

    initApp();
  }, []);

  // --- Persistence ---
  useEffect(() => {
    if (!isInitialLoading) {
      localStorage.setItem('strictpm_tasks', JSON.stringify(tasks));
    }
  }, [tasks, isInitialLoading]);

  // --- Handlers ---
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

  const handleAddFromAI = (aiTasks: any[]) => {
    const newTasks = aiTasks.map(t => ({
        id: crypto.randomUUID(),
        title: t.title,
        estimatedDuration: t.estimatedDuration,
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-slate-900 animate-spin" />
          <p className="text-slate-500 font-medium">正在启动...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
            <div className="bg-slate-900 text-white p-2 rounded-xl">
                <PieChart size={24} />
            </div>
            <span className="font-bold text-2xl tracking-tight text-slate-900">StrictPM</span>
        </div>
        <button 
            onClick={triggerDailyReview}
            disabled={isGeneratingReview}
            className="text-sm font-bold text-slate-900 border-2 border-slate-900 px-4 py-2 rounded-xl hover:bg-slate-900 hover:text-white transition-all disabled:opacity-50"
        >
            {isGeneratingReview ? '分析中...' : '每日复盘'}
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