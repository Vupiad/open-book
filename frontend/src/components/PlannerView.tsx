import { useState, useMemo, type Dispatch, type SetStateAction } from 'react';
import { ChevronLeft, Sparkles, Check, X, Trash2, Plus, Edit2, Calendar as CalendarIcon, BookOpen, Clock, Award } from 'lucide-react';
import Heatmap from './Heatmap';
import ProgressRing from './ProgressRing';
import GoalModal from './GoalModal';
import type { Book, Goal, GoalSection, WeeklyHistory } from '../types';

type PlannerViewProps = {
  currentWeekFormatted: string;
  currentMonthYear: string;
  currentDays: number[];
  goals: Goal[];
  weeklyHistory?: WeeklyHistory[];
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
  onAddGoalWithBook?: (title: string, bookId: string, bookTitle: string, sections: GoalSection[]) => Promise<void>;
  onUpdateGoalWithBook?: (id: string, title: string, bookId: string, bookTitle: string, sections: GoalSection[]) => Promise<void>;
  onUpdateGoalDayTime: (id: string, dayIndex: number, time: string) => Promise<void>;
  onAddCalendarGoal: (title: string, dayIndex: number, time: string) => Promise<void>;
  onOpenBook: (book: Book, targetPage?: number) => void;
};

import WindowControls from './WindowControls';

