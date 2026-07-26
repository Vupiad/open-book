import * as WailsApp from '../../wailsjs/go/main/App';
import { main } from '../../wailsjs/go/models';
import { OnFileDrop, OnFileDropOff } from '../../wailsjs/runtime/runtime';

export const isWails = (): boolean => {
  return typeof window !== 'undefined' && (window as any).go && (window as any).go.main && (window as any).go.main.App;
};

export function onFileDrop(callback: (x: number, y: number, paths: string[]) => void, useDropZone?: boolean): void {
  if (isWails()) {
    try {
      OnFileDrop(callback, useDropZone || false);
    } catch (e) {
      console.warn('OnFileDrop failed', e);
    }
  }
}

export function onFileDropOff(): void {
  if (isWails()) {
    try {
      OnFileDropOff();
    } catch (e) {
      console.warn('OnFileDropOff failed', e);
    }
  }
}

const getBaseUrl = (): string => {
  if (typeof window !== 'undefined' && (window.location.port === '5173' || window.location.port === '3000')) {
    return `http://${window.location.hostname}:3456`;
  }
  return '';
};

export async function GetBooks(): Promise<main.Book[]> {
  if (isWails()) return WailsApp.GetBooks();
  const res = await fetch(`${getBaseUrl()}/api/books`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function SelectAndAddBook(): Promise<main.Book | null> {
  if (isWails()) return WailsApp.SelectAndAddBook();
  
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await fetch(`${getBaseUrl()}/api/upload-pdf`, {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) throw new Error(await res.text());
        const book = await res.json();
        resolve(book);
      } catch (err) {
        console.error('Failed to upload PDF', err);
        reject(err);
      }
    };
    input.click();
  });
}

export async function AddBookFromPath(filePath: string): Promise<main.Book | null> {
  if (isWails()) return WailsApp.AddBookFromPath(filePath);
  console.warn('AddBookFromPath is not supported in web browser mode');
  return null;
}

export async function UpdateProgress(bookId: string, currentPage: number, totalPages: number): Promise<void> {
  if (isWails()) return (WailsApp as any).UpdateProgress(bookId, currentPage, totalPages);
  await fetch(`${getBaseUrl()}/api/progress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookId, currentPage, totalPages }),
  });
}

export async function GetCategories(): Promise<string[]> {
  if (isWails()) return WailsApp.GetCategories();
  const res = await fetch(`${getBaseUrl()}/api/categories`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function AddCategory(category: string): Promise<string[]> {
  if (isWails()) return WailsApp.AddCategory(category);
  const res = await fetch(`${getBaseUrl()}/api/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function SetBookCategory(bookId: string, category: string): Promise<void> {
  if (isWails()) return (WailsApp as any).SetBookCategory(bookId, category);
  await fetch(`${getBaseUrl()}/api/books/category`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookId, category }),
  });
}

export async function SaveCoverData(bookId: string, base64Data: string): Promise<void> {
  if (isWails()) return (WailsApp as any).SaveCoverData(bookId, base64Data);
  await fetch(`${getBaseUrl()}/api/cover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookId, base64Data }),
  });
}

export async function DeleteCategory(category: string): Promise<string[]> {
  if (isWails()) return WailsApp.DeleteCategory(category);
  const res = await fetch(`${getBaseUrl()}/api/categories?category=${encodeURIComponent(category)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function DeleteBook(id: string): Promise<void> {
  if (isWails()) return (WailsApp as any).DeleteBook(id);
  await fetch(`${getBaseUrl()}/api/books?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function Translate(text: string, targetLang: string): Promise<string> {
  if (isWails()) return WailsApp.Translate(text, targetLang);
  const res = await fetch(`${getBaseUrl()}/api/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, targetLang }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.result;
}

export async function GetGoals(): Promise<main.Goal[]> {
  if (isWails()) return WailsApp.GetGoals();
  const res = await fetch(`${getBaseUrl()}/api/goals`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function AddGoal(title: string): Promise<main.Goal[]> {
  if (isWails()) return WailsApp.AddGoal(title);
  const res = await fetch(`${getBaseUrl()}/api/goals/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function UpdateGoal(id: string, title: string): Promise<main.Goal[]> {
  if (isWails()) return WailsApp.UpdateGoal(id, title);
  const res = await fetch(`${getBaseUrl()}/api/goals/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, title }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function DeleteGoal(id: string): Promise<main.Goal[]> {
  if (isWails()) return WailsApp.DeleteGoal(id);
  const res = await fetch(`${getBaseUrl()}/api/goals?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function ToggleGoal(id: string): Promise<main.Goal[]> {
  if (isWails()) return WailsApp.ToggleGoal(id);
  const res = await fetch(`${getBaseUrl()}/api/goals/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function UpdateGoalDayTime(id: string, dayIndex: number, time: string): Promise<main.Goal[]> {
  if (isWails()) return WailsApp.UpdateGoalDayTime(id, dayIndex, time);
  const res = await fetch(`${getBaseUrl()}/api/goals/update-daytime`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, dayIndex, time }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function AddCalendarGoal(title: string, dayIndex: number, time: string): Promise<main.Goal[]> {
  if (isWails()) return WailsApp.AddCalendarGoal(title, dayIndex, time);
  const res = await fetch(`${getBaseUrl()}/api/goals/add-calendar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, dayIndex, time }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function RenameCategory(oldCat: string, newCat: string): Promise<string[]> {
  if (isWails()) return WailsApp.RenameCategory(oldCat, newCat);
  const res = await fetch(`${getBaseUrl()}/api/categories/rename`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldCat, newCat }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function AddGoalWithBook(title: string, bookId: string, bookTitle: string, sections: main.GoalSection[]): Promise<main.Goal[]> {
  if (isWails()) return WailsApp.AddGoalWithBook(title, bookId, bookTitle, sections);
  const res = await fetch(`${getBaseUrl()}/api/goals/add-with-book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, bookId, bookTitle, sections }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function UpdateGoalWithBook(id: string, title: string, bookId: string, bookTitle: string, sections: main.GoalSection[]): Promise<main.Goal[]> {
  if (isWails()) return WailsApp.UpdateGoalWithBook(id, title, bookId, bookTitle, sections);
  const res = await fetch(`${getBaseUrl()}/api/goals/update-with-book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, title, bookId, bookTitle, sections }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function GetWeeklyHistory(): Promise<main.WeeklyHistory[]> {
  if (isWails()) return WailsApp.GetWeeklyHistory();
  const res = await fetch(`${getBaseUrl()}/api/weekly-history`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function GetActivityLog(): Promise<{[key: string]: number}> {
  if (isWails()) return WailsApp.GetActivityLog();
  const res = await fetch(`${getBaseUrl()}/api/activity`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function GetServerInfo(): Promise<main.ServerInfo> {
  if (isWails()) return (WailsApp as any).GetServerInfo();
  const res = await fetch(`${getBaseUrl()}/api/server-info`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
