export interface RSSItem {
  id: number;
  title: string;
  url: string;
  comments: string;
  site: string;
  isRead: boolean;
  isStarred: boolean;
  dateAdded: number; // timestamp
}

export interface Feed {
  id: number;
  title: string;
  url: string;
  isActive: boolean;
  createdAt: number; // timestamp
}

export interface StorageData {
  rssItems: RSSItem[];
  feeds: Feed[];
  nextItemId: number;
  nextFeedId: number;
}
