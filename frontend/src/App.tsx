import { useState, useEffect, useRef } from 'react';
import { GetBooks, SelectAndAddBook, UpdateProgress, GetCategories, AddCategory, SetBookCategory, SaveCoverData, DeleteCategory, DeleteBook, Translate } from '../wailsjs/go/main/App';
import { main } from '../wailsjs/go/models';
import { Book as BookIcon, LayoutList, Calendar, BookOpen, Settings, HelpCircle, Plus, Search, Filter, Bell, Moon, Sun, ChevronLeft, Menu, X, Trash2, Languages, ArrowLeftRight, ArrowDown, Sparkles } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import './App.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function App() {
  const [books, setBooks] = useState<main.Book[]>([]);
  const [activeTab, setActiveTab] = useState('library');
  const [readingBook, setReadingBook] = useState<main.Book | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1.0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All Works");
  const [categories, setCategories] = useState<string[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const [isTranslatorVisible, setIsTranslatorVisible] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [targetLang, setTargetLang] = useState("English");
  const [isTranslating, setIsTranslating] = useState(false);



  const scrollPageRef = useRef(1);
  const scrollTimeout = useRef<any>(null);
  const readerContainerRef = useRef<HTMLDivElement>(null);
  // In-memory cover cache — survives navigation without re-rendering PDFs
  const coverCache = useRef<Map<string, string>>(new Map());


  useEffect(() => {
    fetchBooks();
    fetchCategories();
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(systemPrefersDark);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const fetchCategories = async () => {
    const fetched = await GetCategories();
    setCategories(fetched);
  };

  const fetchBooks = async () => {
    const fetched = await GetBooks();
    setBooks(fetched);
  };

  const addHoverBook = async () => {
    const newBook = await SelectAndAddBook();
    if (newBook) {
      await fetchBooks();
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    if (readingBook) {
      const pageToLoad = readingBook.currentPage || 1;
      setCurrentPage(pageToLoad);
      scrollPageRef.current = pageToLoad;

      // Attempt to scroll to previous save point
      setTimeout(() => {
        if (readerContainerRef.current) {
          const target = readerContainerRef.current;
          const pageRenderHeight = target.scrollHeight / numPages;
          target.scrollTop = (pageToLoad - 1) * pageRenderHeight;
        }
      }, 500);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (!numPages || target.scrollHeight <= target.clientHeight) return;

    const pageRenderHeight = target.scrollHeight / numPages;
    const currentScrollPos = target.scrollTop + (target.clientHeight / 2); // Calculate against middle of screen
    let pageNum = Math.floor(currentScrollPos / pageRenderHeight) + 1;

    if (pageNum < 1) pageNum = 1;
    if (pageNum > numPages) pageNum = numPages;

    if (pageNum !== scrollPageRef.current) {
      scrollPageRef.current = pageNum;
      setCurrentPage(pageNum);

      clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        if (readingBook) {
          UpdateProgress(readingBook.id, pageNum, numPages);
          setBooks(prev => prev.map(b => b.id === readingBook.id ? { ...b, currentPage: pageNum, totalPages: numPages, progress: Math.round((pageNum / numPages) * 100) } : b));
        }
      }, 1000);
    }
  };

  const handleWheel = (e: WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      e.stopPropagation();
      
      // Use a smaller multiplier and update zoom proportionally
      // This makes the zoom feel more "elastic" and less jumpy
      const multiplier = 1 - (e.deltaY * 0.001);
      setZoom(z => {
        const nextZoom = z * multiplier;
        // Clamp and limit precision to avoid excessive re-renders from tiny floats
        return Math.min(4, Math.max(0.2, Math.round(nextZoom * 100) / 100));
      });
    }
  };

  // Attach native non-passive wheel listener so preventDefault() works
  useEffect(() => {
    const container = readerContainerRef.current;
    if (!container) return;
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  });

  // Handle text selection for translation
  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      if (text) {
        setSelectedText(text);
        if (isTranslatorVisible) {
          performTranslation(text, targetLang);
        }
      }
    };
    
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [isTranslatorVisible, targetLang]);

  const performTranslation = async (text: string, lang: string) => {
    if (!text) return;
    setIsTranslating(true);
    try {
      const result = await Translate(text, lang);
      setTranslatedText(result);
    } catch (err) {
      setTranslatedText("Error: Translation failed.");
    } finally {
      setIsTranslating(false);
    }
  };


  return (
    <div className={`app-container ${!isSidebarVisible ? 'sidebar-hidden' : ''}`}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2 className="title">The Archive</h2>
          <span className="subtitle">PRIVATE COLLECTION</span>
        </div>

        <nav className="sidebar-nav">
          <a href="#" className={`nav-item ${activeTab === 'library' && !readingBook ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('library'); setReadingBook(null); setNumPages(null); }}>
            <LayoutList size={20} />
            Library
          </a>
          <a href="#" className={`nav-item ${readingBook ? 'active' : ''}`} onClick={(e) => e.preventDefault()}>
            <BookOpen size={20} />
            Reader
          </a>
          <a href="#" className="nav-item" onClick={(e) => e.preventDefault()}>
            <Calendar size={20} />
            Planner
          </a>
          <a href="#" className="nav-item" onClick={(e) => e.preventDefault()}>
            <BookIcon size={20} />
            Notebook
          </a>
        </nav>

        <div className="sidebar-footer">
          <span className="subtitle">PREFERENCES</span>
          <a href="#" className={`nav-item ${activeTab === 'settings' && !readingBook ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('settings'); setReadingBook(null); setNumPages(null); }}>
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

      {/* Main Content */}
      <main className="main-content">
        {!readingBook ? (
          activeTab === 'settings' ? (
            <div className="settings-view" style={{ padding: '40px' }}>
              <h1 className="desk-title">Settings</h1>
              <div className="settings-section" style={{ marginTop: '32px', backgroundColor: 'var(--card-bg)', borderRadius: '16px', padding: '24px', border: '1px solid var(--card-border)' }}>
                <h2 style={{ fontSize: '18px', margin: '0 0 16px', color: 'var(--text-primary)' }}>Appearance</h2>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderTop: '1px solid var(--card-border)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)' }}>Dark Mode</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Toggle between light and dark theme</span>
                  </div>
                  <div>
                    <button
                      onClick={() => setIsDarkMode(!isDarkMode)}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '20px', border: '1px solid var(--card-border)', background: 'var(--bg-main)', color: 'var(--text-primary)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}
                    >
                      {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                      {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="library-view">
              {/* Topbar */}
              <header className="topbar">
                <div className="search-bar">
                  <Search size={18} color="#707584" />
                  <input type="text" placeholder="Search your editorial collection..." />
                </div>
                <div className="topbar-actions">
                  <button className="icon-btn"><Filter size={20} /></button>
                  <button className="icon-btn"><Bell size={20} /></button>
                  <button className="add-btn" onClick={addHoverBook}>
                    <Plus size={18} />
                    Add Book
                  </button>
                </div>
              </header>

              <div className="shelf-section">
                <h1 className="desk-title">The Reading Desk</h1>
                <p className="desk-subtitle">Pick up exactly where you left off in your private study.</p>

                <div className="categories" style={{ flexWrap: 'wrap', gap: '8px' }}>
                  <button className={`category-btn ${activeCategory === "All Works" ? 'active' : ''}`} onClick={() => setActiveCategory("All Works")}>All Works</button>
                  {categories.map(cat => (
                    <div key={cat} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <button 
                        className={`category-btn ${activeCategory === cat ? 'active' : ''}`} 
                        onClick={() => setActiveCategory(cat)}
                        style={{ paddingRight: (cat !== "Non-fiction" && cat !== "Fiction" && cat !== "Research" && cat !== "Education") ? '32px' : '16px' }}
                      >
                        {cat}
                      </button>
                      {(cat !== "Non-fiction" && cat !== "Fiction" && cat !== "Research" && cat !== "Education") && (
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            if(confirm(`Delete category "${cat}"? Books will move to Non-fiction.`)) {
                              const updated = await DeleteCategory(cat);
                              setCategories(updated);
                              if(activeCategory === cat) setActiveCategory("All Works");
                              await fetchBooks();
                            }
                          }}
                          style={{
                            position: 'absolute', right: '8px', background: 'transparent', border: 'none', 
                            padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                            color: activeCategory === cat ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)'
                          }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {isAddingCategory ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input 
                        autoFocus
                        type="text" 
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        onKeyDown={async (e) => {
                          if(e.key === 'Enter' && newCatName.trim()) {
                            const updated = await AddCategory(newCatName.trim());
                            setCategories(updated);
                            setNewCatName("");
                            setIsAddingCategory(false);
                          } else if(e.key === 'Escape') {
                            setIsAddingCategory(false);
                            setNewCatName("");
                          }
                        }}
                        style={{
                          background: 'var(--bg-sidebar)', border: '1px solid var(--accent)', 
                          borderRadius: '16px', padding: '6px 12px', fontSize: '13px', 
                          outline: 'none', color: 'var(--text-primary)', width: '120px'
                        }}
                        placeholder="Name..."
                      />
                      <button 
                        onClick={() => { setIsAddingCategory(false); setNewCatName(""); }}
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
                {(activeCategory === "All Works" ? books : books.filter(b => b.category === activeCategory)).map((book) => (
                    <div key={book.id} className="book-card" onClick={() => { setZoom(1.0); setReadingBook(book); }}>
                      <div className="book-cover-wrapper">

                        {/* Use saved cover, then in-memory cache, then render live (first time only) */}
                        {(book.cover || coverCache.current.get(book.id)) ? (
                          <img 
                            src={book.cover || coverCache.current.get(book.id)} 
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
                                    const wrapper = document.querySelector(
                                      `[data-bookid="${book.id}"] canvas`
                                    ) as HTMLCanvasElement;
                                    if (wrapper) {
                                      const dataUrl = wrapper.toDataURL('image/jpeg', 0.95);
                                      coverCache.current.set(book.id, dataUrl);
                                      SaveCoverData(book.id, dataUrl);
                                      setBooks(prev => prev.map(b =>
                                        b.id === book.id ? { ...b, cover: dataUrl } : b
                                      ));
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
                        <p className="book-author">{book.author}</p>
                        
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${book.progress}%` }}></div>
                        </div>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px'}}>
                           <select 
                             value={book.category || ''} 
                             onClick={e => e.stopPropagation()} 
                             onMouseDown={e => e.stopPropagation()}
                             onChange={async (e) => {
                                e.stopPropagation();
                                const newCat = e.target.value;
                                await SetBookCategory(book.id, newCat);
                                setBooks(prev => prev.map(b => b.id === book.id ? {...b, category: newCat} : b));
                             }}
                             style={{
                               background: 'var(--card-bg)', color: 'var(--text-secondary)', 
                               border: '1px solid var(--card-border)', borderRadius: '6px', 
                               padding: '3px 6px', fontSize: '11px', cursor: 'pointer',
                               maxWidth: '90px', outline: 'none'
                             }}
                           >
                             {categories.map(c => <option key={c} value={c}>{c}</option>)}
                           </select>
                           <div className="progress-text">{book.progress}%</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(activeCategory === "All Works" ? books : books.filter(b => b.category === activeCategory)).length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#707584' }}>
                      No books inside this category yet. Click "Add Book" to get started!
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="reader-view">
            <header className="reader-topbar">
              <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <button className="icon-btn" onClick={() => setIsSidebarVisible(!isSidebarVisible)} style={{background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)'}}>
                  <Menu size={20} />
                </button>
                <button className="back-btn" onClick={() => { setReadingBook(null); setNumPages(null); setIsSidebarVisible(true); }}>
                  <ChevronLeft size={20} /> Back to Library
                </button>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <span className="progress-text-reader" style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>Page {currentPage} of {numPages || '--'}</span>
                {numPages && <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>· {Math.round((currentPage / numPages) * 100)}%</span>}
              </div>
              <div className="reader-controls">
                <button 
                  className={`icon-btn ${isTranslatorVisible ? 'active' : ''}`} 
                  onClick={() => setIsTranslatorVisible(!isTranslatorVisible)}
                  style={{ color: isTranslatorVisible ? 'var(--accent)' : 'var(--text-secondary)', marginRight: '16px' }}
                  title="Translator"
                >
                  <Languages size={20} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-sidebar)', padding: '4px 12px', borderRadius: '16px' }}>
                  <button onClick={() => setZoom(z => Math.max(0.2, z - 0.2))} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--text-secondary)' }}>-</button>
                  <span style={{ fontSize: '13px', fontWeight: 500, minWidth: '40px', textAlign: 'center', color: 'var(--text-primary)' }}>{Math.round(zoom * 100)}%</span>
                  <button onClick={() => setZoom(z => Math.min(4, z + 0.2))} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--text-secondary)' }}>+</button>
                </div>
              </div>
            </header>
            <div className="reader-layout" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              <div className="reader-container" ref={readerContainerRef} onScroll={handleScroll} style={{ flex: 1 }}>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Document
                  file={`/pdf/${readingBook.id}`}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={<div className="loading">Loading PDF...</div>}
                  externalLinkTarget="_blank"
                >
                  {Array.from(new Array(numPages || 0), (el, index) => {
                    const pageNumber = index + 1;
                    const isVisible = pageNumber >= currentPage - 3 && pageNumber <= currentPage + 3;
                    
                    return (
                      <div 
                        key={`page_${pageNumber}`} 
                        style={{ 
                          marginBottom: "24px", 
                          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                          minHeight: isVisible ? 'auto' : `${842 * zoom}px`,
                          width: isVisible ? 'auto' : `${595 * zoom}px`,
                          backgroundColor: '#ffffff',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                      >
                        {isVisible ? (
                          <Page
                            pageNumber={pageNumber}
                            scale={zoom}
                            renderTextLayer={true}
                            renderAnnotationLayer={true}
                            devicePixelRatio={window.devicePixelRatio || 1}
                          />
                        ) : (
                          <div style={{ color: '#aaa', fontSize: '14px' }}>Page {pageNumber}</div>
                        )}
                      </div>
                    );
                  })}
                </Document>
              </div>
            </div>
            
            {isTranslatorVisible && (
              <aside className="translator-sidebar" style={{
                width: '380px', borderLeft: '1px solid var(--card-border)', background: 'var(--bg-sidebar)',
                display: 'flex', flexDirection: 'column', padding: '28px 24px', boxShadow: '-4px 0 24px rgba(0,0,0,0.03)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: '"Playfair Display", serif' }}>
                    <div style={{ background: 'var(--accent)', color: 'white', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                       <Languages size={18} />
                    </div>
                    Translator
                  </h3>
                  <button onClick={() => setIsTranslatorVisible(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'color 0.2s', padding: '4px' }}>
                    <X size={20} />
                  </button>
                </div>

                <div className="trans-section" style={{ marginBottom: '24px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={12} /> Target Language
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select 
                      value={targetLang}
                      onChange={(e) => setTargetLang(e.target.value)}
                      style={{
                        appearance: 'none', width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--card-border)',
                        background: 'var(--card-bg)', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500, outline: 'none',
                        cursor: 'pointer', transition: 'border-color 0.2s, box-shadow 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--card-border)'}
                    >
                      <option value="English">English</option>
                      <option value="Vietnamese">Vietnamese</option>
                      <option value="French">French</option>
                      <option value="Japanese">Japanese</option>
                      <option value="Chinese">Chinese</option>
                    </select>
                    <ArrowDown size={14} color="var(--text-secondary)" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  </div>
                </div>

                <div className="trans-content" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '10px', letterSpacing: '0.08em' }}>Source Text</span>
                    <div style={{ 
                      padding: '16px', borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                      fontSize: '14.5px', lineHeight: '1.6', color: 'var(--text-primary)', minHeight: '80px',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)', wordBreak: 'break-word'
                    }}>
                      {selectedText || <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Highlight text in the document to translate it instantly...</span>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-secondary)', padding: '4px 0' }}>
                     <div style={{ background: 'var(--progress-bg)', padding: '6px', borderRadius: '50%' }}>
                        <ArrowDown size={16} />
                     </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Translation Result</span>
                      {isTranslating && <div className="spinner-small" style={{ width: '12px', height: '12px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>}
                    </div>
                    <div style={{ 
                      padding: '16px', borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--accent)', color: 'var(--text-primary)',
                      fontSize: '14.5px', lineHeight: '1.6', minHeight: '80px',
                      boxShadow: '0 8px 24px rgba(17, 66, 73, 0.08)', wordBreak: 'break-word'
                    }}>
                      <div style={{ filter: isTranslating ? 'blur(2px)' : 'none', transition: 'filter 0.2s', opacity: isTranslating ? 0.6 : 1 }}>
                        {translatedText || <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Results will appear here...</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--card-border)' }}>
                   <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                     <img src="https://upload.wikimedia.org/wikipedia/commons/d/d7/Google_Translate_logo.svg" alt="Google Translate" style={{ width: '16px', height: '16px', opacity: 0.8 }} onError={(e) => e.currentTarget.style.display = 'none'} />
                     <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, margin: 0, letterSpacing: '0.02em' }}>
                       Powered by Google
                     </p>
                   </div>
                </div>
              </aside>
            )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
