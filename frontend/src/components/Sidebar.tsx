import { useState, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { Book as BookIcon, LayoutList, Calendar, BookOpen, Settings, HelpCircle, Plus, Trash2, Check, Edit2 } from 'lucide-react';
import type { Goal, Book, GoalSection } from '../types';
import ProgressRing from './ProgressRing';
import GoalModal from './GoalModal';

type SidebarProps = {
  activeTab: 'library' | 'planner' | 'settings';
  isReaderActive: boolean;
  goals: Goal[];
  books?: Book[];
  isAddingGoal: boolean;
  newGoalTitle: string;
  editingGoalId: string | null;
  editingGoalTitle: string;
  setIsAddingGoal: Dispatch<SetStateAction<boolean>>;
  setNewGoalTitle: Dispatch<SetStateAction<string>>;
  setEditingGoalId: Dispatch<SetStateAction<string | null>>;
  setEditingGoalTitle: Dispatch<SetStateAction<string>>;
  onNavigate: (tab: 'library' | 'planner' | 'settings') => void;
  onToggleGoal: (id: string) => Promise<void>;
  onUpdateGoal: (id: string, title: string) => Promise<void>;
  onDeleteGoal: (id: string) => Promise<void>;
  onAddGoal: (title: string) => Promise<void>;
  onAddGoalWithBook?: (title: string, bookId: string, bookTitle: string, sections: GoalSection[]) => Promise<void>;
  onUpdateGoalWithBook?: (id: string, title: string, bookId: string, bookTitle: string, sections: GoalSection[]) => Promise<void>;
  onOpenBook?: (book: Book, targetPage?: number) => void;
};

export default function Sidebar({
  activeTab,
  isReaderActive,
  goals,
  books = [],
  isAddingGoal,
  newGoalTitle,
  editingGoalId,
  editingGoalTitle,
  setIsAddingGoal,
  setNewGoalTitle,
  setEditingGoalId,
  setEditingGoalTitle,
  onNavigate,
  onToggleGoal,
  onUpdateGoal,
  onDeleteGoal,
  onAddGoal,
  onAddGoalWithBook,
  onUpdateGoalWithBook,
  onOpenBook,
}: SidebarProps) {
  const [width, setWidth] = useState(240);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoalModal, setEditingGoalModal] = useState<Goal | null>(null);
  const isResizing = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      let newWidth = e.clientX;
      if (newWidth < 0) newWidth = 0;
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = 'default';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
  };

  return (
    <aside className="sidebar" style={{ width: `${width}px`, minWidth: `${width}px`, position: 'relative' }}>
      <div 
        onMouseDown={handleMouseDown}
        style={{
          width: '6px',
          cursor: 'col-resize',
          position: 'absolute',
          right: '-3px',
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowX: 'hidden', minWidth: 0 }}>
        <div className="sidebar-header">
          <h2 className="title">The Archive</h2>
        <span className="subtitle">PRIVATE COLLECTION</span>
      </div>

      <nav className="sidebar-nav">
        <a
          href="#"
          className={`nav-item ${activeTab === 'library' && !isReaderActive ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            onNavigate('library');
          }}
        >
          <LayoutList size={20} />
          Library
        </a>
        <a href="#" className={`nav-item ${isReaderActive ? 'active' : ''}`} onClick={(e) => e.preventDefault()}>
          <BookOpen size={20} />
          Reader
        </a>
        <a
          href="#"
          className={`nav-item ${activeTab === 'planner' && !isReaderActive ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            onNavigate('planner');
          }}
        >
          <Calendar size={20} />
          Planner
        </a>
        <a href="#" className="nav-item" onClick={(e) => e.preventDefault()}>
          <BookIcon size={20} />
          Notebook
        </a>
      </nav>

      {activeTab !== 'planner' && (
        <div
          className="sidebar-objectives"
          style={{ padding: '0 24px', marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="subtitle" style={{ margin: 0 }}>
              WEEKLY OBJECTIVES
            </span>
            <button
              onClick={() => {
                setEditingGoalModal(null);
                setIsModalOpen(true);
              }}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
              title="Add weekly objective"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="objectives-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {goals.filter(g => g.dayIndex === undefined || g.dayIndex === -1).map(goal => (
              <div key={goal.id} className={`objective-item ${goal.completed ? 'completed' : ''}`} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '4px 0' }}>
                <ProgressRing
                  progress={goal.progress || 0}
                  completed={goal.completed}
                  size={20}
                  strokeWidth={2.5}
                  onClick={async () => {
                    await onToggleGoal(goal.id);
                  }}
                />

                <div
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden', cursor: goal.bookId ? 'pointer' : 'default' }}
                  onClick={() => {
                    if (goal.bookId && onOpenBook) {
                      const bk = books.find(b => b.id === goal.bookId);
                      if (bk) {
                        const targetPage = goal.sections && goal.sections.length > 0 ? goal.sections[0].startPage : bk.currentPage || 1;
                        onOpenBook(bk, targetPage);
                      }
                    }
                  }}
                  title={goal.bookId ? 'Click to open linked book and section' : undefined}
                >
                  <span
                    onDoubleClick={() => {
                      setEditingGoalModal(goal);
                      setIsModalOpen(true);
                    }}
                    style={{ fontSize: '13px', fontWeight: 500, color: goal.completed ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: goal.completed ? 'line-through' : 'none', lineHeight: '1.4' }}
                  >
                    {goal.title}
                  </span>
                  {goal.bookTitle && (
                    <span style={{ fontSize: '11px', color: 'var(--accent, #68c7d6)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                      📖 {goal.bookTitle} {goal.sections && goal.sections.length > 0 ? `(${goal.sections.length} sec)` : ''}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <button
                    onClick={() => {
                      setEditingGoalModal(goal);
                      setIsModalOpen(true);
                    }}
                    className="goal-delete-btn"
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px' }}
                    title="Edit objective"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    onClick={async () => {
                      await onDeleteGoal(goal.id);
                    }}
                    className="goal-delete-btn"
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px' }}
                    title="Delete objective"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
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
      )}

      <div className="sidebar-footer">
        <span className="subtitle">PREFERENCES</span>
        <a
          href="#"
          className={`nav-item ${activeTab === 'settings' && !isReaderActive ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            onNavigate('settings');
          }}
        >
          <Settings size={20} />
          Settings
        </a>
        <a href="#" className="nav-item" onClick={(e) => e.preventDefault()}>
          <HelpCircle size={20} />
          Support
        </a>

        <div className="user-profile">
          <div className="avatar">JD</div>
          <div className="user-info">
            <span className="name">User</span>
            <span className="role">Premium Curator</span>
          </div>
        </div>
      </div>
      </div>
    </aside>
  );
}
