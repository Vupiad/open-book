import { useMemo, type Dispatch, type SetStateAction } from 'react';
import { ChevronLeft, Sparkles, Check, X, Trash2, Plus } from 'lucide-react';
import Heatmap from './Heatmap';
import type { Book, Goal } from '../types';

type PlannerViewProps = {
  currentWeekFormatted: string;
  currentMonthYear: string;
  currentDays: number[];
  goals: Goal[];
  books: Book[];
  getBookCover: (book: Book) => string | undefined;
  isAddingGoal: boolean;
  newGoalTitle: string;
  editingGoalId: string | null;
  editingGoalTitle: string;
  addingGoalDayIndex: number | null;
  calendarGoalTitle: string;
  setIsAddingGoal: Dispatch<SetStateAction<boolean>>;
  setNewGoalTitle: Dispatch<SetStateAction<string>>;
  setEditingGoalId: Dispatch<SetStateAction<string | null>>;
  setEditingGoalTitle: Dispatch<SetStateAction<string>>;
  setAddingGoalDayIndex: Dispatch<SetStateAction<number | null>>;
  setCalendarGoalTitle: Dispatch<SetStateAction<string>>;
  onToggleGoal: (id: string) => Promise<void>;
  onUpdateGoal: (id: string, title: string) => Promise<void>;
  onDeleteGoal: (id: string) => Promise<void>;
  onAddGoal: (title: string) => Promise<void>;
  onUpdateGoalDayTime: (id: string, dayIndex: number, time: string) => Promise<void>;
  onAddCalendarGoal: (title: string, dayIndex: number, time: string) => Promise<void>;
  onOpenBook: (book: Book) => void;
};

export default function PlannerView({
  currentWeekFormatted,
  currentMonthYear,
  currentDays,
  goals,
  books,
  getBookCover,
  isAddingGoal,
  newGoalTitle,
  editingGoalId,
  editingGoalTitle,
  addingGoalDayIndex,
  calendarGoalTitle,
  setIsAddingGoal,
  setNewGoalTitle,
  setEditingGoalId,
  setEditingGoalTitle,
  setAddingGoalDayIndex,
  setCalendarGoalTitle,
  onToggleGoal,
  onUpdateGoal,
  onDeleteGoal,
  onAddGoal,
  onUpdateGoalDayTime,
  onAddCalendarGoal,
  onOpenBook
}: PlannerViewProps) {
  const currentBook = useMemo(() => {
    if (!books || books.length === 0) return null;
    const sorted = [...books].sort((a, b) => {
      if ((b.lastRead || 0) !== (a.lastRead || 0)) {
        return (b.lastRead || 0) - (a.lastRead || 0);
      }
      const aActive = (a.progress || 0) > 0 && (a.progress || 0) < 100 ? 1 : 0;
      const bActive = (b.progress || 0) > 0 && (b.progress || 0) < 100 ? 1 : 0;
      if (bActive !== aActive) return bActive - aActive;
      return (b.currentPage || 0) - (a.currentPage || 0);
    });
    return sorted[0];
  }, [books]);

  return (
    <div className="planner-view" style={{ padding: '40px', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="desk-title">Activity Dashboard</h1>
          <p className="desk-subtitle" style={{ margin: 0 }}>
            Visualizing your reading progress and habits.
          </p>
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', flex: 1 }}>
        <Heatmap />
        
        {currentBook && (
          <div
            style={{ borderRadius: '16px', overflow: 'hidden', position: 'relative', height: '300px', border: '1px solid var(--card-border)', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
            onClick={() => onOpenBook(currentBook)}
          >
            <img
              src={getBookCover(currentBook) || 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Phenomenology_of_Perception_cover.jpg/800px-Phenomenology_of_Perception_cover.jpg'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              alt="Current Read"
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '24px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.1em', marginBottom: '8px' }}>JUMP BACK IN</span>
              <span style={{ fontSize: '24px', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentBook.title}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
