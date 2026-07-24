import { useState, useEffect, useRef, type RefObject, type UIEvent, type ComponentProps } from 'react';
import { Menu, ChevronLeft, Languages, ArrowDown, Sparkles, X, Volume2, List } from 'lucide-react';
import { Document, Page } from '../pdf';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import type { Book, OutlineEntry } from '../types';

type OnDocumentLoadSuccess = NonNullable<ComponentProps<typeof Document>['onLoadSuccess']>;

type ReaderViewProps = {
  readingBook: Book;
  numPages: number | null;
  currentPage: number;
  zoom: number;
  outline: OutlineEntry[];
  isOutlineVisible: boolean;
  isTranslatorVisible: boolean;
  selectedText: string;
  translatedText: string;
  targetLang: string;
  isTranslating: boolean;
  readerContainerRef: RefObject<HTMLDivElement>;
  onScroll: (event: UIEvent<HTMLDivElement>) => void;
  onDocumentLoadSuccess: OnDocumentLoadSuccess;
  onOutlineJump: (pageNumber: number) => void;
  onBack: () => void;
  onToggleSidebar: () => void;
  onToggleOutline: () => void;
  onToggleTranslator: () => void;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onSetTargetLang: (lang: string) => void;
  onSourceTextChange: (text: string) => void;
  onSpeakSource: () => void;
  onSpeakTarget: () => void;
};

