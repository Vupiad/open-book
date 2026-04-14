package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"io"
	"net/http"
	"net/url"

	"github.com/google/uuid"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type Book struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Author      string `json:"author"`
	Path        string `json:"path"`
	Progress    int    `json:"progress"`
	CurrentPage int    `json:"currentPage"`
	TotalPages  int    `json:"totalPages"`
	Category    string `json:"category"`
	Cover       string `json:"cover"`
}

// App struct
type App struct {
	ctx        context.Context
	books      []Book
	categories []string
	dataPath   string
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		books:      make([]Book, 0),
		categories: make([]string, 0),
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// Create app data dir
	homeDir, err := os.UserHomeDir()
	if err == nil {
		a.dataPath = filepath.Join(homeDir, ".pdfShelf")
		os.MkdirAll(a.dataPath, 0755)
		a.loadCategories()
		a.loadBooks()
	}
}

func (a *App) loadCategories() {
	if a.dataPath == "" {
		return
	}
	dbPath := filepath.Join(a.dataPath, "categories.json")
	data, err := os.ReadFile(dbPath)
	if err == nil {
		json.Unmarshal(data, &a.categories)
	} else {
		a.categories = []string{}
	}
}

func (a *App) saveCategories() {
	if a.dataPath == "" {
		return
	}
	dbPath := filepath.Join(a.dataPath, "categories.json")
	data, err := json.MarshalIndent(a.categories, "", "  ")
	if err == nil {
		os.WriteFile(dbPath, data, 0644)
	}
}

func (a *App) loadBooks() {
	if a.dataPath == "" {
		return
	}
	dbPath := filepath.Join(a.dataPath, "books.json")
	data, err := os.ReadFile(dbPath)
	if err == nil {
		json.Unmarshal(data, &a.books)

		// Auto-categorize existing un-categorized books
		needsSave := false
		for i := range a.books {
			if a.books[i].Category == "" || a.books[i].Category == "Fiction" { // default previously
				a.books[i].Category = categorizeTitle(a.books[i].Title)
				needsSave = true
			}
		}
		if needsSave {
			a.saveBooks()
		}
	}
}

func categorizeTitle(title string) string {
	lower := strings.ToLower(title)

	fictionKeywords := []string{"novel", "story", "tale", "fiction", "chronicles", "fantasy", "mystery"}
	for _, kw := range fictionKeywords {
		if strings.Contains(lower, kw) {
			return "Fiction"
		}
	}

	eduKeywords := []string{"learn", "guide", "manual", "course", "textbook", "introduction", "tutorial", "programming"}
	for _, kw := range eduKeywords {
		if strings.Contains(lower, kw) {
			return "Education"
		}
	}

	researchKeywords := []string{"paper", "research", "study", "analysis", "science", "journal", "thesis"}
	for _, kw := range researchKeywords {
		if strings.Contains(lower, kw) {
			return "Research"
		}
	}

	return "Non-fiction"
}

func (a *App) saveBooks() {
	if a.dataPath == "" {
		return
	}
	dbPath := filepath.Join(a.dataPath, "books.json")
	data, err := json.MarshalIndent(a.books, "", "  ")
	if err == nil {
		os.WriteFile(dbPath, data, 0644)
	}
}

// GetBooks returns the list of all books
func (a *App) GetBooks() []Book {
	return a.books
}

// SelectAndAddBook opens a file dialog to select a PDF and adds it
func (a *App) SelectAndAddBook() (*Book, error) {
	filePath, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select PDF File",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "PDF Files",
				Pattern:     "*.pdf",
			},
		},
	})

	if err != nil {
		return nil, err
	}
	if filePath == "" {
		return nil, nil // user cancelled
	}

	bookTitle := strings.TrimSuffix(filepath.Base(filePath), filepath.Ext(filePath))
	book := Book{
		ID:       uuid.New().String(),
		Title:    bookTitle,
		Author:   "Unknown Author",
		Path:     filePath,
		Progress: 0,
		Category: categorizeTitle(bookTitle),
	}

	a.books = append(a.books, book)
	a.saveBooks()

	return &book, nil
}

