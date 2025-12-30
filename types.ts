export type TaskTag = 'Life' | 'Study' | 'Work' | 'Health' | 'Other';

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
  duration?: number; // Optional duration in minutes
}

export interface Task {
  id: string;
  title: string;
  estimatedDuration: number; // in minutes
  tag: TaskTag;
  status: 'pending' | 'in-progress' | 'completed' | 'deferred';
  date: string; // ISO Date String YYYY-MM-DD
  createdAt: number;
  actualStartTime?: number;
  actualEndTime?: number;
  deferredCount: number; // How many times was this task pushed back?
  subtasks?: Subtask[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isSystem?: boolean; // For local system notifications (e.g., "Task added")
  timestamp: number;
}

export interface DailyNews {
  headline: string;
  summary: string;
  insight: string; // Key takeaway
}

export interface DailyStats {
  totalTasks: number;
  completedTasks: number;
  totalEstimatedMinutes: number;
  completedMinutes: number;
}