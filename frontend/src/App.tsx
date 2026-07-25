import { useState, useEffect, useRef, useMemo, type UIEvent, type ComponentProps } from 'react';
import { GetBooks, SelectAndAddBook, AddBookFromPath, UpdateProgress, GetCategories, AddCategory, SetBookCategory, SaveCoverData, DeleteCategory, DeleteBook, Translate, GetGoals, AddGoal, UpdateGoal, DeleteGoal, ToggleGoal, UpdateGoalDayTime, AddCalendarGoal, RenameCategory, AddGoalWithBook, UpdateGoalWithBook, GetWeeklyHistory } from '../wailsjs/go/main/App';
import { OnFileDrop, OnFileDropOff } from '../wailsjs/runtime/runtime';
import type { Book, Goal, GoalSection, WeeklyHistory, OutlineEntry, UserSettings } from './types';
import Sidebar from './components/Sidebar';
import SettingsView from './components/SettingsView';
import PlannerView from './components/PlannerView';
import LibraryView from './components/LibraryView';
import ReaderView from './components/ReaderView';
import { getWeekStart, getWeekDays, formatMonthYear, formatWeekStart } from './utils/week';
import './App.css';

type ActiveTab = 'library' | 'planner' | 'settings';
type PdfOutlineItem = {
  title: string;
  dest?: string | any[] | null;
  items?: PdfOutlineItem[];
};
type ReaderOnDocumentLoadSuccess = NonNullable<ComponentProps<typeof ReaderView>['onDocumentLoadSuccess']>;
type PdfDocument = Parameters<ReaderOnDocumentLoadSuccess>[0];

