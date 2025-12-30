import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Task } from "../types";

// Helper to get Gemini Instance safely
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

// --- 1. Chat & Project Manager Service ---

const addTaskTool: FunctionDeclaration = {
  name: 'addTasksToSchedule',
  description: 'Add tasks to the user\'s schedule. All durations MUST be in minutes.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      tasks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'The title of the task.' },
            estimatedDuration: { type: Type.NUMBER, description: 'Duration in MINUTES. For example, 1 hour = 60.' },
            tag: { type: Type.STRING, enum: ['Life', 'Study', 'Work', 'Health', 'Other'] },
            date: { type: Type.STRING, description: 'Date in YYYY-MM-DD format.' },
            subtasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  duration: { type: Type.NUMBER, description: 'Duration of subtask in MINUTES.' }
                },
                required: ['title']
              }
            }
          },
          required: ['title', 'estimatedDuration', 'tag']
        }
      }
    },
    required: ['tasks']
  }
};

export const createChatSession = (existingTasks: Task[], currentDateContext: string) => {
  const ai = getAI();
  const systemInstruction = `
    你是一个专业、理性且乐于助人的项目经理助手（CoachPM）。
    当前时间背景：${currentDateContext}。
    
    规则：
    1. 帮助用户规划日程。
    2. 允许跨天规划，确定具体日期后使用 'addTasksToSchedule' 工具。
    3. 极其重要：所有任务时长 (estimatedDuration) 必须以 “分钟” 为单位。如果用户说“1小时”，你必须输出 60。
    4. 当前已有 ${existingTasks.length} 个任务。
  `;

  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction,
      tools: [{ functionDeclarations: [addTaskTool] }],
    }
  });
};

// --- 2. Daily Review Service ---

export const generateDailyReview = async (
  completedTasks: Task[],
  pendingTasks: Task[],
  dateStr: string
): Promise<string> => {
  try {
    const ai = getAI();
    const prompt = `为用户进行 ${dateStr} 的复盘。已完成：${completedTasks.map(t => t.title).join(', ')}。未完成：${pendingTasks.map(t => t.title).join(', ')}。请给出分析、建议和鼓励。`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "无法生成复盘。";
  } catch (e) {
    return "无法生成复盘，请检查网络连接。";
  }
};