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
	    lastRead?: number;
	
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
	        this.lastRead = source["lastRead"];
	    }
	}
	export class GoalSection {
	    title: string;
	    startPage: number;
	    endPage: number;
	
	    static createFrom(source: any = {}) {
	        return new GoalSection(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.title = source["title"];
	        this.startPage = source["startPage"];
	        this.endPage = source["endPage"];
	    }
	}
	export class Goal {
	    id: string;
	    title: string;
	    completed: boolean;
	    dayIndex: number;
	    time: string;
	    bookId: string;
	    bookTitle: string;
	    sections: GoalSection[];
	    progress: number;
	
	    static createFrom(source: any = {}) {
	        return new Goal(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.completed = source["completed"];
	        this.dayIndex = source["dayIndex"];
	        this.time = source["time"];
	        this.bookId = source["bookId"];
	        this.bookTitle = source["bookTitle"];
	        this.sections = this.convertValues(source["sections"], GoalSection);
	        this.progress = source["progress"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class ServerInfo {
	    ip: string;
	    port: number;
	    url: string;
	
	    static createFrom(source: any = {}) {
	        return new ServerInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ip = source["ip"];
	        this.port = source["port"];
	        this.url = source["url"];
	    }
	}
	export class WeeklyHistory {
	    id: string;
	    weekStart: string;
	    weekEnd: string;
	    goals: Goal[];
	    progress: number;
	
	    static createFrom(source: any = {}) {
	        return new WeeklyHistory(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.weekStart = source["weekStart"];
	        this.weekEnd = source["weekEnd"];
	        this.goals = this.convertValues(source["goals"], Goal);
	        this.progress = source["progress"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