func (a *App) SaveCoverData(bookId string, base64Data string) error {
	for i, b := range a.books {
		if b.ID == bookId {
			a.books[i].Cover = base64Data
			a.saveBooks()
			return nil
		}
	}
	return fmt.Errorf("book not found")
}

func (a *App) DeleteBook(bookId string) error {
	for i, b := range a.books {
		if b.ID == bookId {
			a.books = append(a.books[:i], a.books[i+1:]...)
			a.saveBooks()
			return nil
		}
	}
	return fmt.Errorf("book not found")
}

func (a *App) GetCategories() []string {
	return a.categories
}

func (a *App) AddCategory(cat string) []string {
	if cat == "" {
		return a.categories
	}
	for _, c := range a.categories {
		if strings.EqualFold(c, cat) {
			return a.categories
		}
	}
	a.categories = append(a.categories, cat)
	a.saveCategories()
	return a.categories
}

func (a *App) DeleteCategory(cat string) []string {
	// Cannot delete default categories or empty string
	if cat == "" || cat == "All Works" || cat == "Non-fiction" {
		return a.categories
	}

	for i, c := range a.categories {
		if c == cat {
			a.categories = append(a.categories[:i], a.categories[i+1:]...)
			a.saveCategories()

			// Move books in this category to Non-fiction
			for j, b := range a.books {
				if b.Category == cat {
					a.books[j].Category = "Non-fiction"
				}
			}
			a.saveBooks()
			break
		}
	}
	return a.categories
}

func (a *App) SetBookCategory(bookId string, cat string) error {
	a.AddCategory(cat) // Ensure new category behaves globally natively
	for i, b := range a.books {
		if b.ID == bookId {
			a.books[i].Category = cat
			a.saveBooks()
			return nil
		}
	}
	return fmt.Errorf("book not found")
}

// UpdateProgress saves the current page and total pages for a book, and calculates percentage progress
func (a *App) UpdateProgress(bookId string, currentPage int, totalPages int) error {
	for i, b := range a.books {
		if b.ID == bookId {
			percent := 0
			if totalPages > 0 {
				percent = int(float64(currentPage) / float64(totalPages) * 100)
			}
			if percent > 100 {
				percent = 100
			}
			a.books[i].Progress = percent
			a.books[i].CurrentPage = currentPage
			a.books[i].TotalPages = totalPages
			a.saveBooks()
			return nil
		}
	}
	return fmt.Errorf("book not found")
}

func (a *App) GetBook(bookId string) (*Book, error) {
	for _, b := range a.books {
		if b.ID == bookId {
			return &b, nil
		}
	}
	return nil, fmt.Errorf("book not found")
}

func (a *App) Translate(text string, targetLang string) (string, error) {
	if text == "" {
		return "", nil
	}

	langMap := map[string]string{
		"English":    "en",
		"Vietnamese": "vi",
		"French":     "fr",
		"Japanese":   "ja",
		"Chinese":    "zh-CN",
	}

	tl, ok := langMap[targetLang]
	if !ok {
		tl = "en"
	}

	apiURL := fmt.Sprintf("https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=%s&dt=t&q=%s", tl, url.QueryEscape(text))

	resp, err := http.Get(apiURL)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	bodyMap, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var result []interface{}
	if err := json.Unmarshal(bodyMap, &result); err != nil {
		return "", err
	}

	if len(result) > 0 {
		var translatedText string
		innerArray, ok := result[0].([]interface{})
		if ok {
			for _, slice := range innerArray {
				part, ok := slice.([]interface{})
				if ok && len(part) > 0 {
					if str, ok := part[0].(string); ok {
						translatedText += str
					}
				}
			}
			return translatedText, nil
		}
	}

	return "", fmt.Errorf("failed to parse translation")
}

