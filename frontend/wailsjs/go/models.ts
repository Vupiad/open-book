export namespace main {
	
	export class Book {
	    id: string;
	    title: string;
	    author: string;
	    path: string;
	    progress: number;
	    currentPage: number;
	    totalPages: number;
	    category: string;
	    cover: string;
	
	    static createFrom(source: any = {}) {
	        return new Book(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.author = source["author"];
	        this.path = source["path"];
	        this.progress = source["progress"];
	        this.currentPage = source["currentPage"];
	        this.totalPages = source["totalPages"];
	        this.category = source["category"];
	        this.cover = source["cover"];
	    }
	}

}

