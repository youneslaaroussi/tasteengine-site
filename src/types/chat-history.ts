export interface ChatSession {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatHistoryState {
  sessions: ChatSession[];
  currentSessionId: string | null;
} 