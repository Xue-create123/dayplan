import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Task } from '../types';
import { MessageSquare, X, Send, Bot, User, Loader2, ArrowUpRight } from 'lucide-react';
import { createChatSession } from '../services/geminiService';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';

interface ChatInterfaceProps {
  tasks: Task[];
  onAddTasks: (tasks: any[]) => void;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  dailyReviewContext: string | null;
  currentDateContext: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ tasks, onAddTasks, isOpen, setIsOpen, dailyReviewContext, currentDateContext }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "你好！我是 CoachPM。我可以帮你规划日程，也可以帮你拆解复杂的任务。请告诉我你的目标。",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize Chat Session
  useEffect(() => {
    if (isOpen && !chatSessionRef.current) {
        try {
            chatSessionRef.current = createChatSession(tasks, currentDateContext);
        } catch (e) {
            console.error("Failed to init chat session", e);
        }
    }
  }, [isOpen, tasks, currentDateContext]);

  // Handle auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  // Inject Daily Review Context
  useEffect(() => {
    if (dailyReviewContext && isOpen) {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg.text !== dailyReviewContext) {
            const reviewMsg: ChatMessage = {
                id: Date.now().toString(),
                role: 'model',
                text: dailyReviewContext,
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, reviewMsg]);
        }
    }
  }, [dailyReviewContext, isOpen]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Lazy init or re-init session if needed
      if (!chatSessionRef.current) {
         chatSessionRef.current = createChatSession(tasks, currentDateContext);
      }
      
      const result = await chatSessionRef.current.sendMessage({ message: userMsg.text });
      const functionCalls = result.functionCalls;
      
      if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        if (call.name === 'addTasksToSchedule') {
            const args = call.args as any;
            if (args.tasks && Array.isArray(args.tasks)) {
                onAddTasks(args.tasks);
                
                const finalResponse = await chatSessionRef.current.sendMessage({
                    message: [
                        {
                            functionResponse: {
                                name: 'addTasksToSchedule',
                                response: { result: 'Tasks successfully added to user schedule.' }
                            }
                        }
                    ]
                });

                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'model',
                    text: finalResponse.text || "已添加到日程。",
                    timestamp: Date.now()
                }]);
                setIsLoading(false);
                return;
            }
        }
      }

      const text = result.text;
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: text || "收到。",
        timestamp: Date.now()
      }]);

    } catch (error: any) {
      console.error("Chat error:", error);
      let errorMsg = "连接出错，请重试。";
      if (error.message?.toLowerCase().includes('api key')) {
          errorMsg = "API Key 校验失败。请确保环境变量中已配置正确的 Key。";
      } else if (error.message?.includes('fetch')) {
          errorMsg = "网络连接失败，请检查网络环境。";
      }
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: `${errorMsg}\n(错误详情: ${error.message || '未知'})`,
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
  };

  const renderMessageText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index} className="font-bold text-slate-800">{part.slice(2, -2)}</strong>;
        }
        return <span key={index}>{part}</span>;
    });
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-4 sm:right-6 bg-slate-900 text-white h-14 px-5 rounded-full shadow-2xl hover:bg-slate-800 transition-all z-40 flex items-center justify-center gap-2 group border-2 border-white active:scale-95"
      >
        <MessageSquare size={24} />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap text-sm font-black">规划助手</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 w-full sm:w-[400px] h-full sm:h-[600px] bg-white sm:rounded-2xl shadow-2xl z-50 flex flex-col border border-gray-200 overflow-hidden animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Bot size={18} />
            </div>
            <div>
                <h3 className="font-bold">CoachPM</h3>
                <p className="text-[10px] text-slate-300 uppercase tracking-widest">AI Planner</p>
            </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-slate-300 hover:text-white p-2">
            <X size={24} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 scrollbar-hide">
        {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-4 text-sm whitespace-pre-wrap leading-relaxed ${
                    msg.role === 'user' 
                    ? 'bg-slate-900 text-white rounded-br-none shadow-lg' 
                    : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none shadow-sm'
                }`}>
                    {renderMessageText(msg.text)}
                </div>
            </div>
        ))}
        {isLoading && (
             <div className="flex justify-start">
                 <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-none p-3 shadow-sm">
                    <Loader2 size={18} className="animate-spin text-slate-400" />
                 </div>
             </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-100 shrink-0 pb-safe">
        <div className="flex items-end gap-2 bg-slate-50 rounded-2xl px-4 py-2 border border-transparent focus-within:border-slate-200 focus-within:bg-white transition-all">
            <textarea 
                ref={textareaRef}
                className="flex-1 bg-transparent outline-none text-sm text-slate-900 placeholder-slate-400 resize-none max-h-[120px] py-2"
                placeholder="帮我规划..."
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
            />
            <button 
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                className="mb-1 p-2 text-slate-900 disabled:opacity-30 hover:text-blue-600 transition-colors"
            >
                <Send size={20} />
            </button>
        </div>
    </div>
    </div>
  );
};

export default ChatInterface;