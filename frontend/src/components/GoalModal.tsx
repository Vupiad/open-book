import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, BookOpen, Check } from 'lucide-react';
import { pdfjs } from '../pdf';
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
  
  // Automated sections from PDF Table of Contents
  const [availableSections, setAvailableSections] = useState<GoalSection[]>([]);
  const [checkedIndices, setCheckedIndices] = useState<number[]>([]);
  const [isLoadingSections, setIsLoadingSections] = useState(false);

  // Manual custom sections added by user
  const [customSections, setCustomSections] = useState<GoalSection[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialGoal) {
        setTitle(initialGoal.title || '');
        setSelectedBookId(initialGoal.bookId || '');
        // We will match initialGoal.sections against availableSections once loaded,
        // and put any unmatched ones into customSections
      } else {
        setTitle('');
        setSelectedBookId('');
        setAvailableSections([]);
        setCheckedIndices([]);
        setCustomSections([]);
      }
    }
  }, [isOpen, initialGoal]);

  // Load PDF Table of Contents / Outline automatically when a book is selected
  useEffect(() => {
    if (!selectedBookId || !isOpen) {
      setAvailableSections([]);
      setCheckedIndices([]);
      setCustomSections([]);
      return;
    }

    let isMounted = true;
    const fetchOutline = async () => {
      setIsLoadingSections(true);
      try {
        const bk = books.find(b => b.id === selectedBookId);
        const total = bk?.totalPages || 9999;
        
        // Fetch PDF outline from pdf.js
        const doc = await pdfjs.getDocument(`/pdf/${selectedBookId}`).promise;
        const outlineItems = await doc.getOutline();

        if (!isMounted) return;

        const flat: { title: string; page: number }[] = [];
        const traverse = async (items: any[]) => {
          for (const item of items) {
            let page: number | undefined;
            if (item.dest) {
              try {
                const resolvedDest = typeof item.dest === 'string' ? await doc.getDestination(item.dest) : item.dest;
                if (resolvedDest?.[0]) {
                  const pageIndex = await doc.getPageIndex(resolvedDest[0]);
                  page = pageIndex + 1;
                }
              } catch (e) {
                console.warn('Error resolving dest:', e);
              }
            }
            if (page !== undefined && page > 0) {
              flat.push({ title: item.title || 'Section', page });
            }
            if (item.items && item.items.length > 0) {
              await traverse(item.items);
            }
          }
        };

        if (outlineItems && outlineItems.length > 0) {
          await traverse(outlineItems);
        }

        if (!isMounted) return;

        const results: GoalSection[] = [];
        if (flat.length > 0) {
          // Sort by page number ascending
          flat.sort((a, b) => a.page - b.page);
          
          for (let i = 0; i < flat.length; i++) {
            const startPage = flat[i].page;
            let endPage = total;
            if (i < flat.length - 1) {
              endPage = Math.max(startPage, flat[i + 1].page - 1);
            }
            results.push({
              title: flat[i].title,
              startPage,
              endPage
            });
          }
        } else {
          // Fallback if no outline is found in the PDF: divide into smart equal parts
          const numParts = Math.max(1, Math.ceil((bk?.totalPages || 50) / 30));
          const partLen = Math.ceil((bk?.totalPages || 50) / numParts);
          for (let i = 0; i < numParts; i++) {
            const sp = i * partLen + 1;
            const ep = Math.min(total, (i + 1) * partLen);
            results.push({
              title: `Part ${i + 1}`,
              startPage: sp,
              endPage: ep
            });
          }
        }

        setAvailableSections(results);

        // Match initialGoal sections if editing an existing goal
        if (initialGoal && initialGoal.bookId === selectedBookId && initialGoal.sections?.length) {
          const matched: number[] = [];
          const custom: GoalSection[] = [];
          initialGoal.sections.forEach(s => {
            const idx = results.findIndex(r => r.startPage === s.startPage && r.endPage === s.endPage);
            if (idx >= 0) {
              matched.push(idx);
            } else {
              custom.push(s);
            }
          });
          setCheckedIndices(matched.length > 0 ? matched : [0]);
          setCustomSections(custom);
        } else {
          // By default, check the section where currentPage is located
          const currentPg = bk?.currentPage || 1;
          const firstIdx = results.findIndex(s => s.startPage <= currentPg && s.endPage >= currentPg);
          setCheckedIndices([firstIdx >= 0 ? firstIdx : 0]);
          setCustomSections([]);
        }
      } catch (err) {
        console.error('Failed to load PDF sections:', err);
        if (!isMounted) return;
        const bk = books.find(b => b.id === selectedBookId);
        const total = bk?.totalPages || 50;
        setAvailableSections([{ title: 'Entire Book', startPage: 1, endPage: total }]);
        setCheckedIndices([0]);
        setCustomSections([]);
      } finally {
        if (isMounted) setIsLoadingSections(false);
      }
    };

    fetchOutline();
    return () => { isMounted = false; };
  }, [selectedBookId, isOpen]);

  if (!isOpen) return null;

  const selectedBook = books.find(b => b.id === selectedBookId);

  const handleToggleAvailableSection = (idx: number) => {
    if (checkedIndices.includes(idx)) {
      setCheckedIndices(checkedIndices.filter(i => i !== idx));
    } else {
      setCheckedIndices([...checkedIndices, idx].sort((a, b) => a - b));
    }
  };

  const handleAddCustomSection = () => {
    const lastEnd = customSections.length > 0 
      ? customSections[customSections.length - 1].endPage 
      : (availableSections.length > 0 ? availableSections[availableSections.length - 1].endPage : 0);
    const start = lastEnd + 1;
    const end = selectedBook && selectedBook.totalPages ? Math.min(start + 20, selectedBook.totalPages) : start + 10;
    setCustomSections([...customSections, { title: `Custom Range ${customSections.length + 1}`, startPage: start, endPage: end }]);
  };

  const handleRemoveCustomSection = (index: number) => {
    setCustomSections(customSections.filter((_, i) => i !== index));
  };

  const handleCustomSectionChange = (index: number, field: keyof GoalSection, value: string | number) => {
    const updated = [...customSections];
    if (field === 'startPage' || field === 'endPage') {
      const num = typeof value === 'string' ? parseInt(value, 10) || 1 : value;
      updated[index] = { ...updated[index], [field]: Math.max(1, num) };
    } else {
      updated[index] = { ...updated[index], [field]: value as string };
    }
    setCustomSections(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !selectedBook) return;

    const finalTitle = title.trim() || (selectedBook ? `Read ${selectedBook.title}` : 'Untitled Goal');
    const bookTitle = selectedBook ? selectedBook.title : '';

    const finalSections: GoalSection[] = [
      ...checkedIndices.map(idx => availableSections[idx]),
      ...customSections,
    ];

    setIsSubmitting(true);
    try {
      await onSave(finalTitle, selectedBookId, bookTitle, finalSections);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render using React Portal to document.body so it NEVER appears behind sidebars or tabs
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        backdropFilter: 'blur(5px)',
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
          maxWidth: '600px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
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
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={20} color="var(--accent, #68c7d6)" />
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

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
              Link to Book
            </label>
            <select
              value={selectedBookId}
              onChange={(e) => {
                setSelectedBookId(e.target.value);
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
              <option value="">-- Select a Book from your Library --</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} {b.totalPages ? `(${b.totalPages} pages)` : ''}
                </option>
              ))}
            </select>
          </div>

          {selectedBook && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Available Sections (Auto-Detected)
                  </label>
                  {isLoadingSections && (
                    <span style={{ fontSize: '12px', color: 'var(--accent, #68c7d6)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Extracting TOC from PDF...
                    </span>
                  )}
                </div>

                {isLoadingSections ? (
                  <div style={{ padding: '24px', borderRadius: '8px', backgroundColor: 'var(--bg-main, #141414)', border: '1px solid var(--card-border, #333)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    Analyzing book outline and calculating page ranges...
                  </div>
                ) : availableSections.length === 0 ? (
                  <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--bg-main, #141414)', border: '1px dashed var(--card-border, #333)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    No table of contents detected. You can add custom page ranges below.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
                    {availableSections.map((sec, idx) => {
                      const isChecked = checkedIndices.includes(idx);
                      return (
                        <div
                          key={idx}
                          onClick={() => handleToggleAvailableSection(idx)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 14px',
                            borderRadius: '10px',
                            backgroundColor: isChecked ? 'rgba(104, 199, 214, 0.1)' : 'var(--bg-main, #141414)',
                            border: `1px solid ${isChecked ? 'var(--accent, #68c7d6)' : 'var(--card-border, #333)'}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '6px',
                                border: `2px solid ${isChecked ? 'var(--accent, #68c7d6)' : 'var(--text-secondary)'}`,
                                backgroundColor: isChecked ? 'var(--accent, #68c7d6)' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                flexShrink: 0,
                              }}
                            >
                              {isChecked && <Check size={14} strokeWidth={3} />}
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: isChecked ? 600 : 400, color: isChecked ? 'var(--text-primary)' : 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {sec.title}
                            </span>
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: isChecked ? 'var(--accent, #68c7d6)' : 'var(--text-secondary)', backgroundColor: 'var(--bg-card, #202020)', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--card-border, #333)', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                            Pages {sec.startPage} – {sec.endPage}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Optional Custom Sections */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', marginTop: '8px' }}>
                  <label style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Custom Page Ranges (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddCustomSection}
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
                    <Plus size={14} /> Add Custom Range
                  </button>
                </div>

                {customSections.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {customSections.map((sec, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--bg-main, #141414)',
                          border: '1px solid var(--card-border, #333)',
                        }}
                      >
                        <input
                          type="text"
                          placeholder="Title (e.g. Intro)"
                          value={sec.title}
                          onChange={(e) => handleCustomSectionChange(idx, 'title', e.target.value)}
                          style={{
                            flex: 1,
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--card-border, #333)',
                            backgroundColor: 'var(--bg-card, #202020)',
                            color: 'var(--text-primary)',
                            fontSize: '13px',
                            outline: 'none',
                          }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          <span>p.</span>
                          <input
                            type="number"
                            min="1"
                            max={selectedBook.totalPages || 9999}
                            value={sec.startPage || ''}
                            onChange={(e) => handleCustomSectionChange(idx, 'startPage', e.target.value)}
                            style={{
                              width: '64px',
                              padding: '8px',
                              borderRadius: '6px',
                              border: '1px solid var(--card-border, #333)',
                              backgroundColor: 'var(--bg-card, #202020)',
                              color: 'var(--text-primary)',
                              fontSize: '13px',
                              textAlign: 'center',
                              outline: 'none',
                            }}
                          />
                          <span>to</span>
                          <input
                            type="number"
                            min="1"
                            max={selectedBook.totalPages || 9999}
                            value={sec.endPage || ''}
                            onChange={(e) => handleCustomSectionChange(idx, 'endPage', e.target.value)}
                            style={{
                              width: '64px',
                              padding: '8px',
                              borderRadius: '6px',
                              border: '1px solid var(--card-border, #333)',
                              backgroundColor: 'var(--bg-card, #202020)',
                              color: 'var(--text-primary)',
                              fontSize: '13px',
                              textAlign: 'center',
                              outline: 'none',
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomSection(idx)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            padding: '6px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="Remove custom range"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px', borderTop: '1px solid var(--card-border, #333)', paddingTop: '16px' }}>
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
                padding: '10px 22px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--accent, #68c7d6)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                opacity: isSubmitting || (!title.trim() && !selectedBook) ? 0.6 : 1,
                boxShadow: '0 4px 12px rgba(104, 199, 214, 0.3)',
              }}
            >
              {isSubmitting ? 'Saving...' : initialGoal ? 'Save Changes' : 'Create Objective'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
