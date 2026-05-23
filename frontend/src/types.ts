import type { main } from '../wailsjs/go/models';

export type Book = main.Book;
export type Goal = main.Goal;

export type OutlineEntry = {
  title: string;
  pageNumber?: number;
  items: OutlineEntry[];
};