export default function ReaderView({
  readingBook,
  numPages,
  currentPage,
  zoom,
  outline,
  isOutlineVisible,
  isTranslatorVisible,
  selectedText,
  translatedText,
  targetLang,
  isTranslating,
  readerContainerRef,
  onScroll,
  onDocumentLoadSuccess,
  onOutlineJump,
  onBack,
  onToggleSidebar,
  onToggleOutline,
  onToggleTranslator,
  onZoomOut,
  onZoomIn,
  onSetTargetLang,
  onSourceTextChange,
  onSpeakSource,
  onSpeakTarget
}: ReaderViewProps) {
  const [expandedOutline, setExpandedOutline] = useState<Set<string>>(() => new Set());
  const [scrollParent, setScrollParent] = useState<HTMLElement | undefined>(undefined);
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  useEffect(() => {
    if (readerContainerRef.current) {
      setScrollParent(readerContainerRef.current);
    }
  }, [readerContainerRef]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;

      const container = readerContainerRef.current;
      if (!container) return;

      switch (e.key) {
        case 'ArrowDown':
          container.scrollBy({ top: 50, behavior: 'auto' });
          e.preventDefault();
          break;
        case 'ArrowUp':
          container.scrollBy({ top: -50, behavior: 'auto' });
          e.preventDefault();
          break;
        case 'PageDown':
        case ' ':
          if (e.shiftKey && e.key === ' ') {
            container.scrollBy({ top: -container.clientHeight * 0.8, behavior: 'smooth' });
          } else {
            container.scrollBy({ top: container.clientHeight * 0.8, behavior: 'smooth' });
          }
          e.preventDefault();
          break;
        case 'PageUp':
          container.scrollBy({ top: -container.clientHeight * 0.8, behavior: 'smooth' });
          e.preventDefault();
          break;
        case '=':
        case '+':
          if (e.ctrlKey || e.metaKey) {
            onZoomIn();
            e.preventDefault();
          }
          break;
        case '-':
        case '_':
          if (e.ctrlKey || e.metaKey) {
            onZoomOut();
            e.preventDefault();
          }
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readerContainerRef, onZoomIn, onZoomOut]);

  const speakerButtonStyle = {
    border: '1px solid var(--card-border)',
    background: 'var(--card-bg)',
    color: 'var(--text-secondary)',
    borderRadius: '8px',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  } as const;

  const toggleOutlineItem = (key: string) => {
    setExpandedOutline((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const renderOutlineItems = (items: OutlineEntry[], path: number[] = []) => (
    items.map((item, index) => {
      const itemPath = [...path, index];
      const key = itemPath.join('.');
      const hasChildren = item.items.length > 0;
      const isExpanded = expandedOutline.has(key);
      const isActive = item.pageNumber === currentPage;

      return (
        <div key={key} className="outline-item" style={{ paddingLeft: `${path.length * 14}px` }}>
          <div className={`outline-button-row ${isActive ? 'active' : ''}`}>
            {hasChildren ? (
              <button
                className="outline-caret-btn"
                onClick={() => toggleOutlineItem(key)}
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                <span className="outline-caret">{isExpanded ? 'v' : '>'}</span>
              </button>
            ) : (
              <span className="outline-caret-placeholder"></span>
            )}
            <button
              className="outline-title-btn"
              onClick={() => {
                if (item.pageNumber) {
                  virtuosoRef.current?.scrollToIndex({ index: item.pageNumber - 1, align: 'start' });
                  onOutlineJump(item.pageNumber);
                }
              }}
              disabled={!item.pageNumber}
              title={item.pageNumber ? `Go to page ${item.pageNumber}` : item.title}
            >
              <span className="outline-title-text">{item.title || 'Untitled section'}</span>
              {item.pageNumber && <span className="outline-page-number">{item.pageNumber}</span>}
            </button>
          </div>
          {hasChildren && isExpanded ? renderOutlineItems(item.items, itemPath) : null}
        </div>
      );
    })
  );

  return (
    <div className="reader-view">
      <header className="reader-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className={`icon-btn ${isOutlineVisible ? 'active' : ''}`}
            onClick={onToggleOutline}
            style={{ color: isOutlineVisible ? 'var(--accent)' : 'var(--text-secondary)' }}
            title="Contents"
          >
            <List size={20} />
          </button>
          <button className="icon-btn" onClick={onToggleSidebar} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} title="App sidebar">
            <Menu size={20} />
          </button>
          <button className="back-btn" onClick={onBack}>
            <ChevronLeft size={20} /> Back to Library
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="progress-text-reader" style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
            Page {currentPage} of {numPages || '--'}
          </span>
          {numPages && <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>· {Math.round((currentPage / numPages) * 100)}%</span>}
        </div>
        <div className="reader-controls">
          <button
            className={`icon-btn ${isTranslatorVisible ? 'active' : ''}`}
            onClick={onToggleTranslator}
            style={{ color: isTranslatorVisible ? 'var(--accent)' : 'var(--text-secondary)', marginRight: '16px' }}
            title="Translator"
          >
            <Languages size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-sidebar)', padding: '4px 12px', borderRadius: '16px' }}>
            <button onClick={onZoomOut} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--text-secondary)' }}>-</button>
            <span style={{ fontSize: '13px', fontWeight: 500, minWidth: '40px', textAlign: 'center', color: 'var(--text-primary)' }}>{Math.round(zoom * 100)}%</span>
            <button onClick={onZoomIn} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--text-secondary)' }}>+</button>
          </div>
        </div>
      </header>
      <div className="reader-layout" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <aside className={`reader-outline ${isOutlineVisible ? '' : 'hidden'}`} aria-label="Table of contents">
          <div className="outline-header-row">
            <span className="outline-header">Contents</span>
            <button className="outline-hide-btn" onClick={onToggleOutline} title="Hide contents">
              <X size={14} />
            </button>
          </div>
          {outline.length === 0 ? (
            <div className="outline-empty">No outline available</div>
          ) : (
            <nav className="outline-list">
              {renderOutlineItems(outline)}
            </nav>
          )}
        </aside>
        <div className="reader-container" ref={readerContainerRef} onScroll={onScroll} style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Document
              file={`/pdf/${readingBook.id}`}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<div className="loading">Loading PDF...</div>}
              externalLinkTarget="_blank"
            >
              {scrollParent && numPages ? (
                <Virtuoso
                  ref={virtuosoRef}
                  key={readingBook.id}
                  initialTopMostItemIndex={Math.max(0, currentPage - 1)}
                  useWindowScroll={false}
                  customScrollParent={scrollParent}
                  totalCount={numPages}
                  overscan={10}
                  itemContent={(index) => {
                    const pageNumber = index + 1;
                    return (
                      <div
                        style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: '24px' }}
                      >
                        <div
                          data-page-number={pageNumber}
                          style={{
                            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                            minHeight: `${842 * zoom}px`,
                            width: `${595 * zoom}px`,
                            backgroundColor: '#ffffff',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            animation: 'pageFadeIn 0.4s ease-out forwards'
                          }}
                        >
                          <Page
                            pageNumber={pageNumber}
                            scale={zoom}
                            renderTextLayer={true}
                            renderAnnotationLayer={true}
                            devicePixelRatio={window.devicePixelRatio || 1}
                            loading={<div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: '12px' }}>Loading...</div>}
                          />
                        </div>
                      </div>
                    );
                  }}
                />
              ) : null}
            </Document>
          </div>
        </div>

        {isTranslatorVisible && (
          <aside
            className="translator-sidebar"
            style={{
              width: '380px',
              borderLeft: '1px solid var(--card-border)',
              background: 'var(--bg-sidebar)',
              display: 'flex',
              flexDirection: 'column',
              padding: '28px 24px',
              boxShadow: '-4px 0 24px rgba(0,0,0,0.03)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: '"Playfair Display", serif' }}>
                <div style={{ background: 'var(--accent)', color: 'white', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                  <Languages size={18} />
                </div>
                Translator
              </h3>
              <button onClick={onToggleTranslator} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'color 0.2s', padding: '4px' }}>
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
                  onChange={(e) => onSetTargetLang(e.target.value)}
                  style={{
                    appearance: 'none',
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid var(--card-border)',
                    background: 'var(--card-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: 500,
                    outline: 'none',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s, box-shadow 0.2s'
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Source Text</span>
                  <button
                    onClick={onSpeakSource}
                    style={{ ...speakerButtonStyle, opacity: selectedText ? 1 : 0.5, cursor: selectedText ? 'pointer' : 'not-allowed' }}
                    title="Speak source text"
                    disabled={!selectedText}
                  >
                    <Volume2 size={14} />
                  </button>
                </div>
                <textarea
                  value={selectedText}
                  onChange={(e) => onSourceTextChange(e.target.value)}
                  placeholder="Highlight text in the document to translate it instantly..."
                  style={{
                    padding: '16px',
                    borderRadius: '16px',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    fontSize: '14.5px',
                    lineHeight: '1.6',
                    color: 'var(--text-primary)',
                    minHeight: '120px',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                    wordBreak: 'break-word',
                    width: '100%',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-secondary)', padding: '4px 0' }}>
                <div style={{ background: 'var(--progress-bg)', padding: '6px', borderRadius: '50%' }}>
                  <ArrowDown size={16} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Translation Result</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={onSpeakTarget}
                      style={{ ...speakerButtonStyle, opacity: translatedText ? 1 : 0.5, cursor: translatedText ? 'pointer' : 'not-allowed' }}
                      title="Speak translated text"
                      disabled={!translatedText}
                    >
                      <Volume2 size={14} />
                    </button>
                    {isTranslating && <div className="spinner-small" style={{ width: '12px', height: '12px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>}
                  </div>
                </div>
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '16px',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--accent)',
                    color: 'var(--text-primary)',
                    fontSize: '14.5px',
                    lineHeight: '1.6',
                    minHeight: '80px',
                    boxShadow: '0 8px 24px rgba(17, 66, 73, 0.08)',
                    wordBreak: 'break-word'
                  }}
                >
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
  );
}
