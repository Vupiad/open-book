import { useState, useEffect } from 'react';
import { X, Plus, Trash2, BookOpen } from 'lucide-react';
import type { Book, Goal, GoalSection } from '../types';

type GoalModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, bookId: string, bookTitle: string, sections: GoalSection[]) => Promise<void>;
  books?: Book[];
  initialGoal?: Goal | null;
};

export default function GoalModal({
  isOpen,
  onClose,
  onSave,
  books = [],
  initialGoal = null,
}: GoalModalProps) {
  const [title, setTitle] = useState('');
  const [selectedBookId, setSelectedBookId] = useState('');
  const [sections, setSections] = useState<GoalSection[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialGoal) {
        setTitle(initialGoal.title || '');
        setSelectedBookId(initialGoal.bookId || '');
        setSections(initialGoal.sections || []);
      } else {
        setTitle('');
        setSelectedBookId('');
        setSections([]);
      }
    }
  }, [isOpen, initialGoal]);

  if (!isOpen) return null;

  const selectedBook = books.find(b => b.id === selectedBookId);

  const handleAddSection = () => {
    const lastEnd = sections.length > 0 ? sections[sections.length - 1].endPage : 0;
    const start = lastEnd + 1;
    const end = selectedBook && selectedBook.totalPages ? Math.min(start + 20, selectedBook.totalPages) : start + 10;
    setSections([...sections, { title: `Section ${sections.length + 1}`, startPage: start, endPage: end }]);
  };

  const handleRemoveSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const handleSectionChange = (index: number, field: keyof GoalSection, value: string | number) => {
    const updated = [...sections];
    if (field === 'startPage' || field === 'endPage') {
      const num = typeof value === 'string' ? parseInt(value, 10) || 1 : value;
      updated[index] = { ...updated[index], [field]: Math.max(1, num) };
    } else {
      updated[index] = { ...updated[index], [field]: value as string };
    }
    setSections(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !selectedBook) return;

    const finalTitle = title.trim() || (selectedBook ? `Read ${selectedBook.title}` : 'Untitled Goal');
    const bookTitle = selectedBook ? selectedBook.title : '';

    setIsSubmitting(true);
    try {
      await onSave(finalTitle, selectedBookId, bookTitle, sections);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-card, #202020)',
          border: '1px solid var(--card-border, #333)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid var(--card-border, #333)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {initialGoal ? 'Edit Weekly Objective' : 'New Weekly Objective'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Objective Title
            </label>
            <input
              type="text"
              placeholder="e.g. Read Chapters 1 & 2 of Phenomenology"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid var(--card-border, #333)',
                backgroundColor: 'var(--bg-main, #141414)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Link to Book (Optional)
            </label>
            <select
              value={selectedBookId}
              onChange={(e) => {
                setSelectedBookId(e.target.value);
                if (e.target.value && sections.length === 0) {
                  const bk = books.find(b => b.id === e.target.value);
                  const end = bk && bk.totalPages ? Math.min(30, bk.totalPages) : 20;
                  setSections([{ title: 'Part 1', startPage: 1, endPage: end }]);
                }
              }}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid var(--card-border, #333)',
                backgroundColor: 'var(--bg-main, #141414)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="">-- No linked book --</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} {b.totalPages ? `(${b.totalPages} pages)` : ''}
                </option>
              ))}
            </select>
          </div>

          {selectedBook && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Target Reading Sections
                </label>
                <button
                  type="button"
                  onClick={handleAddSection}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent, #68c7d6)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Plus size={14} /> Add Section
                </button>
              </div>

              {sections.length === 0 ? (
                <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--bg-main, #141414)', border: '1px dashed var(--card-border, #333)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  No sections added. Click "+ Add Section" to choose exact page ranges.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {sections.map((sec, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-main, #141414)',
                        border: '1px solid var(--card-border, #333)',
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Section title (e.g. Ch. 1)"
                        value={sec.title}
                        onChange={(e) => handleSectionChange(idx, 'title', e.target.value)}
                        style={{
                          flex: 1,
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--card-border, #333)',
                          backgroundColor: 'var(--bg-card, #202020)',
                          color: 'var(--text-primary)',
                          fontSize: '13px',
                        }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <span>p.</span>
                        <input
                          type="number"
                          min="1"
                          max={selectedBook.totalPages || 9999}
                          value={sec.startPage || ''}
                          onChange={(e) => handleSectionChange(idx, 'startPage', e.target.value)}
                          style={{
                            width: '60px',
                            padding: '8px',
                            borderRadius: '6px',
                            border: '1px solid var(--card-border, #333)',
                            backgroundColor: 'var(--bg-card, #202020)',
                            color: 'var(--text-primary)',
                            fontSize: '13px',
                            textAlign: 'center',
                          }}
                        />
                        <span>to</span>
                        <input
                          type="number"
                          min="1"
                          max={selectedBook.totalPages || 9999}
                          value={sec.endPage || ''}
                          onChange={(e) => handleSectionChange(idx, 'endPage', e.target.value)}
                          style={{
                            width: '60px',
                            padding: '8px',
                            borderRadius: '6px',
                            border: '1px solid var(--card-border, #333)',
                            backgroundColor: 'var(--bg-card, #202020)',
                            color: 'var(--text-primary)',
                            fontSize: '13px',
                            textAlign: 'center',
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSection(idx)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          padding: '6px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title="Remove section"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: '1px solid var(--card-border, #333)',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!title.trim() && !selectedBook)}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--accent, #68c7d6)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                opacity: isSubmitting || (!title.trim() && !selectedBook) ? 0.6 : 1,
              }}
            >
              {isSubmitting ? 'Saving...' : initialGoal ? 'Save Changes' : 'Create Objective'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
