import * as WailsApp from '../../wailsjs/go/main/App';
import { main } from '../../wailsjs/go/models';
import { OnFileDrop, OnFileDropOff } from '../../wailsjs/runtime/runtime';

export function onFileDrop(callback: (x: number, y: number, paths: string[]) => void, useDropZone?: boolean): void {
  try {
    OnFileDrop(callback, useDropZone || false);
  } catch (e) {
    console.warn('OnFileDrop failed', e);
  }
}

export function onFileDropOff(): void {
  try {
    OnFileDropOff();
  } catch (e) {
    console.warn('OnFileDropOff failed', e);
  }
}

export const GetBooks = WailsApp.GetBooks;
export const SelectAndAddBook = WailsApp.SelectAndAddBook;
export const AddBookFromPath = WailsApp.AddBookFromPath;
export const UpdateProgress = (WailsApp as any).UpdateProgress;
export const GetCategories = WailsApp.GetCategories;
export const AddCategory = WailsApp.AddCategory;
export const SetBookCategory = (WailsApp as any).SetBookCategory;
export const SaveCoverData = (WailsApp as any).SaveCoverData;
export const DeleteCategory = WailsApp.DeleteCategory;
export const DeleteBook = (WailsApp as any).DeleteBook;
export const Translate = WailsApp.Translate;
export const GetGoals = WailsApp.GetGoals;
export const AddGoal = WailsApp.AddGoal;
export const UpdateGoal = WailsApp.UpdateGoal;
export const DeleteGoal = WailsApp.DeleteGoal;
export const ToggleGoal = WailsApp.ToggleGoal;
export const UpdateGoalDayTime = WailsApp.UpdateGoalDayTime;
export const AddCalendarGoal = WailsApp.AddCalendarGoal;
export const RenameCategory = WailsApp.RenameCategory;
export const AddGoalWithBook = WailsApp.AddGoalWithBook;
export const UpdateGoalWithBook = WailsApp.UpdateGoalWithBook;
export const GetWeeklyHistory = WailsApp.GetWeeklyHistory;
export const GetActivityLog = WailsApp.GetActivityLog;

