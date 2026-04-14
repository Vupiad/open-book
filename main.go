package main

import (
	"embed"
	"net/http"
	"os"
	"strings"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

type FileLoader struct {
	http.Handler
	app *App
}

func NewFileLoader(app *App) *FileLoader {
	return &FileLoader{app: app}
}

func (h *FileLoader) ServeHTTP(res http.ResponseWriter, req *http.Request) {
	if strings.HasPrefix(req.URL.Path, "/pdf/") {
		bookId := strings.TrimPrefix(req.URL.Path, "/pdf/")
		book, err := h.app.GetBook(bookId)
		if err != nil {
			res.WriteHeader(http.StatusNotFound)
			res.Write([]byte(err.Error()))
			return
		}

		fileData, err := os.ReadFile(book.Path)
		if err != nil {
			res.WriteHeader(http.StatusNotFound)
			res.Write([]byte(err.Error()))
			return
		}

		res.Header().Set("Content-Type", "application/pdf")
		res.WriteHeader(http.StatusOK)
		res.Write(fileData)
		return
	}
	res.WriteHeader(http.StatusNotFound)
}

func main() {
	// Create an instance of the app structure
	app := NewApp()

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "The Archive",
		Width:  1280,
		Height: 800,
		AssetServer: &assetserver.Options{
			Assets:  assets,
			Handler: NewFileLoader(app),
		},
		BackgroundColour: &options.RGBA{R: 247, G: 248, B: 250, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