export default function PlannerView({
  currentWeekFormatted,
  currentMonthYear,
  currentDays,
  goals,
  weeklyHistory = [],
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
  onAddGoalWithBook,
  onUpdateGoalWithBook,
  onUpdateGoalDayTime,
  onAddCalendarGoal,
  onOpenBook
}: PlannerViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoalModal, setEditingGoalModal] = useState<Goal | null>(null);
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

  const weeklyObjectives = useMemo(() => {
    return goals.filter(g => g.dayIndex === undefined || g.dayIndex === -1);
  }, [goals]);

  const overallWeeklyProgress = useMemo(() => {
    if (weeklyObjectives.length === 0) return 0;
    const total = weeklyObjectives.reduce((sum, g) => sum + (g.completed ? 100 : (g.progress || 0)), 0);
    return Math.round(total / weeklyObjectives.length);
  }, [weeklyObjectives]);

  return (
    <div className="planner-view" style={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <header className="topbar">
        <div>
          <h1 className="desk-title">Activity Dashboard</h1>
          <p className="desk-subtitle" style={{ margin: 0 }}>
            Visualizing your reading progress, objectives, and habits.
          </p>
        </div>
        <div className="topbar-actions">
          <WindowControls />
        </div>
      </header>

      <div style={{ padding: '0 40px 40px', display: 'flex', flexDirection: 'column', gap: '32px', flex: 1 }}>
        <Heatmap />

        <div style={{ display: 'grid', gridTemplateColumns: currentBook ? '1fr 340px' : '1fr', gap: '24px' }}>
          {/* Current Week Objectives Overview Card */}
          <div
            style={{
              backgroundColor: 'var(--bg-card, #202020)',
              border: '1px solid var(--card-border, #333)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--card-border, #333)', paddingBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={20} color="var(--accent, #68c7d6)" /> Current Week Objectives
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Complete your linked book sections to fill the weekly progress ring.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                  onClick={() => {
                    setEditingGoalModal(null);
                    setIsModalOpen(true);
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'var(--accent, #68c7d6)',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Plus size={16} /> New Objective
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '16px', borderLeft: '1px solid var(--card-border, #333)' }}>
                  <ProgressRing progress={overallWeeklyProgress} size={56} strokeWidth={5} showPercentage color="var(--accent, #68c7d6)" />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Weekly</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Progress</span>
                  </div>
                </div>
              </div>
            </div>

            {weeklyObjectives.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px', border: '1px dashed var(--card-border, #333)', borderRadius: '12px' }}>
                No objectives set for this week yet. Click "+ New Objective" to choose a book and reading sections!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {weeklyObjectives.map((goal) => (
                  <div
                    key={goal.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--bg-main, #141414)',
                      border: '1px solid var(--card-border, #333)',
                      transition: 'border-color 0.2s ease',
                    }}
                  >
                    <ProgressRing
                      progress={goal.progress || 0}
                      completed={goal.completed}
                      size={32}
                      strokeWidth={3}
                      onClick={async () => {
                        await onToggleGoal(goal.id);
                      }}
                    />

                    <div
                      style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', cursor: goal.bookId ? 'pointer' : 'default', overflow: 'hidden' }}
                      onClick={() => {
                        if (goal.bookId && onOpenBook) {
                          const bk = books.find(b => b.id === goal.bookId);
                          if (bk) {
                            const targetPage = (goal.sections && goal.sections.length > 0 && (!bk.currentPage || bk.currentPage < goal.sections[0].startPage)) ? goal.sections[0].startPage : (bk.currentPage || 1);
                            onOpenBook(bk, targetPage);
                          }
                        }
                      }}
                      title={goal.bookId ? 'Click to open linked book and start reading' : undefined}
                    >
                      <span style={{ fontSize: '14px', fontWeight: 600, color: goal.completed ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: goal.completed ? 'line-through' : 'none' }}>
                        {goal.title}
                      </span>
                      {goal.bookTitle && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '12px', color: 'var(--accent, #68c7d6)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                            📖 {goal.bookTitle}
                          </span>
                          {goal.sections && goal.sections.length > 0 && (
                            <span style={{ fontSize: '11px', backgroundColor: 'var(--bg-card, #202020)', padding: '2px 8px', borderRadius: '4px', color: 'var(--text-secondary)', border: '1px solid var(--card-border, #333)' }}>
                              {goal.sections.map(s => `${s.title} (p. ${s.startPage}-${s.endPage})`).join(', ')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => {
                          setEditingGoalModal(goal);
                          setIsModalOpen(true);
                        }}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px' }}
                        title="Edit objective"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={async () => {
                          await onDeleteGoal(goal.id);
                        }}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px' }}
                        title="Delete objective"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Jump Back In Card */}
          {currentBook && (
            <div
              style={{ borderRadius: '16px', overflow: 'hidden', position: 'relative', height: '100%', minHeight: '260px', border: '1px solid var(--card-border)', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
              onClick={() => onOpenBook(currentBook)}
            >
              <img
                src={getBookCover(currentBook) || 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Phenomenology_of_Perception_cover.jpg/800px-Phenomenology_of_Perception_cover.jpg'}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                alt="Current Read"
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '24px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent, #68c7d6)', letterSpacing: '0.1em', marginBottom: '6px', textTransform: 'uppercase' }}>JUMP BACK IN</span>
                <span style={{ fontSize: '20px', fontWeight: 600, color: 'white', lineHeight: '1.3', marginBottom: '8px' }}>{currentBook.title}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                  <span>Page {currentBook.currentPage || 1} of {currentBook.totalPages || '?'}</span>
                  <span>•</span>
                  <span>{Math.round(currentBook.progress || 0)}% Read</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Weekly Objectives History Grid Table */}
        <div
          style={{
            backgroundColor: 'var(--bg-card, #202020)',
            border: '1px solid var(--card-border, #333)',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={20} color="var(--accent, #68c7d6)" /> Weekly Objectives History
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              A chronological log of your past weekly reading objectives and completion rates.
            </p>
          </div>

          {weeklyHistory.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px', border: '1px dashed var(--card-border, #333)', borderRadius: '12px' }}>
              No past weekly history recorded yet. When a new week begins, your completed and archived goals will automatically appear in this history grid!
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--card-border, #333)', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Week Period</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, width: '120px' }}>Progress</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Objectives & Linked Sections</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, width: '140px', textAlign: 'right' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyHistory.map((hist, idx) => (
                    <tr key={idx} style={{ borderBottom: idx === weeklyHistory.length - 1 ? 'none' : '1px solid var(--card-border, #333)', backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                        {hist.weekStart} – {hist.weekEnd}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <ProgressRing progress={hist.progress} size={32} strokeWidth={3} showPercentage color="var(--accent, #68c7d6)" />
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {(hist.goals || []).map((g, gIdx) => (
                            <div key={gIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                              <span style={{ color: g.completed ? 'var(--accent, #68c7d6)' : 'var(--text-secondary)', fontWeight: 700 }}>
                                {g.completed ? '✓' : '○'}
                              </span>
                              <span style={{ color: g.completed ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: g.completed ? 'line-through' : 'none', fontWeight: 500 }}>
                                {g.title}
                              </span>
                              {g.bookTitle && (
                                <span style={{ fontSize: '11px', color: 'var(--accent, #68c7d6)', backgroundColor: 'var(--bg-main, #141414)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--card-border, #333)' }}>
                                  📖 {g.bookTitle}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            backgroundColor: hist.progress >= 100 ? 'rgba(104, 199, 214, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                            color: hist.progress >= 100 ? 'var(--accent, #68c7d6)' : 'var(--text-secondary)',
                            border: `1px solid ${hist.progress >= 100 ? 'var(--accent, #68c7d6)' : 'var(--card-border, #333)'}`,
                          }}
                        >
                          {hist.progress >= 100 ? 'Completed' : `${hist.progress}% Read`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <GoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        books={books}
        initialGoal={editingGoalModal}
        onSave={async (title, bookId, bookTitle, sections) => {
          if (editingGoalModal) {
            if (onUpdateGoalWithBook) {
              await onUpdateGoalWithBook(editingGoalModal.id, title, bookId, bookTitle, sections);
            } else {
              await onUpdateGoal(editingGoalModal.id, title);
            }
          } else {
            if (onAddGoalWithBook) {
              await onAddGoalWithBook(title, bookId, bookTitle, sections);
            } else {
              await onAddGoal(title);
            }
          }
        }}
      />
    </div>
  );
}
