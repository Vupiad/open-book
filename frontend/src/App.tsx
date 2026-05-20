import { useState, useEffect, useRef, useMemo, type UIEvent } from 'react';
import { GetBooks, SelectAndAddBook, UpdateProgress, GetCategories, AddCategory, SetBookCategory, SaveCoverData, DeleteCategory, Translate, GetGoals, AddGoal, UpdateGoal, DeleteGoal, ToggleGoal, UpdateGoalDayTime, AddCalendarGoal } from '../wailsjs/go/main/App';
import type { Book, Goal } from './types';
import Sidebar from './components/Sidebar';
import SettingsView from './components/SettingsView';
import PlannerView from './components/PlannerView';
import LibraryView from './components/LibraryView';
import ReaderView from './components/ReaderView';
import { getWeekStart, getWeekDays, formatMonthYear, formatWeekStart } from './utils/week';
import './App.css';

type ActiveTab = 'library' | 'planner' | 'settings';

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('library');
  const [readingBook, setReadingBook] = useState<Book | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1.0);
  const zoomRef = useRef(1.0);
  const gestureZoomRef = useRef(1.0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All Works');
  const [categories, setCategories] = useState<string[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [isTranslatorVisible, setIsTranslatorVisible] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [targetLang, setTargetLang] = useState('English');
  const [isTranslating, setIsTranslating] = useState(false);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingGoalTitle, setEditingGoalTitle] = useState('');
  const [addingGoalDayIndex, setAddingGoalDayIndex] = useState<number | null>(null);
  const [calendarGoalTitle, setCalendarGoalTitle] = useState('');

  const weekStart = useMemo(() => getWeekStart(new Date()), []);
  const currentDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const currentMonthYear = useMemo(() => formatMonthYear(weekStart), [weekStart]);
  const currentWeekFormatted = useMemo(() => formatWeekStart(weekStart), [weekStart]);

  const scrollPageRef = useRef(1);
  const scrollTimeout = useRef<any>(null);
  const readerContainerRef = useRef<HTMLDivElement>(null);
  const coverCache = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    fetchBooks();
    fetchCategories();
    fetchGoals();
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(systemPrefersDark);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const fetchCategories = async () => {
    const fetched = await GetCategories();
    setCategories(fetched || []);
  };

  const fetchGoals = async () => {
    const fetched = await GetGoals();
    setGoals(fetched || []);
  };

  const fetchBooks = async () => {
    const fetched = await GetBooks();
    setBooks(fetched || []);
  };

  const updateZoom = (nextZoom: number) => {
    zoomRef.current = nextZoom;
    gestureZoomRef.current = nextZoom;
    setZoom(nextZoom);
  };

  const openBook = (book: Book) => {
    setActiveTab('library');
    updateZoom(1.0);
    setReadingBook(book);
  };

  const handleNavigate = (tab: ActiveTab) => {
    setActiveTab(tab);
    setReadingBook(null);
    setNumPages(null);
  };

  const handleAddBook = async () => {
    const newBook = await SelectAndAddBook();
    if (newBook) {
      await fetchBooks();
    }
  };

  const handleSetBookCategory = async (bookId: string, newCat: string) => {
    await SetBookCategory(bookId, newCat);
    setBooks(prev => prev.map(b => b.id === bookId ? { ...b, category: newCat } : b));
  };

  const handleAddCategory = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    const updated = await AddCategory(trimmed);
    setCategories(updated);
  };

  const handleDeleteCategory = async (cat: string) => {
    const updated = await DeleteCategory(cat);
    setCategories(updated);
    if (activeCategory === cat) {
      setActiveCategory('All Works');
    }
    await fetchBooks();
  };

  const getBookCover = (book: Book) => book.cover || coverCache.current.get(book.id);

  const handleCoverReady = (bookId: string, dataUrl: string) => {
    coverCache.current.set(bookId, dataUrl);
    SaveCoverData(bookId, dataUrl);
    setBooks(prev => prev.map(b => b.id === bookId ? { ...b, cover: dataUrl } : b));
  };

  const handleAddGoal = async (title: string) => {
    const updated = await AddGoal(title);
    setGoals(updated || []);
  };

  const handleAddCalendarGoal = async (title: string, dayIndex: number, time: string) => {
    const updated = await AddCalendarGoal(title, dayIndex, time);
    setGoals(updated || []);
  };

  const handleUpdateGoalDayTime = async (id: string, dayIndex: number, time: string) => {
    const updated = await UpdateGoalDayTime(id, dayIndex, time);
    setGoals(updated || []);
  };

  const handleUpdateGoal = async (id: string, title: string) => {
    const updated = await UpdateGoal(id, title);
    setGoals(updated || []);
  };

  const handleToggleGoal = async (id: string) => {
    const updated = await ToggleGoal(id);
    setGoals(updated || []);
  };

  const handleDeleteGoal = async (id: string) => {
    const updated = await DeleteGoal(id);
    setGoals(updated || []);
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    if (readingBook) {
      const pageToLoad = readingBook.currentPage || 1;
      setCurrentPage(pageToLoad);
      scrollPageRef.current = pageToLoad;

      setTimeout(() => {
        if (readerContainerRef.current) {
          const target = readerContainerRef.current;
          const pageRenderHeight = target.scrollHeight / numPages;
          target.scrollTop = (pageToLoad - 1) * pageRenderHeight;
        }
      }, 500);
    }
  };

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (!numPages || target.scrollHeight <= target.clientHeight) return;

    const pageRenderHeight = target.scrollHeight / numPages;
    const currentScrollPos = target.scrollTop + (target.clientHeight / 2);
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

  useEffect(() => {
    const container = readerContainerRef.current;
    if (!container) return;

    let rafId = 0;
    let pendingZoom: number | null = null;
    let pendingScrollAdj: { dx: number; dy: number } | null = null;

    const handleGlobalWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;

      e.preventDefault();
      if (!container.contains(e.target as Node)) return;

      const prevZoom = zoomRef.current;
      const zoomMultiplier = Math.exp(-e.deltaY * 0.004);
      const nextZoom = Math.min(4, Math.max(0.2, prevZoom * zoomMultiplier));
      zoomRef.current = nextZoom;

      const rect = container.getBoundingClientRect();
      const pointerX = e.clientX - rect.left;
      const pointerY = e.clientY - rect.top;
      const ratio = nextZoom / prevZoom;

      const dx = (container.scrollLeft + pointerX) * ratio - pointerX - container.scrollLeft;
      const dy = (container.scrollTop + pointerY) * ratio - pointerY - container.scrollTop;
      if (pendingScrollAdj) {
        pendingScrollAdj.dx += dx;
        pendingScrollAdj.dy += dy;
      } else {
        pendingScrollAdj = { dx, dy };
      }

      container.scrollLeft += dx;
      container.scrollTop += dy;

      pendingZoom = nextZoom;
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          if (pendingZoom !== null) {
            gestureZoomRef.current = pendingZoom;
            setZoom(pendingZoom);
            pendingZoom = null;
          }
          pendingScrollAdj = null;
          rafId = 0;
        });
      }
    };

    window.addEventListener('wheel', handleGlobalWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleGlobalWheel);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

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

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [isTranslatorVisible, targetLang]);

  const performTranslation = async (text: string, lang: string) => {
    if (!text) return;
    setIsTranslating(true);
    try {
      const result = await Translate(text, lang);
      setTranslatedText(result);
    } catch (err) {
      setTranslatedText('Error: Translation failed.');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className={`app-container ${!isSidebarVisible ? 'sidebar-hidden' : ''}`}>
      <Sidebar
        activeTab={activeTab}
        isReaderActive={Boolean(readingBook)}
        goals={goals}
        isAddingGoal={isAddingGoal}
        newGoalTitle={newGoalTitle}
        editingGoalId={editingGoalId}
        editingGoalTitle={editingGoalTitle}
        setIsAddingGoal={setIsAddingGoal}
        setNewGoalTitle={setNewGoalTitle}
        setEditingGoalId={setEditingGoalId}
        setEditingGoalTitle={setEditingGoalTitle}
        onNavigate={handleNavigate}
        onToggleGoal={handleToggleGoal}
        onUpdateGoal={handleUpdateGoal}
        onDeleteGoal={handleDeleteGoal}
        onAddGoal={handleAddGoal}
      />
      <main className="main-content">
        {!readingBook ? (
          activeTab === 'settings' ? (
            <SettingsView isDarkMode={isDarkMode} onToggleDarkMode={() => setIsDarkMode(!isDarkMode)} />
          ) : activeTab === 'planner' ? (
            <PlannerView
              currentWeekFormatted={currentWeekFormatted}
              currentMonthYear={currentMonthYear}
              currentDays={currentDays}
              goals={goals}
              books={books}
              getBookCover={getBookCover}
              isAddingGoal={isAddingGoal}
              newGoalTitle={newGoalTitle}
              editingGoalId={editingGoalId}
              editingGoalTitle={editingGoalTitle}
              addingGoalDayIndex={addingGoalDayIndex}
              calendarGoalTitle={calendarGoalTitle}
              setIsAddingGoal={setIsAddingGoal}
              setNewGoalTitle={setNewGoalTitle}
              setEditingGoalId={setEditingGoalId}
              setEditingGoalTitle={setEditingGoalTitle}
              setAddingGoalDayIndex={setAddingGoalDayIndex}
              setCalendarGoalTitle={setCalendarGoalTitle}
              onToggleGoal={handleToggleGoal}
              onUpdateGoal={handleUpdateGoal}
              onDeleteGoal={handleDeleteGoal}
              onAddGoal={handleAddGoal}
              onUpdateGoalDayTime={handleUpdateGoalDayTime}
              onAddCalendarGoal={handleAddCalendarGoal}
              onOpenBook={openBook}
            />
          ) : (
            <LibraryView
              books={books}
              categories={categories}
              activeCategory={activeCategory}
              isAddingCategory={isAddingCategory}
              newCategoryName={newCategoryName}
              setIsAddingCategory={setIsAddingCategory}
              setNewCategoryName={setNewCategoryName}
              onSelectCategory={setActiveCategory}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
              onAddBook={handleAddBook}
              onOpenBook={openBook}
              onSetBookCategory={handleSetBookCategory}
              getBookCover={getBookCover}
              onCoverReady={handleCoverReady}
            />
          )
        ) : (
          <ReaderView
            readingBook={readingBook}
            numPages={numPages}
            currentPage={currentPage}
            zoom={zoom}
            isTranslatorVisible={isTranslatorVisible}
            selectedText={selectedText}
            translatedText={translatedText}
            targetLang={targetLang}
            isTranslating={isTranslating}
            readerContainerRef={readerContainerRef}
            onScroll={handleScroll}
            onDocumentLoadSuccess={onDocumentLoadSuccess}
            onBack={() => {
              setReadingBook(null);
              setNumPages(null);
              setIsSidebarVisible(true);
            }}
            onToggleSidebar={() => setIsSidebarVisible(prev => !prev)}
            onToggleTranslator={() => setIsTranslatorVisible(prev => !prev)}
            onZoomOut={() => updateZoom(Math.max(0.2, zoom / 1.25))}
            onZoomIn={() => updateZoom(Math.min(4, zoom * 1.25))}
            onSetTargetLang={setTargetLang}
          />
        )}
      </main>
    </div>
  );
}
