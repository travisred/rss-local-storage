import { storage } from './storage.js';
import { rssFetcher } from './rss-fetcher.js';
import { RSSItem } from './types.js';

type ViewMode = 'unread' | 'starred' | 'search';

class RSSReaderApp {
  private currentMode: ViewMode = 'unread';
  private searchQuery: string = '';

  constructor() {
    this.initializeEventListeners();
    this.render();
  }

  private initializeEventListeners(): void {
    // Navigation links
    document.getElementById('link-unread')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.currentMode = 'unread';
      this.render();
    });

    document.getElementById('link-starred')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.currentMode = 'starred';
      this.render();
    });

    document.getElementById('link-refresh')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.refreshFeeds();
    });

    // Search
    document.getElementById('search-btn')?.addEventListener('click', () => {
      this.performSearch();
    });

    document.getElementById('search-input')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.performSearch();
      }
    });
  }
  
  private performSearch(): void {
    const input = document.getElementById('search-input') as HTMLInputElement;
    this.searchQuery = input.value.trim();
    if (this.searchQuery) {
      this.currentMode = 'search';
      this.render();
    }
  }

  private async refreshFeeds(): Promise<void> {
    const progressDiv = document.getElementById('progress');
    if (progressDiv) {
      progressDiv.style.display = 'block';
      progressDiv.textContent = 'Starting refresh...';
    }

    try {
      await rssFetcher.refreshAllFeeds((current, total, feedName) => {
        if (progressDiv) {
          progressDiv.textContent = `Refreshing ${current}/${total}: ${feedName}`;
        }
      });

      if (progressDiv) {
        progressDiv.textContent = 'Refresh complete!';
        setTimeout(() => {
          progressDiv.style.display = 'none';
        }, 2000);
      }

      this.render();
    } catch (error) {
      if (progressDiv) {
        progressDiv.textContent = 'Error refreshing feeds. Check console for details.';
      }
      console.error('Refresh error:', error);
    }
  }

  private getItems(): RSSItem[] {
    switch (this.currentMode) {
      case 'unread':
        return storage.getUnreadItems();
      case 'starred':
        return storage.getStarredItems();
      case 'search':
        return storage.searchItems(this.searchQuery);
      default:
        return [];
    }
  }

  private render(): void {
    const items = this.getItems();
    const contentDiv = document.getElementById('content');
    
    if (!contentDiv) return;

    if (items.length === 0) {
      contentDiv.innerHTML = '<p>No items to display.</p>';
      return;
    }

    // Group by site
    const itemsBySite = this.groupBySite(items);
    
    let html = '';
    for (const [site, siteItems] of itemsBySite) {
      html += `<h3><a href="#" class="site-link" data-site="${this.escapeHtml(site)}">${this.escapeHtml(site)}</a></h3>`;
      
      siteItems.forEach(item => {
        const starIcon = item.isStarred ? '★' : '☆';
        
        html += `<p class="item">`;
        html += `<a href="#" class="mark-read" data-id="${item.id}">${item.id}</a> - `;
        html += `<a href="${this.escapeHtml(item.url)}" target="_blank">${this.escapeHtml(item.title)}</a>`;
        
        if (item.comments) {
          html += ` - <a href="${this.escapeHtml(item.comments)}" target="_blank">comments</a>`;
        }
        
        html += ` - <a href="#" class="toggle-star" data-id="${item.id}">${starIcon}</a>`;
        html += `</p>`;
      });
    }

    contentDiv.innerHTML = html;

    // Attach event listeners
    this.attachItemEventListeners();
  }

  private attachItemEventListeners(): void {
    // Mark as read
    document.querySelectorAll('.mark-read').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const id = parseInt((e.target as HTMLElement).getAttribute('data-id') || '0');
        storage.markAsRead(id);
        this.render();
      });
    });

    // Toggle star
    document.querySelectorAll('.toggle-star').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const id = parseInt((e.target as HTMLElement).getAttribute('data-id') || '0');
        storage.toggleStar(id);
        // Update just the star icon without full re-render
        (e.target as HTMLElement).textContent = 
          (e.target as HTMLElement).textContent === '★' ? '☆' : '★';
      });
    });

    // Mark site as read
    document.querySelectorAll('.site-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const site = (e.target as HTMLElement).getAttribute('data-site') || '';
        if (confirm(`Mark all items from "${site}" as read?`)) {
          storage.markSiteAsRead(site);
          this.render();
        }
      });
    });
  }

  private groupBySite(items: RSSItem[]): Map<string, RSSItem[]> {
    const grouped = new Map<string, RSSItem[]>();
    
    // Sort by site and then by id descending
    const sortedItems = [...items].sort((a, b) => {
      if (a.site !== b.site) {
        return a.site.localeCompare(b.site);
      }
      return b.id - a.id;
    });

    sortedItems.forEach(item => {
      if (!grouped.has(item.site)) {
        grouped.set(item.site, []);
      }
      grouped.get(item.site)!.push(item);
    });

    return grouped;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new RSSReaderApp();
});
