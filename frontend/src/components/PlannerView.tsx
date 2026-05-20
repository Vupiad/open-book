import type { Dispatch, SetStateAction } from 'react';
import { ChevronLeft, Sparkles, Check, X, Trash2, Plus } from 'lucide-react';
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
  return (
    <div className="planner-view" style={{ padding: '40px', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="desk-title">Learning Planner</h1>
          <p className="desk-subtitle" style={{ margin: 0 }}>
            Architecting your intellectual journey for the week of {currentWeekFormatted}.
          </p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--accent)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '20px', fontWeight: 500, cursor: 'pointer' }}>
          <Sparkles size={16} /> Optimize Schedule
        </button>
      </header>

      <div style={{ display: 'flex', gap: '32px', flex: 1, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}><ChevronLeft size={20} /></button>
              <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}><ChevronLeft size={20} style={{ transform: 'rotate(180deg)' }} /></button>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{currentMonthYear}</h2>
            </div>
            <div style={{ display: 'flex', background: 'var(--bg-main)', padding: '4px', borderRadius: '8px' }}>
              <button style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '4px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, color: 'var(--accent)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>Week</button>
              <button style={{ background: 'transparent', border: 'none', padding: '4px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Month</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--card-border)', border: '1px solid var(--card-border)', borderRadius: '8px', overflow: 'hidden' }}>
            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
              <div key={day} style={{ background: 'var(--card-bg)', padding: '12px', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center', letterSpacing: '0.05em' }}>{day}</div>
            ))}
            {currentDays.map((day, i) => (
              <div
                key={day}
                style={{ background: 'var(--card-bg)', minHeight: '300px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={async (e) => {
                  e.preventDefault();
                  const goalId = e.dataTransfer.getData('goalId');
                  if (goalId) {
                    await onUpdateGoalDayTime(goalId, i, '');
                  }
                }}
              >
                <div
                  style={{ fontSize: '13px', fontWeight: 500, color: i === 0 ? 'var(--text-primary)' : 'var(--text-secondary)', textAlign: 'left', padding: '4px', cursor: 'pointer' }}
                  onClick={() => setAddingGoalDayIndex(i)}
                  title="Click to add event"
                >
                  {day}
                </div>
                {addingGoalDayIndex === i && (
                  <div style={{ background: 'var(--bg-main)', borderLeft: '3px solid var(--accent)', padding: '8px', borderRadius: '4px' }}>
                    <input
                      autoFocus
                      value={calendarGoalTitle}
                      onChange={(e) => setCalendarGoalTitle(e.target.value)}
                      onBlur={() => {
                        setAddingGoalDayIndex(null);
                        setCalendarGoalTitle('');
                      }}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter' && calendarGoalTitle.trim()) {
                          await onAddCalendarGoal(calendarGoalTitle.trim(), i, '');
                          setAddingGoalDayIndex(null);
                          setCalendarGoalTitle('');
                        } else if (e.key === 'Escape') {
                          setAddingGoalDayIndex(null);
                          setCalendarGoalTitle('');
                        }
                      }}
                      style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '11px' }}
                      placeholder="New event..."
                    />
                  </div>
                )}
                {goals.filter(g => g.dayIndex === i).map(g => (
                  <div
                    key={g.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('goalId', g.id)}
                    style={{ background: g.completed ? 'var(--bg-main)' : 'rgba(38, 166, 154, 0.15)', borderLeft: '3px solid #26a69a', padding: '8px', borderRadius: '4px', fontSize: '11px', color: g.completed ? 'var(--text-secondary)' : '#004d40', cursor: 'grab', textDecoration: g.completed ? 'line-through' : 'none', opacity: g.completed ? 0.6 : 1 }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{g.time || 'All Day'}</span>
                      <button onClick={async (e) => { e.stopPropagation(); await onUpdateGoalDayTime(g.id, -1, ''); }} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}><X size={10} /></button>
                    </div>
                    {editingGoalId === g.id ? (
                      <input
                        autoFocus
                        value={editingGoalTitle}
                        onChange={e => setEditingGoalTitle(e.target.value)}
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter' && editingGoalTitle.trim()) {
                            await onUpdateGoal(g.id, editingGoalTitle.trim());
                            setEditingGoalId(null);
                          } else if (e.key === 'Escape') {
                            setEditingGoalId(null);
                          }
                        }}
                        onBlur={async () => {
                          if (editingGoalTitle.trim() && editingGoalTitle.trim() !== g.title) {
                            await onUpdateGoal(g.id, editingGoalTitle.trim());
                          }
                          setEditingGoalId(null);
                        }}
                        style={{ width: '100%', background: 'transparent', border: '1px solid #26a69a', color: 'inherit', outline: 'none', borderRadius: '4px', padding: '2px 4px', fontSize: '11px' }}
                      />
                    ) : (
                      <div
                        onClick={async (e) => { e.stopPropagation(); await onToggleGoal(g.id); }}
                        onDoubleClick={(e) => { e.stopPropagation(); setEditingGoalId(g.id); setEditingGoalTitle(g.title); }}
                        style={{ cursor: 'pointer' }}
                        title="Double-click to edit, Click to toggle"
                      >
                        {g.title}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: 'var(--bg-sidebar)', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
              <Check size={18} color="var(--accent)" /> Weekly Objectives
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {goals.filter(g => g.dayIndex === undefined || g.dayIndex === -1).map(goal => (
                <div
                  key={goal.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('goalId', goal.id)}
                  className={`objective-item ${goal.completed ? 'completed' : ''}`}
                  style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', background: 'var(--card-bg)', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', cursor: 'grab' }}
                >
                  <div
                    onClick={async () => {
                      await onToggleGoal(goal.id);
                    }}
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                      border: goal.completed ? 'none' : '1px solid var(--text-secondary)',
                      background: goal.completed ? '#9ccc65' : 'transparent',
                      marginTop: '2px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {goal.completed && <Check size={12} color="white" />}
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
                    {editingGoalId === goal.id ? (
                      <input
                        autoFocus
                        value={editingGoalTitle}
                        onChange={e => setEditingGoalTitle(e.target.value)}
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter' && editingGoalTitle.trim()) {
                            await onUpdateGoal(goal.id, editingGoalTitle.trim());
                            setEditingGoalId(null);
                          } else if (e.key === 'Escape') {
                            setEditingGoalId(null);
                          }
                        }}
                        onBlur={async () => {
                          if (editingGoalTitle.trim() && editingGoalTitle.trim() !== goal.title) {
                            await onUpdateGoal(goal.id, editingGoalTitle.trim());
                          }
                          setEditingGoalId(null);
                        }}
                        style={{ width: '100%', background: 'transparent', border: '1px solid var(--accent)', color: 'var(--text-primary)', outline: 'none', borderRadius: '4px', padding: '2px 4px', fontSize: '13px' }}
                      />
                    ) : (
                      <span
                        onDoubleClick={() => { setEditingGoalId(goal.id); setEditingGoalTitle(goal.title); }}
                        style={{ fontSize: '13px', fontWeight: 600, color: goal.completed ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: goal.completed ? 'line-through' : 'none', cursor: 'text', lineHeight: '1.4' }}
                      >
                        {goal.title}
                      </span>
                    )}
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{goal.completed ? 'COMPLETED' : 'Pending...'}</span>
                  </div>

                  <button
                    onClick={async () => {
                      await onDeleteGoal(goal.id);
                    }}
                    className="goal-delete-btn"
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {isAddingGoal ? (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'var(--card-bg)', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: '1px solid var(--text-secondary)', flexShrink: 0 }}></div>
                  <input
                    autoFocus
                    value={newGoalTitle}
                    onChange={e => setNewGoalTitle(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' && newGoalTitle.trim()) {
                        await onAddGoal(newGoalTitle.trim());
                        setNewGoalTitle('');
                        setIsAddingGoal(false);
                      } else if (e.key === 'Escape') {
                        setIsAddingGoal(false);
                        setNewGoalTitle('');
                      }
                    }}
                    onBlur={() => {
                      setIsAddingGoal(false);
                      setNewGoalTitle('');
                    }}
                    placeholder="New objective..."
                    style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '13px', padding: '2px 0' }}
                  />
                </div>
              ) : (
                <button onClick={() => setIsAddingGoal(true)} style={{ background: 'transparent', border: '1px dashed var(--text-secondary)', borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                  <Plus size={14} /> Add Objective
                </button>
              )}
            </div>
          </div>

          {books.length > 0 && (
            <div
              style={{ borderRadius: '16px', overflow: 'hidden', position: 'relative', height: '160px', border: '1px solid var(--card-border)', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
              onClick={() => onOpenBook(books[0])}
            >
              <img
                src={getBookCover(books[0]) || 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Phenomenology_of_Perception_cover.jpg/800px-Phenomenology_of_Perception_cover.jpg'}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                alt="Current Read"
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '16px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.1em', marginBottom: '4px' }}>CURRENT READ</span>
                <span style={{ fontSize: '15px', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{books[0].title}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