const baseCategories = ['Non-fiction', 'Fiction', 'Research', 'Education'];
const baseCategorySet = new Set(baseCategories);

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('library');
  const [readingBook, setReadingBook] = useState<Book | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [outline, setOutline] = useState<OutlineEntry[]>([]);
  const [isOutlineVisible, setIsOutlineVisible] = useState(false);
  const [zoom, setZoom] = useState(1.0);
  const zoomRef = useRef(1.0);
  const gestureZoomRef = useRef(1.0);
  const [currentPage, setCurrentPage] = useState(1);
  const [settings, setSettings] = useState<UserSettings>(() => {
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const defaults: UserSettings = {
      theme: systemPrefersDark ? 'dark' : 'light',
      accent: '#68c7d6',
    };
    try {
      const saved = localStorage.getItem('open-book-settings');
      if (saved) {
        return { ...defaults, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to parse saved settings', e);
    }
    return defaults;
  });

  const handleUpdateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleResetSettings = () => {
    setSettings({
      theme: 'dark',
      accent: '#68c7d6',
    });
  };
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All Works');
  const [categories, setCategories] = useState<string[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [isTranslatorVisible, setIsTranslatorVisible] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [targetLang, setTargetLang] = useState('Vietnamese');
  const [isTranslating, setIsTranslating] = useState(false);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [weeklyHistory, setWeeklyHistory] = useState<WeeklyHistory[]>([]);
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
  const categoryOptions = useMemo(() => {
    const customCategories = new Set<string>();
    categories.forEach(cat => customCategories.add(cat));
    books.forEach(book => {
      if (book.category) {
        customCategories.add(book.category);
      }
    });
    const customList = Array.from(customCategories).filter(cat => cat && !baseCategorySet.has(cat));
    customList.sort((a, b) => a.localeCompare(b));
    return [...baseCategories, ...customList];
  }, [books, categories]);

  const pendingTargetPageRef = useRef<number | null>(null);
  const [pageJumpRequest, setPageJumpRequest] = useState<number | null>(null);
  const scrollPageRef = useRef(1);
  const scrollTimeout = useRef<any>(null);
  const translateTimeoutRef = useRef<number | null>(null);
  const readerContainerRef = useRef<HTMLDivElement>(null);
  const coverCache = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    fetchBooks();
    fetchCategories();
    fetchGoals();
  }, []);

  useEffect(() => {
    OnFileDrop(async (x: number, y: number, paths: string[]) => {
      if (paths && paths.length > 0) {
        let added = false;
        for (const p of paths) {
          if (p.toLowerCase().endsWith('.pdf')) {
            try {
              await AddBookFromPath(p);
              added = true;
            } catch (err) {
              console.error('Failed to add book from drop', err);
            }
          }
        }
        if (added) {
          await fetchBooks();
        }
      }
    }, true);
    return () => OnFileDropOff();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
    document.documentElement.style.setProperty('--accent', settings.accent);
    localStorage.setItem('open-book-settings', JSON.stringify(settings));
  }, [settings]);

  const fetchCategories = async () => {
    const fetched = await GetCategories();
    setCategories(fetched || []);
  };

  const fetchGoals = async () => {
    const fetched = await GetGoals();
    setGoals(fetched || []);
    const hist = await GetWeeklyHistory();
    setWeeklyHistory(hist || []);
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

  const buildOutline = async (items: PdfOutlineItem[] | null, pdfDoc: PdfDocument): Promise<OutlineEntry[]> => {
    if (!items || items.length === 0) return [];

    return Promise.all(items.map(async (item) => {
      let pageNumber: number | undefined;
      if (item.dest) {
        const resolvedDest = typeof item.dest === 'string' ? await pdfDoc.getDestination(item.dest) : item.dest;
        if (resolvedDest?.[0]) {
          const pageIndex = await pdfDoc.getPageIndex(resolvedDest[0]);
          pageNumber = pageIndex + 1;
        }
      }

      const children = await buildOutline(item.items || [], pdfDoc);
      return {
        title: item.title || 'Untitled section',
        pageNumber,
        items: children
      };
    }));
  };

  const openBook = (book: Book, targetPage?: number) => {
    setActiveTab('library');
    updateZoom(1.0);
    setOutline([]);
    setIsOutlineVisible(false);
    if (book.id !== readingBook?.id) {
      setNumPages(null);
    }
    const pageToOpen = targetPage || book.currentPage || 1;
    if (targetPage) {
      pendingTargetPageRef.current = targetPage;
      setPageJumpRequest(targetPage);
    } else {
      pendingTargetPageRef.current = null;
      setPageJumpRequest(null);
    }
    setCurrentPage(pageToOpen);
    scrollPageRef.current = pageToOpen;
    setReadingBook(book);
  };

  const handleNavigate = (tab: ActiveTab) => {
    setActiveTab(tab);
    setReadingBook(null);
    setNumPages(null);
    fetchGoals();
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

  const handleDeleteCategory = async (name: string) => {
    const cats = await DeleteCategory(name);
    setCategories(cats);
    if (activeCategory === name) {
      setActiveCategory('All Works');
    }
    await fetchBooks();
  };

  const handleRenameCategory = async (oldName: string, newName: string) => {
    const cats = await RenameCategory(oldName, newName);
    setCategories(cats);
    if (activeCategory === oldName) {
      setActiveCategory(newName);
    }
    await fetchBooks();
  };

  const handleDeleteBook = async (bookId: string) => {
    await DeleteBook(bookId);
    coverCache.current.delete(bookId);
    setBooks(prev => prev.filter(b => b.id !== bookId));
    if (readingBook?.id === bookId) {
      setReadingBook(null);
      setNumPages(null);
      setIsSidebarVisible(true);
    }
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

  const handleAddGoalWithBook = async (title: string, bookId: string, bookTitle: string, sections: GoalSection[]) => {
    const updated = await AddGoalWithBook(title, bookId, bookTitle, sections);
    setGoals(updated || []);
  };

  const handleUpdateGoalWithBook = async (id: string, title: string, bookId: string, bookTitle: string, sections: GoalSection[]) => {
    const updated = await UpdateGoalWithBook(id, title, bookId, bookTitle, sections);
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

  const loadOutline = async (pdfDoc: PdfDocument) => {
    const nextOutline = await buildOutline(await pdfDoc.getOutline(), pdfDoc);
    setOutline(nextOutline);
  };

  const onDocumentLoadSuccess: ReaderOnDocumentLoadSuccess = (pdfDoc) => {
    setNumPages(pdfDoc.numPages);
    loadOutline(pdfDoc);
    if (readingBook) {
      const pageToLoad = pendingTargetPageRef.current !== null ? pendingTargetPageRef.current : (readingBook.currentPage || 1);
      pendingTargetPageRef.current = null;
      setCurrentPage(pageToLoad);
      scrollPageRef.current = pageToLoad;
      if (pageToLoad) {
        setPageJumpRequest(pageToLoad);
      }
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
          UpdateProgress(readingBook.id, pageNum, numPages).then(() => {
            fetchGoals();
          });
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

  const scheduleTranslation = (text: string, lang: string) => {
    if (!text.trim()) {
      setTranslatedText('');
      return;
    }
    if (translateTimeoutRef.current) {
      window.clearTimeout(translateTimeoutRef.current);
    }
    translateTimeoutRef.current = window.setTimeout(() => {
      performTranslation(text, lang);
    }, 400);
  };

  const isSelectionInReader = (node: Node | null) => {
    if (!node || !readerContainerRef.current) return false;
    const element = node instanceof HTMLElement ? node : node.parentElement;
    return Boolean(element && readerContainerRef.current.contains(element));
  };

  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      if (!text) return;
      const inReader = isSelectionInReader(selection?.anchorNode || null) || isSelectionInReader(selection?.focusNode || null);
      if (!inReader) return;
      setSelectedText(text);
      if (isTranslatorVisible) {
        scheduleTranslation(text, targetLang);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [isTranslatorVisible, targetLang]);

  useEffect(() => {
    if (isTranslatorVisible && selectedText.trim()) {
      scheduleTranslation(selectedText, targetLang);
    }
  }, [isTranslatorVisible, selectedText, targetLang]);

  useEffect(() => () => {
    if (translateTimeoutRef.current) {
      window.clearTimeout(translateTimeoutRef.current);
    }
  }, []);

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

  const speechLangMap: Record<string, string> = {
    English: 'en-US',
    Vietnamese: 'vi-VN',
    French: 'fr-FR',
    Japanese: 'ja-JP',
    Chinese: 'zh-CN'
  };

  const speakText = (text: string, lang: string = 'en-US') => {
    const trimmed = text.trim();
    if (!trimmed) return;

    try {
      const langCode = lang.split('-')[0];
      const safeText = trimmed.slice(0, 200);
      const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(safeText)}&tl=${langCode}&client=tw-ob`;
      const audio = new Audio(url);
      
      audio.play().catch(e => {
        console.warn('Audio play failed, falling back to window.speechSynthesis', e);
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(trimmed);
          utterance.lang = lang;
          window.speechSynthesis.speak(utterance);
        }
      });
    } catch (err) {
      console.error('Speech error', err);
    }
  };

  const handleSourceTextChange = (text: string) => {
    setSelectedText(text);
    if (isTranslatorVisible) {
      scheduleTranslation(text, targetLang);
    }
  };



  const handleOutlineJump = (pageNumber: number) => {
    scrollPageRef.current = pageNumber;
    setCurrentPage(pageNumber);
    setPageJumpRequest(pageNumber);
  };

  return (
    <div className={`app-container ${!isSidebarVisible ? 'sidebar-hidden' : ''}`}>
      <Sidebar
        activeTab={activeTab}
        isReaderActive={Boolean(readingBook)}
        goals={goals}
        books={books}
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
        onAddGoalWithBook={handleAddGoalWithBook}
        onUpdateGoalWithBook={handleUpdateGoalWithBook}
        onOpenBook={openBook}
      />
      <main className="main-content">
        {!readingBook ? (
          activeTab === 'settings' ? (
            <SettingsView
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onResetSettings={handleResetSettings}
            />
          ) : activeTab === 'planner' ? (
            <PlannerView
              currentWeekFormatted={currentWeekFormatted}
              currentMonthYear={currentMonthYear}
              currentDays={currentDays}
              goals={goals}
              weeklyHistory={weeklyHistory}
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
              onAddGoalWithBook={handleAddGoalWithBook}
              onUpdateGoalWithBook={handleUpdateGoalWithBook}
              onUpdateGoalDayTime={handleUpdateGoalDayTime}
              onAddCalendarGoal={handleAddCalendarGoal}
              onOpenBook={openBook}
            />
          ) : (
            <LibraryView
              books={books}
              categories={categoryOptions}
              activeCategory={activeCategory}
              isAddingCategory={isAddingCategory}
              newCategoryName={newCategoryName}
              setIsAddingCategory={setIsAddingCategory}
              setNewCategoryName={setNewCategoryName}
              onSelectCategory={setActiveCategory}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
              onRenameCategory={handleRenameCategory}
              onDeleteBook={handleDeleteBook}
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
              outline={outline}
              isOutlineVisible={isOutlineVisible}
              isTranslatorVisible={isTranslatorVisible}
              selectedText={selectedText}
              translatedText={translatedText}
              targetLang={targetLang}
              isTranslating={isTranslating}
              readerContainerRef={readerContainerRef}
              onScroll={handleScroll}
              onDocumentLoadSuccess={onDocumentLoadSuccess}
              onOutlineJump={handleOutlineJump}
              onBack={() => {
                setReadingBook(null);
                setNumPages(null);
                setOutline([]);
                setIsOutlineVisible(false);
                setIsSidebarVisible(true);
                fetchGoals();
              }}
              onToggleSidebar={() => setIsSidebarVisible(prev => !prev)}
              onToggleOutline={() => setIsOutlineVisible(prev => !prev)}
              onToggleTranslator={() => setIsTranslatorVisible(prev => !prev)}
              onZoomOut={() => updateZoom(Math.max(0.2, zoom / 1.25))}
              onZoomIn={() => updateZoom(Math.min(4, zoom * 1.25))}
              onSetTargetLang={setTargetLang}
              onSourceTextChange={handleSourceTextChange}
              onSpeakSource={() => speakText(selectedText, navigator.language)}
              onSpeakTarget={() => speakText(translatedText, speechLangMap[targetLang] ?? navigator.language)}
              pageJumpRequest={pageJumpRequest}
              onClearPageJump={() => setPageJumpRequest(null)}
            />
        )}
      </main>
    </div>
  );
}
