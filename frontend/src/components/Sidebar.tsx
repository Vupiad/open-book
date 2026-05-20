import type { Dispatch, SetStateAction } from 'react';
import { Book as BookIcon, LayoutList, Calendar, BookOpen, Settings, HelpCircle, Plus, Trash2, Check } from 'lucide-react';
import type { Goal } from '../types';

type SidebarProps = {
  activeTab: 'library' | 'planner' | 'settings';
  isReaderActive: boolean;
  goals: Goal[];
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
};

export default function Sidebar({
  activeTab,
  isReaderActive,
  goals,
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
  onAddGoal
}: SidebarProps) {
  return (
    <aside className="sidebar">
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
              onClick={() => setIsAddingGoal(true)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="objectives-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {goals.filter(g => g.dayIndex === undefined || g.dayIndex === -1).map(goal => (
              <div key={goal.id} className={`objective-item ${goal.completed ? 'completed' : ''}`} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div
                  onClick={async () => {
                    await onToggleGoal(goal.id);
                  }}
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '4px',
                    border: goal.completed ? 'none' : '1px solid var(--card-border)',
                    background: goal.completed ? 'var(--accent)' : 'transparent',
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
                      onDoubleClick={() => {
                        setEditingGoalId(goal.id);
                        setEditingGoalTitle(goal.title);
                      }}
                      style={{ fontSize: '13px', fontWeight: 500, color: goal.completed ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: goal.completed ? 'line-through' : 'none', cursor: 'text', lineHeight: '1.4' }}
                    >
                      {goal.title}
                    </span>
                  )}
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

            {isAddingGoal && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: '1px solid var(--card-border)', flexShrink: 0 }}></div>
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
            )}
          </div>
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
    </aside>
  );
}
