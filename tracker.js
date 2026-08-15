const API_URL = 'https://api-7g2ijb9xi-flavio-lucas-projects-ad5e726c.vercel.app';

class PortfolioTracker {
  constructor(apiUrl = API_URL) {
    this.apiUrl = apiUrl;
    this.sessionId = this.generateSessionId();
    this.init();
  }

  generateSessionId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  async sendEvent(event, page, metadata = {}) {
    try {
      const response = await fetch(`${this.apiUrl}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event,
          page,
          referrer: document.referrer || null,
          metadata: {
            screen: `${window.screen.width}x${window.screen.height}`,
            language: navigator.language,
            ...metadata,
          },
        }),
      });

      if (!response.ok) {
        console.warn('Tracker: Failed to send event', response.status);
      }
    } catch (error) {
      console.warn('Tracker: API unavailable', error.message);
    }
  }

  trackPageView() {
    this.sendEvent('page_view', window.location.pathname + window.location.hash);
  }

  trackSection(sectionId) {
    this.sendEvent('section_view', sectionId);
  }

  trackProjectClick(projectName) {
    this.sendEvent('project_click', projectName);
  }

  trackCVDownload() {
    this.sendEvent('cv_download', 'cv.pdf');
  }

  trackCVFallback() {
    this.sendEvent('cv_api_fallback', 'cv.pdf');
  }

  init() {
    // Track page view on load
    this.trackPageView();

    // Track sections with Intersection Observer
    const sections = document.querySelectorAll('section[id]');
    if (sections.length > 0) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.trackSection(`#${entry.target.id}`);
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 }
      );

      sections.forEach((section) => observer.observe(section));
    }

    // Track project clicks
    document.querySelectorAll('[data-track-project]').forEach((el) => {
      el.addEventListener('click', () => {
        this.trackProjectClick(el.dataset.trackProject);
      });
    });

    // Track CV download
    document.querySelectorAll('a[href*="cv"], a[href*="download"]').forEach((el) => {
      el.addEventListener('click', () => {
        this.trackCVDownload();
      });
    });

    console.log('🎯 Portfolio Tracker initialized');
  }
}

// Auto-initialize
if (typeof window !== 'undefined') {
  window.portfolioTracker = new PortfolioTracker();
}
