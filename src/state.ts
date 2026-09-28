import type { ParsedConversation, AnalysisResult, Insight, Category } from './types';

export interface AppState {
  rawInput: string;
  selectedModelId: string;
  customContextWindow: number;
  selectedSegmentId: string | null;
  theme: 'dark' | 'light';
  categoryOverrides: Record<string, Category>;
  isCalculating: boolean;
  parsedConversation: ParsedConversation | null;
  analysisResult: AnalysisResult | null;
  insights: Insight[];
}

const STORAGE_KEY_THEME = 'tokenmap_theme';

function getInitialTheme(): 'dark' | 'light' {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_THEME);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
  } catch {
    // LocalStorage erişim engeli durumu
  }

  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark';
}

const initialState: AppState = {
  rawInput: '',
  selectedModelId: 'gpt-4o',
  customContextWindow: 128000,
  selectedSegmentId: null,
  theme: getInitialTheme(),
  categoryOverrides: {},
  isCalculating: false,
  parsedConversation: null,
  analysisResult: null,
  insights: [],
};

let state: AppState = { ...initialState };
type Listener = (state: AppState) => void;
const listeners: Set<Listener> = new Set();

export function getState(): AppState {
  return state;
}

export function setState(partialState: Partial<AppState>): void {
  state = { ...state, ...partialState };

  // Tema değiştiyse localStorage'a yaz (izin verilen tek localStorage yazımı)
  if (partialState.theme) {
    try {
      localStorage.setItem(STORAGE_KEY_THEME, partialState.theme);
    } catch {
      // Sessiz yut
    }
  }

  listeners.forEach((listener) => listener(state));
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
