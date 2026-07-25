import type { main } from '../wailsjs/go/models';

export type Book = main.Book;
export type Goal = main.Goal;

export type OutlineEntry = {
  title: string;
  pageNumber?: number;
  items: OutlineEntry[];
};

export type ThemeMode = 'light' | 'dark' | 'slate' | 'amoled' | 'sepia';

export type UserSettings = {
  theme: ThemeMode;
  accent: string;
};
