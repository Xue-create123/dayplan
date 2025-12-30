import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Task } from "../types";

// --- 1. Daily Economic News Service ---

export const fetchDailyEconomicNews = async (): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "请提供一条今天或最近24小时内最重要的全球或中国宏观经济新闻。格式严格要求三行：第一行是简短的标题（20字以内），第二行是新闻摘要（50字以内），第三行是一句核心洞察或对普通人的影响（30字以内）。不要有Markdown格式，不要有额外解释。",
      config: {
        maxOutputTokens: 200,
        temperature: 0.5,
      }
    });
    return response.text || "市场观察\n今日全球市场波动较小，投资者静待数据发布。\n关注长期价值，保持投资定力。";
  } catch (error) {
    console.error("Failed to fetch news", error);
    return "连接超时\n无法获取今日最新财经资讯，请检查网络。\n保持冷静，专注于当下的工作与生活。";
  }
};

// --- 2. Chat & Project Manager Service ---

const addTaskTool: FunctionDeclaration = {
  name: 'addTasksToSchedule',
  description: 'Add tasks to the user\'s schedule.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      tasks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            estimatedDuration: { type: Type.NUMBER },
            tag: { type: Type.STRING, enum: ['Life', 'Study', 'Work', 'Health', 'Other'] },
            date: { type: Type.STRING },
            subtasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  duration: { type: Type.NUMBER }
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const systemInstruction = `
    你是一个专业、理性且乐于助人的项目经理助手（CoachPM）。
    当前时间：${currentDateContext}。
    1. 帮助用户规划日程。
    2. 允许跨天规划，确定日期后使用 'addTasksToSchedule' 工具。
    当前已有 ${existingTasks.length} 个任务。
  `;

  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction,
      tools: [{ functionDeclarations: [addTaskTool] }],
    }
  });
};

// --- 3. Daily Review Service ---

export const generateDailyReview = async (
  completedTasks: Task[],
  pendingTasks: Task[],
  dateStr: string
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `为用户进行 ${dateStr} 的复盘。已完成：${completedTasks.map(t => t.title).join(', ')}。未完成：${pendingTasks.map(t => t.title).join(', ')}。请给出分析、建议和鼓励，分段输出。`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "无法生成复盘。";
  } catch (e) {
    return "无法生成复盘，请检查网络连接。";
  }
};