export interface AccountData {
  accountNumber: string;
  originalDescription: string;
  translatedDescription?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
}

export interface TranslationSession {
  sessionId: string;
  status: 'processing' | 'completed' | 'failed' | 'paused';
  progress: number;
  currentBatch: number;
  totalBatches: number;
}

export interface Language {
  code: string;
  name: string;
  flag: string;
}