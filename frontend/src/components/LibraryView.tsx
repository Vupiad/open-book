import { useState, type Dispatch, type SetStateAction } from 'react';
import { Plus, Search, Filter, Bell, X, Trash2 } from 'lucide-react';
import { Document, Page } from '../pdf';
import type { Book } from '../types';

type LibraryViewProps = {
  books: Book[];
  categories: string[];
  activeCategory: string;
  isAddingCategory: boolean;
  newCategoryName: string;
  setIsAddingCategory: Dispatch<SetStateAction<boolean>>;
  setNewCategoryName: Dispatch<SetStateAction<string>>;
  onSelectCategory: (category: string) => void;
  onAddCategory: (category: string) => Promise<void>;
  onDeleteCategory: (category: string) => Promise<void>;
  onRenameCategory: (oldCat: string, newCat: string) => Promise<void>;
  onAddBook: () => void;
  onDeleteBook: (bookId: string) => Promise<void>;
  onOpenBook: (book: Book) => void;
  onSetBookCategory: (bookId: string, category: string) => Promise<void>;
  getBookCover: (book: Book) => string | undefined;
  onCoverReady: (bookId: string, dataUrl: string) => void;
};

const baseCategories = new Set(['Non-fiction', 'Fiction', 'Research', 'Education']);

