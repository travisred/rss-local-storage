import { storage } from './storage.js';
import { Feed } from './types.js';

export class RSSFetcher {
  private corsProxies = [
    'https://corsproxy.io/?',
    'https://api.allorigins.win/raw?url=',
    '' // Direct fetch (works for some feeds)
  ];

  async fetchFeed(feed: Feed): Promise<void> {
    let lastError: Error | null = null;
    
    // Try each CORS proxy
    for (const proxy of this.corsProxies) {
      try {
        console.log(`Fetching ${feed.title} from ${feed.url} using proxy: ${proxy || 'direct'}`);
        
        const url = proxy ? proxy + encodeURIComponent(feed.url) : feed.url;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
      
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, 'text/xml');
      
      // Check for parsing errors
      const parserError = xml.querySelector('parsererror');
      if (parserError) {
        throw new Error('XML parsing error');
      }

      // Try to find items in different RSS/Atom formats
      let items = xml.querySelectorAll('item');
      if (items.length === 0) {
        items = xml.querySelectorAll('entry'); // Atom format
      }

      console.log(`Found ${items.length} items for ${feed.title}`);

      items.forEach((item) => {
        const title = this.getElementText(item, 'title');
        let link = this.getElementText(item, 'link');
        
        // Handle Atom-style links
        if (!link) {
          const linkElement = item.querySelector('link');
          link = linkElement?.getAttribute('href') || '';
        }

        const comments = this.getElementText(item, 'comments');

        // Only add if it doesn't already exist
        if (title && link && !storage.itemExists(title, feed.title)) {
          storage.addItem({
            title,
            url: link,
            comments: comments || '',
            site: feed.title,
            isRead: false,
            isStarred: false,
            dateAdded: Date.now()
          });
        }
      });
      
      // If we got here, fetch was successful
      return;
    } catch (error) {
      console.error(`Failed to fetch ${feed.title} with proxy ${proxy || 'direct'}:`, error);
      lastError = error as Error;
      // Try next proxy
    }
    }
    
    // If all proxies failed, throw the last error
    throw new Error(`Failed to fetch ${feed.title} after trying all proxies: ${lastError?.message}`);
  }

  private getElementText(parent: Element, tagName: string): string {
    const element = parent.querySelector(tagName);
    return element?.textContent?.trim() || '';
  }

  async refreshAllFeeds(onProgress?: (current: number, total: number, feedName: string) => void): Promise<void> {
    const activeFeeds = storage.getActiveFeeds();
    
    if (activeFeeds.length === 0) {
      console.log('No active feeds to refresh');
      return;
    }

    console.log(`Refreshing ${activeFeeds.length} feeds`);

    for (let i = 0; i < activeFeeds.length; i++) {
      const feed = activeFeeds[i];
      if (onProgress) {
        onProgress(i + 1, activeFeeds.length, feed.title);
      }
      
      try {
        await this.fetchFeed(feed);
      } catch (error) {
        console.error(`Error fetching feed ${feed.title}:`, error);
        // Continue with other feeds even if one fails
      }
      
      // Small delay between requests to avoid overwhelming servers
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('All feeds refreshed');
  }
}

export const rssFetcher = new RSSFetcher();
