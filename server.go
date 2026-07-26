package main

import (
	"encoding/json"
	"fmt"
	"io"
	"io/fs"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

type ServerInfo struct {
	IP   string `json:"ip"`
	Port int    `json:"port"`
	URL  string `json:"url"`
}

func (a *App) GetServerInfo() ServerInfo {
	ip := getLANIP()
	port := 3456
	return ServerInfo{
		IP:   ip,
		Port: port,
		URL:  fmt.Sprintf("http://%s:%d", ip, port),
	}
}

func getLANIP() string {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return "localhost"
	}
	for _, address := range addrs {
		if ipnet, ok := address.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
			if ipnet.IP.To4() != nil {
				return ipnet.IP.String()
			}
		}
	}
	return "localhost"
}

func enableCORS(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
}

func (a *App) startWebServer(port int) {
	mux := http.NewServeMux()

	// PDF Serving
	mux.HandleFunc("/pdf/", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		bookId := strings.TrimPrefix(r.URL.Path, "/pdf/")
		book, err := a.GetBook(bookId)
		if err != nil {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		http.ServeFile(w, r, book.Path)
	})

	// Server info
	mux.HandleFunc("/api/server-info", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		json.NewEncoder(w).Encode(a.GetServerInfo())
	})

	// Books
	mux.HandleFunc("/api/books", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method == "GET" {
			json.NewEncoder(w).Encode(a.GetBooks())
			return
		}
		if r.Method == "DELETE" {
			id := r.URL.Query().Get("id")
			err := a.DeleteBook(id)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			w.WriteHeader(http.StatusOK)
			return
		}
	})

	mux.HandleFunc("/api/books/category", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		var req struct {
			BookId   string `json:"bookId"`
			Category string `json:"category"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err == nil {
			a.SetBookCategory(req.BookId, req.Category)
			w.WriteHeader(http.StatusOK)
		} else {
			http.Error(w, err.Error(), http.StatusBadRequest)
		}
	})

	mux.HandleFunc("/api/progress", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		var req struct {
			BookId      string `json:"bookId"`
			CurrentPage int    `json:"currentPage"`
			TotalPages  int    `json:"totalPages"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err == nil {
			a.UpdateProgress(req.BookId, req.CurrentPage, req.TotalPages)
			w.WriteHeader(http.StatusOK)
		} else {
			http.Error(w, err.Error(), http.StatusBadRequest)
		}
	})

	mux.HandleFunc("/api/cover", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		var req struct {
			BookId     string `json:"bookId"`
			Base64Data string `json:"base64Data"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err == nil {
			a.SaveCoverData(req.BookId, req.Base64Data)
			w.WriteHeader(http.StatusOK)
		} else {
			http.Error(w, err.Error(), http.StatusBadRequest)
		}
	})

	// Categories
	mux.HandleFunc("/api/categories", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method == "GET" {
			json.NewEncoder(w).Encode(a.GetCategories())
			return
		}
		if r.Method == "POST" {
			var req struct {
				Category string `json:"category"`
			}
			if err := json.NewDecoder(r.Body).Decode(&req); err == nil {
				json.NewEncoder(w).Encode(a.AddCategory(req.Category))
			}
			return
		}
		if r.Method == "DELETE" {
			cat := r.URL.Query().Get("category")
			json.NewEncoder(w).Encode(a.DeleteCategory(cat))
			return
		}
	})

	mux.HandleFunc("/api/categories/rename", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		var req struct {
			OldCat string `json:"oldCat"`
			NewCat string `json:"newCat"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err == nil {
			json.NewEncoder(w).Encode(a.RenameCategory(req.OldCat, req.NewCat))
		}
	})

	// Goals
	mux.HandleFunc("/api/goals", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method == "GET" {
			json.NewEncoder(w).Encode(a.GetGoals())
			return
		}
		if r.Method == "DELETE" {
			id := r.URL.Query().Get("id")
			json.NewEncoder(w).Encode(a.DeleteGoal(id))
			return
		}
	})

	mux.HandleFunc("/api/goals/add", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		var req struct {
			Title string `json:"title"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err == nil {
			json.NewEncoder(w).Encode(a.AddGoal(req.Title))
		}
	})

	mux.HandleFunc("/api/goals/add-with-book", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		var req struct {
			Title     string        `json:"title"`
			BookId    string        `json:"bookId"`
			BookTitle string        `json:"bookTitle"`
			Sections  []GoalSection `json:"sections"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err == nil {
			json.NewEncoder(w).Encode(a.AddGoalWithBook(req.Title, req.BookId, req.BookTitle, req.Sections))
		}
	})

	mux.HandleFunc("/api/goals/add-calendar", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		var req struct {
			Title    string `json:"title"`
			DayIndex int    `json:"dayIndex"`
			Time     string `json:"time"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err == nil {
			json.NewEncoder(w).Encode(a.AddCalendarGoal(req.Title, req.DayIndex, req.Time))
		}
	})

	mux.HandleFunc("/api/goals/update", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		var req struct {
			Id    string `json:"id"`
			Title string `json:"title"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err == nil {
			json.NewEncoder(w).Encode(a.UpdateGoal(req.Id, req.Title))
		}
	})

	mux.HandleFunc("/api/goals/update-with-book", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		var req struct {
			Id        string        `json:"id"`
			Title     string        `json:"title"`
			BookId    string        `json:"bookId"`
			BookTitle string        `json:"bookTitle"`
			Sections  []GoalSection `json:"sections"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err == nil {
			json.NewEncoder(w).Encode(a.UpdateGoalWithBook(req.Id, req.Title, req.BookId, req.BookTitle, req.Sections))
		}
	})

	mux.HandleFunc("/api/goals/update-daytime", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		var req struct {
			Id       string `json:"id"`
			DayIndex int    `json:"dayIndex"`
			Time     string `json:"time"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err == nil {
			json.NewEncoder(w).Encode(a.UpdateGoalDayTime(req.Id, req.DayIndex, req.Time))
		}
	})

	mux.HandleFunc("/api/goals/toggle", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		var req struct {
			Id string `json:"id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err == nil {
			json.NewEncoder(w).Encode(a.ToggleGoal(req.Id))
		}
	})

	// Activity & History
	mux.HandleFunc("/api/activity", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		json.NewEncoder(w).Encode(a.GetActivityLog())
	})

	mux.HandleFunc("/api/weekly-history", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		json.NewEncoder(w).Encode(a.GetWeeklyHistory())
	})

	// Translate
	mux.HandleFunc("/api/translate", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		var req struct {
			Text       string `json:"text"`
			TargetLang string `json:"targetLang"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err == nil {
			res, err := a.Translate(req.Text, req.TargetLang)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			json.NewEncoder(w).Encode(map[string]string{"result": res})
		}
	})

	// Upload PDF from mobile
	mux.HandleFunc("/api/upload-pdf", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		file, header, err := r.FormFile("file")
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		defer file.Close()

		tmpPath := filepath.Join(os.TempDir(), header.Filename)
		out, err := os.Create(tmpPath)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		_, err = io.Copy(out, file)
		out.Close()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		book, err := a.AddBookFromPath(tmpPath)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		json.NewEncoder(w).Encode(book)
	})

	// Serve Static Frontend Assets
	subFS, err := fs.Sub(assets, "frontend/dist")
	if err != nil {
		fmt.Println("Error sub FS:", err.Error())
	}
	fileServer := http.FileServer(http.FS(subFS))

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		if strings.HasPrefix(r.URL.Path, "/api/") || strings.HasPrefix(r.URL.Path, "/pdf/") {
			http.NotFound(w, r)
			return
		}
		path := strings.TrimPrefix(r.URL.Path, "/")
		if path != "" && subFS != nil {
			if _, err := subFS.Open(path); err != nil {
				r.URL.Path = "/"
			}
		}
		fileServer.ServeHTTP(w, r)
	})

	addr := fmt.Sprintf("0.0.0.0:%d", port)
	fmt.Printf("Starting Web Server at http://%s\n", addr)
	err = http.ListenAndServe(addr, mux)
	if err != nil {
		fmt.Printf("Web server error: %v\n", err)
	}
}