export default function LibraryView({
  books,
  categories,
  activeCategory,
  isAddingCategory,
  newCategoryName,
  setIsAddingCategory,
  setNewCategoryName,
  onSelectCategory,
  onAddCategory,
  onDeleteCategory,
  onRenameCategory,
  onAddBook,
  onDeleteBook,
  onOpenBook,
  onSetBookCategory,
  getBookCover,
  onCoverReady
}: LibraryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'Recent' | 'Title' | 'Progress'>('Recent');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');

  const visibleBooks = (activeCategory === 'All Works' ? books : books.filter(b => b.category === activeCategory))
    .filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()) || b.author.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortOrder === 'Title') return a.title.localeCompare(b.title);
      if (sortOrder === 'Progress') return (b.progress || 0) - (a.progress || 0);
      return 0; // Default: list order
    });

  return (
    <div className="library-view">
      <header className="topbar">
        <div className="search-bar">
          <Search size={18} color="#707584" />
          <input 
            type="text" 
            placeholder="Search your collection..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="topbar-actions">
          <select 
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="sort-select"
          >
            <option value="Recent">Recently Added</option>
            <option value="Title">Title (A-Z)</option>
            <option value="Progress">Progress</option>
          </select>
          <button className="add-btn" onClick={onAddBook}>
            <Plus size={18} />
            Add Book
          </button>
        </div>
      </header>

      <div className="shelf-section">
        <h1 className="desk-title">The Reading Desk</h1>
        <p className="desk-subtitle">Pick up exactly where you left off in your private study.</p>

        <div className="categories" style={{ flexWrap: 'wrap', gap: '8px' }}>
          <button className={`category-btn ${activeCategory === 'All Works' ? 'active' : ''}`} onClick={() => onSelectCategory('All Works')}>All Works</button>
          {categories.map(cat => (
            <div key={cat} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              {editingCategory === cat ? (
                <input
                  autoFocus
                  type="text"
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  onBlur={async () => {
                    if (editCategoryName.trim() && editCategoryName.trim() !== cat) {
                      await onRenameCategory(cat, editCategoryName.trim());
                    }
                    setEditingCategory(null);
                  }}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      if (editCategoryName.trim() && editCategoryName.trim() !== cat) {
                        await onRenameCategory(cat, editCategoryName.trim());
                      }
                      setEditingCategory(null);
                    } else if (e.key === 'Escape') {
                      setEditingCategory(null);
                    }
                  }}
                  style={{
                    background: 'var(--bg-sidebar)',
                    border: '1px solid var(--accent)',
                    borderRadius: '16px',
                    padding: '6px 12px',
                    fontSize: '13px',
                    outline: 'none',
                    color: 'var(--text-primary)',
                    width: '120px'
                  }}
                />
              ) : (
                <>
                  <button
                    className={`category-btn ${activeCategory === cat ? 'active' : ''}`}
                    onClick={() => onSelectCategory(cat)}
                    onDoubleClick={() => {
                      if (!baseCategories.has(cat)) {
                        setEditingCategory(cat);
                        setEditCategoryName(cat);
                      }
                    }}
                    style={{ paddingRight: !baseCategories.has(cat) ? '32px' : '16px' }}
                    title={!baseCategories.has(cat) ? "Double-click to rename" : ""}
                  >
                    {cat}
                  </button>
                  {!baseCategories.has(cat) && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm(`Delete category "${cat}"? Books will move to Non-fiction.`)) {
                          await onDeleteCategory(cat);
                        }
                      }}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        background: 'transparent',
                        border: 'none',
                        padding: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        color: activeCategory === cat ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)'
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </>
              )}
            </div>
          ))}

          {isAddingCategory ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                autoFocus
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && newCategoryName.trim()) {
                    await onAddCategory(newCategoryName.trim());
                    setNewCategoryName('');
                    setIsAddingCategory(false);
                  } else if (e.key === 'Escape') {
                    setIsAddingCategory(false);
                    setNewCategoryName('');
                  }
                }}
                style={{
                  background: 'var(--bg-sidebar)',
                  border: '1px solid var(--accent)',
                  borderRadius: '16px',
                  padding: '6px 12px',
                  fontSize: '13px',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  width: '120px'
                }}
                placeholder="Name..."
              />
              <button
                onClick={() => {
                  setIsAddingCategory(false);
                  setNewCategoryName('');
                }}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              className="category-btn"
              onClick={() => setIsAddingCategory(true)}
              style={{ border: '1px dashed var(--text-secondary)', background: 'transparent' }}
              title="Create new category"
            >
              <Plus size={14} style={{ marginRight: 4, display: 'inline-block', verticalAlign: 'middle' }} /> Add
            </button>
          )}
        </div>

        <div className="book-grid">
          {visibleBooks.map((book) => (
            <div key={book.id} className="book-card" onClick={() => onOpenBook(book)}>
              <div className="book-cover-wrapper">
                <button
                  className="book-delete-btn"
                  title="Delete book"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (confirm(`Delete "${book.title}"?`)) {
                      await onDeleteBook(book.id);
                    }
                  }}
                >
                  <Trash2 size={14} />
                </button>
                {getBookCover(book) ? (
                  <img
                    src={getBookCover(book)}
                    alt="Cover"
                    className="book-cover"
                  />
                ) : (
                  <div className="pdf-thumbnail-container" data-bookid={book.id}>
                    <Document file={`/pdf/${book.id}`}>
                      <Page
                        pageNumber={1}
                        width={220}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        devicePixelRatio={Math.max(window.devicePixelRatio || 1, 3)}
                        onRenderSuccess={() => {
                          setTimeout(() => {
                            const wrapper = document.querySelector(`[data-bookid="${book.id}"] canvas`) as HTMLCanvasElement;
                            if (wrapper) {
                              const dataUrl = wrapper.toDataURL('image/jpeg', 0.95);
                              onCoverReady(book.id, dataUrl);
                            }
                          }, 100);
                        }}
                      />
                    </Document>
                  </div>
                )}
              </div>
              <div className="book-info">
                <h3 className="book-title" title={book.title}>{book.title}</h3>

                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${book.progress}%` }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', gap: '8px' }}>
                  <select
                    value={book.category || ''}
                    title={book.category || ''}
                    onClick={e => e.stopPropagation()}
                    onMouseDown={e => e.stopPropagation()}
                    onChange={async (e) => {
                      e.stopPropagation();
                      const newCat = e.target.value;
                      await onSetBookCategory(book.id, newCat);
                    }}
                    className="category-select"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="progress-text">{book.progress}%</div>
                </div>
              </div>
            </div>
          ))}
          {visibleBooks.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Search size={48} opacity={0.2} />
              </div>
              <h3 style={{ marginTop: '16px', marginBottom: '8px', color: 'var(--text-primary)', fontSize: '18px' }}>No books found</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
                {books.length === 0 
                  ? "Your shelf is completely bare. Let's fix that!" 
                  : "We couldn't find any books matching your criteria."}
              </p>
              {books.length === 0 && (
                <button className="add-btn" onClick={onAddBook} style={{ margin: '0 auto' }}>
                  <Plus size={18} /> Add Your First Book
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
