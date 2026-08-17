const API_URL = 'https://api-5aq2h4pdy-flavio-lucas-projects-ad5e726c.vercel.app';

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

    // Keyboard shortcut: type "admin" to open dashboard
    this.initAdminShortcut();

    console.log('🎯 Portfolio Tracker initialized');
  }

  initAdminShortcut() {
    let buffer = '';
    const target = 'admin';
    const dashboardUrl = 'https://api-a0h4k7kfo-flavio-lucas-projects-ad5e726c.vercel.app/dashboard';

    document.addEventListener('keydown', (e) => {
      // Ignorar se estiver digitando em um input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      buffer += e.key.toLowerCase();
      
      // Manter apenas os últimos 5 caracteres
      if (buffer.length > target.length) {
        buffer = buffer.slice(-target.length);
      }
      
      // Verificar se digitou "admin"
      if (buffer === target) {
        buffer = '';
        window.open(dashboardUrl, '_blank');
        console.log('🔒 Dashboard opened');
      }
    });
  }
}

// Auto-initialize
if (typeof window !== 'undefined') {
  window.portfolioTracker = new PortfolioTracker();
}
