export type Category =
  | 'system'
  | 'user'
  | 'assistant'
  | 'tool_call'
  | 'tool_result'
  | 'rag'
  | 'other';

export type InputFormat = 'chat_json' | 'plain_text' | 'unknown';

export interface Segment {
  id: string;
  category: Category;
  role?: string;
  label: string;
  text: string;
  tokens: number;
  messageIndex?: number;
}

export interface ParsedConversation {
  format: InputFormat;
  segments: Segment[];
  warnings: string[];
}

export interface ModelInfo {
  id: string;
  label: string;
  contextWindow: number;
  tokenizer: 'exact' | 'approx';
  approxFactor?: number;
}

export interface CategoryStat {
  category: Category;
  label: string;
  tokens: number;
  percentage: number;
}

export interface AnalysisResult {
  totalTokens: number;
  exact: boolean;
  contextWindow: number;
  usagePercentage: number;
  remainingTokens: number;
  categoryStats: CategoryStat[];
  segments: Segment[];
  warnings: string[];
}

export interface Insight {
  severity: 'info' | 'warn' | 'critical';
  title: string;
  detail: string;
}
