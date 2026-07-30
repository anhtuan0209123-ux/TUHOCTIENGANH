export interface Card {
  id: string;
  term: string;
  definition: string;
  example?: string;
  exampleTranslation?: string;
  isRepeated?: boolean;
  repeatSources?: string[];
}

export interface ReviewLog {
  id: string;
  date: string; // YYYY-MM-DD format
  correctCount: number;
  totalCount: number;
  note: string;
}

export interface StudySet {
  id: string;
  title: string;
  description: string;
  cards: Card[];
  favorite: boolean;
  createdAt: string;
  isGenerated?: boolean;
  category?: 'languages' | 'tech' | 'stem' | 'social';
  reviewLogs?: ReviewLog[];
}

export interface QuizQuestion {
  id: string;
  cardId: string;
  questionText: string;
  type: 'multiple-choice' | 'true-false' | 'written' | 'fill-blanks';
  options?: string[]; // Used for multiple-choice
  correctAnswer: string;
  userAnswer?: string;
  isCorrect?: boolean;
}

export interface Folder {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  setIds: string[];
}

export type StudyMode = 'flashcards' | 'learn' | 'quiz' | 'cards-list' | 'block-puzzle' | 'dino-runner' | 'soccer-penalty';
