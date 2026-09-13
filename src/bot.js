const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const config = require('../config');
const { attachAudioInterceptor } = require('./interceptor');

class SoundtrapBot {
  constructor() {
    this.browserContext = null;
    this.page = null;
    this.isRunning = false;
    this.crawlerActive = false;
  }

  async loadCookies(context) {
    if (fs.existsSync(config.cookiesFile)) {
      try {
        const cookiesRaw = fs.readFileSync(config.cookiesFile, 'utf8');
        const cookies = JSON.parse(cookiesRaw);
        if (Array.isArray(cookies) && cookies.length > 0) {
          // Sanitize cookie objects for Playwright
          const validCookies = cookies.map(c => {
            const cookie = {
              name: c.name,
              value: c.value,
              domain: c.domain,
              path: c.path || '/',
              httpOnly: !!c.httpOnly,
              secure: !!c.secure
            };
            if (c.sameSite) {
              const ss = c.sameSite.toLowerCase();
              if (ss === 'strict') cookie.sameSite = 'Strict';
              else if (ss === 'lax') cookie.sameSite = 'Lax';
              else if (ss === 'none' || ss === 'no_restriction') cookie.sameSite = 'None';
            }
            if (c.expirationDate && typeof c.expirationDate === 'number') {
              cookie.expires = Math.floor(c.expirationDate);
            }
            return cookie;
          });

          await context.addCookies(validCookies);
          console.log(`🍪 Successfully injected ${validCookies.length} session cookies.`);
        }
      } catch (err) {
        console.warn('⚠️ Could not load cookies:', err.message);
      }
    }
  }

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log('🚀 Launching Chromium with persistent session...');
    if (!fs.existsSync(config.sessionDir)) {
      fs.mkdirSync(config.sessionDir, { recursive: true });
    }

    this.browserContext = await chromium.launchPersistentContext(config.sessionDir, {
      headless: config.headless,
      viewport: { width: 1440, height: 900 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      args: [
        '--autoplay-policy=no-user-gesture-required',
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });

    // Inject cookies
    await this.loadCookies(this.browserContext);

    // Get primary page
    const pages = this.browserContext.pages();
    this.page = pages.length > 0 ? pages[0] : await this.browserContext.newPage();

    // Attach the audio interceptor to capture all incoming audio files
    attachAudioInterceptor(this.page);

    // Also attach to any newly opened tabs/popups (e.g. Studio opening in a new tab)
    this.browserContext.on('page', (newPage) => {
      console.log('📑 New browser tab opened, attaching interceptor...');
      attachAudioInterceptor(newPage);
    });

    console.log(`🌐 Navigating to ${config.soundtrapUrl}...`);
    try {
      await this.page.goto(config.soundtrapUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
      console.log('✅ Page loaded. URL:', this.page.url());
    } catch (err) {
      console.warn('⚠️ Navigation timeout or warning:', err.message);
    }

    // Start automated crawler loop
    this.startAutoCrawler();
  }

  async startAutoCrawler() {
    if (this.crawlerActive) return;
    this.crawlerActive = true;
    console.log('🤖 Auto-crawler started. Scanning for loop browser and audio previews...');

    // Periodically search for audio preview triggers or loop elements
    const crawlerLoop = async () => {
      if (!this.isRunning || !this.crawlerActive) return;

      try {
        const currentPage = this.browserContext.pages().slice(-1)[0] || this.page;
        const currentUrl = currentPage.url();

        // 1. If we are on the projects home page and there's a Studio / "Enter Studio" button, click it
        if (currentUrl.includes('/projects') || currentUrl.includes('/home')) {
          const studioButton = await currentPage.$(
            'button:has-text("Enter studio"), a:has-text("Enter studio"), button:has-text("Stüdyoya gir"), a:has-text("Stüdyoya gir"), button:has-text("New project"), a:has-text("New project"), [data-test="enter-studio-button"]'
          );
          if (studioButton) {
            console.log('🖱️ Clicking "Enter Studio" to access Soundtrap loop library...');
            await studioButton.click();
            await currentPage.waitForTimeout(5000);
          }
        }

        // 2. If we are in the Studio
        if (currentUrl.includes('/studio')) {
          // Look for loops library toggle button if closed
          const loopPanelToggle = await currentPage.$(
            'button[aria-label*="Loops" i], button[title*="Loops" i], [data-test*="loop" i], .loop-browser-toggle'
          );
          if (loopPanelToggle) {
            const isVisible = await loopPanelToggle.isVisible();
            if (isVisible) {
              await loopPanelToggle.click().catch(() => {});
            }
          }

          // Search for preview/play buttons in the loop list
          const playButtons = await currentPage.$$(
            '[data-test*="preview" i], button[title*="Play" i], button[aria-label*="Play" i], .loop-item button, [class*="playButton"], [class*="PlayButton"]'
          );

          if (playButtons.length > 0) {
            console.log(`🎶 Found ${playButtons.length} audio preview buttons in current view.`);
            for (let i = 0; i < Math.min(playButtons.length, 10); i++) {
              if (!this.crawlerActive) break;
              try {
                const btn = playButtons[i];
                if (await btn.isVisible()) {
                  await btn.scrollIntoViewIfNeeded();
                  await btn.click({ timeout: 1500 });
                  // Wait for network response to trigger & audio stream to begin
                  await currentPage.waitForTimeout(1800);
                }
              } catch (e) {
                // Ignore individual click errors and continue
              }
            }
          }

          // Scroll down the loop container or page to load more virtualized items
          await currentPage.evaluate(() => {
            const scrollContainers = document.querySelectorAll(
              '[class*="loop" i][class*="list" i], [class*="scroll" i], .virtual-list, [data-test*="list" i]'
            );
            if (scrollContainers.length > 0) {
              scrollContainers.forEach(c => c.scrollBy({ top: 400, behavior: 'smooth' }));
            } else {
              window.scrollBy({ top: 400, behavior: 'smooth' });
            }
          });
        }
      } catch (err) {
        // Suppress benign DOM traversal warnings
      }

      // Schedule next crawl cycle
      setTimeout(crawlerLoop, config.autoScrollDelayMs);
    };

    // Kick off crawler loop after initial grace period
    setTimeout(crawlerLoop, 5000);
  }

  async stop() {
    this.isRunning = false;
    this.crawlerActive = false;
    if (this.browserContext) {
      await this.browserContext.close();
      this.browserContext = null;
    }
    console.log('🛑 Soundtrap bot stopped.');
  }
}

const bot = new SoundtrapBot();

if (require.main === module) {
  bot.start().catch(console.error);
}

module.exports = bot;
