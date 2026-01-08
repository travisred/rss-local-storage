import { storage } from './storage.js';
import { Feed } from './types.js';
import { rssFetcher } from './rss-fetcher.js';

class FeedsManager {
  private editingId: number | null = null;

  constructor() {
    this.initializeEventListeners();
    this.renderFeeds();
  }

  private initializeEventListeners(): void {
    const form = document.getElementById('feed-form') as HTMLFormElement;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    const cancelBtn = document.getElementById('cancel-btn');
    cancelBtn?.addEventListener('click', () => {
      this.cancelEdit();
    });

    // Export/Import
    document.getElementById('link-export')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.exportData();
    });

    document.getElementById('link-import')?.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('import-file')?.click();
    });

    document.getElementById('import-file')?.addEventListener('change', (e) => {
      this.importData(e);
    });
  }

  private handleSubmit(): void {
    const titleInput = document.getElementById('feed-title') as HTMLInputElement;
    const urlInput = document.getElementById('feed-url') as HTMLInputElement;
    const activeInput = document.getElementById('feed-active') as HTMLInputElement;

    const title = titleInput.value.trim();
    const url = urlInput.value.trim();

    if (!title || !url) {
      this.showMessage('Both title and URL are required.', 'error');
      return;
    }

    if (this.editingId !== null) {
      // Update existing feed
      storage.updateFeed(this.editingId, {
        title,
        url,
        isActive: activeInput.checked
      });
      this.showMessage('Feed updated successfully!', 'success');
      this.cancelEdit();
    } else {
      // Add new feed
      storage.addFeed({
        title,
        url,
        isActive: true
      });
      this.showMessage('Feed added successfully!', 'success');
      
      // Clear form
      titleInput.value = '';
      urlInput.value = '';
    }

    this.renderFeeds();
  }

  private editFeed(id: number): void {
    const feed = storage.getFeedById(id);
    if (!feed) return;

    this.editingId = id;

    const titleInput = document.getElementById('feed-title') as HTMLInputElement;
    const urlInput = document.getElementById('feed-url') as HTMLInputElement;
    const activeInput = document.getElementById('feed-active') as HTMLInputElement;
    const activeGroup = document.getElementById('active-group');
    const submitBtn = document.getElementById('submit-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const formTitle = document.getElementById('form-title');
    const pageTitle = document.getElementById('page-title');

    titleInput.value = feed.title;
    urlInput.value = feed.url;
    activeInput.checked = feed.isActive;

    if (activeGroup) activeGroup.style.display = 'block';
    if (submitBtn) submitBtn.textContent = 'Update Feed';
    if (cancelBtn) cancelBtn.style.display = 'inline-block';
    if (formTitle) formTitle.textContent = 'Edit Feed';
    if (pageTitle) pageTitle.textContent = 'Edit Feed';

    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private cancelEdit(): void {
    this.editingId = null;

    const titleInput = document.getElementById('feed-title') as HTMLInputElement;
    const urlInput = document.getElementById('feed-url') as HTMLInputElement;
    const activeInput = document.getElementById('feed-active') as HTMLInputElement;
    const activeGroup = document.getElementById('active-group');
    const submitBtn = document.getElementById('submit-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const formTitle = document.getElementById('form-title');
    const pageTitle = document.getElementById('page-title');

    titleInput.value = '';
    urlInput.value = '';
    activeInput.checked = false;

    if (activeGroup) activeGroup.style.display = 'none';
    if (submitBtn) submitBtn.textContent = 'Add Feed';
    if (cancelBtn) cancelBtn.style.display = 'none';
    if (formTitle) formTitle.textContent = 'Add New Feed';
    if (pageTitle) pageTitle.textContent = 'Manage Feeds';
  }

  private deleteFeed(id: number): void {
    const feed = storage.getFeedById(id);
    if (!feed) return;

    if (confirm(`Are you sure you want to delete "${feed.title}"?`)) {
      storage.deleteFeed(id);
      this.showMessage('Feed deleted successfully!', 'success');
      this.renderFeeds();
    }
  }

  private async refreshFeed(id: number): Promise<void> {
    const feed = storage.getFeedById(id);
    if (!feed) return;

    this.showMessage(`Refreshing ${feed.title}...`, 'success');
    
    try {
      await rssFetcher.fetchFeed(feed);
      this.showMessage(`${feed.title} refreshed successfully!`, 'success');
    } catch (error) {
      this.showMessage(`Error refreshing ${feed.title}: ${(error as Error).message}`, 'error');
      console.error('Refresh error:', error);
    }
  }

  private renderFeeds(): void {
    const feeds = storage.getAllFeeds();
    const container = document.getElementById('feeds');

    if (!container) return;

    if (feeds.length === 0) {
      container.innerHTML = '<p>No feeds yet. Add one above!</p>';
      return;
    }

    container.innerHTML = feeds.map(feed => `
      <div class="feed-item">
        <div>ID: ${feed.id}</div>
        <div>Title: ${this.escapeHtml(feed.title)}</div>
        <div>Link: <a href="${this.escapeHtml(feed.url)}" target="_blank">${this.escapeHtml(feed.url)}</a></div>
        <div>Active: ${feed.isActive ? 'Yes' : 'No'}</div>
        <div>Created At: ${new Date(feed.createdAt).toLocaleString()}</div>
        <div class="actions">
          <a href="#" class="refresh-link" data-id="${feed.id}">Refresh</a>
          <a href="#" class="edit-link" data-id="${feed.id}">Edit</a>
          <a href="#" class="delete-link delete" data-id="${feed.id}">Delete</a>
        </div>
      </div>
    `).join('<hr/>');

    // Attach event listeners
    container.querySelectorAll('.refresh-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const id = parseInt((e.target as HTMLElement).getAttribute('data-id') || '0');
        this.refreshFeed(id);
      });
    });

    container.querySelectorAll('.edit-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const id = parseInt((e.target as HTMLElement).getAttribute('data-id') || '0');
        this.editFeed(id);
      });
    });

    container.querySelectorAll('.delete-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const id = parseInt((e.target as HTMLElement).getAttribute('data-id') || '0');
        this.deleteFeed(id);
      });
    });
  }

  private showMessage(message: string, type: 'success' | 'error'): void {
    const messageDiv = document.getElementById('message');
    if (!messageDiv) return;

    messageDiv.className = type;
    messageDiv.textContent = message;

    // Clear message after 3 seconds
    setTimeout(() => {
      messageDiv.textContent = '';
      messageDiv.className = '';
    }, 3000);
  }

  private exportData(): void {
    try {
      const jsonData = storage.exportData();
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rss-reader-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.showMessage('Data exported successfully!', 'success');
    } catch (error) {
      this.showMessage('Error exporting data: ' + (error as Error).message, 'error');
      console.error('Export error:', error);
    }
  }

  private importData(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = e.target?.result as string;
        storage.importData(jsonData);
        this.showMessage('Data imported successfully! The page will reload in 2 seconds.', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        this.showMessage('Error importing data: ' + (error as Error).message, 'error');
        console.error('Import error:', error);
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    input.value = '';
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new FeedsManager();
});
