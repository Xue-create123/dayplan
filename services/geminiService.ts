import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Task } from "../types";

// Note: process.env.API_KEY is guaranteed to be available by the runtime environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- 1. Daily Economic News Service ---

export const fetchDailyEconomicNews = async (): Promise<string> => {
  try {
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
  description: 'Add tasks to the user\'s schedule. Can include subtasks with durations and specific dates.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      tasks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Main task title" },
            estimatedDuration: { type: Type.NUMBER, description: "Total estimated time in minutes" },
            tag: { type: Type.STRING, enum: ['Life', 'Study', 'Work', 'Health', 'Other'], description: "Category" },
            date: { type: Type.STRING, description: "YYYY-MM-DD date. Only set if explicitly mentioned or inferred logically." },
            subtasks: {
              type: Type.ARRAY,
              description: "Breakdown of smaller steps, especially for tasks > 60mins",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Subtask title" },
                  duration: { type: Type.NUMBER, description: "Optional estimated time for this subtask in minutes" }
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
  const systemInstruction = `
    你是一个专业、理性且乐于助人的项目经理助手（CoachPM）。
    
    当前时间背景：
    今天是：${currentDateContext}。如果用户说“今天”，请使用此日期。
    
    你的目标：
    1. 帮助用户规划日程。如果任务时间很长（例如超过60分钟），主动建议拆分为子任务，并为子任务分配时间。
    2. 允许跨天规划。如果不确定日期，请询问用户是安排在今天还是后续某天。
    3. 语气要温和坚定，引导式提问。
    4. 回复长文本时，请务必使用分段（换行）来保持清晰易读。
    5. 当计划确定后，使用 'addTasksToSchedule' 工具。
    
    当前数据库中已有 ${existingTasks.length} 个任务。
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
  const prompt = `
    为用户进行 ${dateStr} 的复盘。
    
    已完成：${completedTasks.map(t => t.title).join(', ')}
    未完成：${pendingTasks.map(t => t.title).join(', ')}
    
    请生成一段总结：
    1. 分析完成情况。
    2. 对未完成的任务分析可能的原因。
    3. 给出明天的建议。
    4. 使用温和鼓励的语气，分段落输出。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "无法生成复盘。";
  } catch (e) {
    return "无法生成复盘，请检查网络连接。";
  }
};