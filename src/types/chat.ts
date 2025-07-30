import { BookingFlightOption } from "./flights";
import { MemoryDto } from "./memory";

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system' | 'data'
  content: string
  createdAt?: Date
  flights?: BookingFlightOption[]
  searchId?: string
  memories?: MemoryDto[]
  images?: string[] // Base64 encoded images
}

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}

export interface FlightSearchData {
  searchId?: string | null
  flights?: any[]
  pricingTokens?: Record<string, string>
}

export interface ToolCall {
  id: string;
  toolName: string;
  description: string;
}

export interface ToolCallContent extends ToolCall {
  isComplete: boolean;
  data: any;
  result?: any;
}