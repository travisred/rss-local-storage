import { RSSItem, Feed, StorageData } from './types.js';

const STORAGE_KEY = 'rss_reader_data';

class Storage {
  private data: StorageData;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): StorageData {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return {
      rssItems: [],
      feeds: [],
      nextItemId: 1,
      nextFeedId: 1
    };
  }

  private saveData(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  // RSS Items methods
  getAllItems(): RSSItem[] {
    return this.data.rssItems;
  }

  getUnreadItems(): RSSItem[] {
    return this.data.rssItems.filter(item => !item.isRead);
  }

  getStarredItems(): RSSItem[] {
    return this.data.rssItems.filter(item => item.isStarred);
  }

  searchItems(query: string): RSSItem[] {
    const lowerQuery = query.toLowerCase();
    return this.data.rssItems.filter(item => 
      item.title.toLowerCase().includes(lowerQuery)
    );
  }

  getItemById(id: number): RSSItem | undefined {
    return this.data.rssItems.find(item => item.id === id);
  }

  addItem(item: Omit<RSSItem, 'id'>): RSSItem {
    const newItem: RSSItem = {
      ...item,
      id: this.data.nextItemId++
    };
    this.data.rssItems.push(newItem);
    this.saveData();
    return newItem;
  }

  markAsRead(id: number): void {
    const item = this.getItemById(id);
    if (item) {
      item.isRead = true;
      this.saveData();
    }
  }

  markSiteAsRead(site: string): void {
    this.data.rssItems.forEach(item => {
      if (item.site === site) {
        item.isRead = true;
      }
    });
    this.saveData();
  }

  toggleStar(id: number): void {
    const item = this.getItemById(id);
    if (item) {
      item.isStarred = !item.isStarred;
      this.saveData();
    }
  }

  deleteItem(id: number): void {
    this.data.rssItems = this.data.rssItems.filter(item => item.id !== id);
    this.saveData();
  }

  // Feed methods
  getAllFeeds(): Feed[] {
    return this.data.feeds;
  }

  getActiveFeeds(): Feed[] {
    return this.data.feeds.filter(feed => feed.isActive);
  }

  getFeedById(id: number): Feed | undefined {
    return this.data.feeds.find(feed => feed.id === id);
  }

  addFeed(feed: Omit<Feed, 'id' | 'createdAt'>): Feed {
    const newFeed: Feed = {
      ...feed,
      id: this.data.nextFeedId++,
      createdAt: Date.now()
    };
    this.data.feeds.push(newFeed);
    this.saveData();
    return newFeed;
  }

  updateFeed(id: number, updates: Partial<Omit<Feed, 'id' | 'createdAt'>>): void {
    const feed = this.getFeedById(id);
    if (feed) {
      Object.assign(feed, updates);
      this.saveData();
    }
  }

  deleteFeed(id: number): void {
    this.data.feeds = this.data.feeds.filter(feed => feed.id !== id);
    this.saveData();
  }

  // Utility methods
  itemExists(title: string, site: string): boolean {
    return this.data.rssItems.some(item => 
      item.title === title && item.site === site
    );
  }

  clearAllItems(): void {
    this.data.rssItems = [];
    this.saveData();
  }

  exportData(): string {
    return JSON.stringify(this.data, null, 2);
  }

  importData(jsonData: string): void {
    try {
      const imported = JSON.parse(jsonData);
      this.data = imported;
      this.saveData();
    } catch (e) {
      throw new Error('Invalid JSON data');
    }
  }
}

export const storage = new Storage();
