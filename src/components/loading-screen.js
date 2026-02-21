// ============================================================
// LIFE OS — Loading Screen with Quotes
// ============================================================

import { $ } from '../utils/dom.js';
import { READING_WPM, MIN_QUOTE_DISPLAY_MS } from '../config.js';

// Fallback quotes (used before Supabase data loads)
const DEFAULT_QUOTES = [
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'Do not wait to strike till the iron is hot, but make it hot by striking.', author: 'W.B. Yeats' },
  { text: 'Your body is the vessel of your ambitions. Fill the flask first.', author: 'PIANKY OS' },
  { text: 'He who has health has hope, and he who has hope has everything.', author: 'Arabian Proverb' },
  { text: 'Small daily improvements over time lead to stunning results.', author: 'Robin Sharma' },
  { text: 'The man who moves a mountain begins by carrying away small stones.', author: 'Confucius' },
  { text: 'Discipline is choosing between what you want now and what you want most.', author: 'Abraham Lincoln' },
];

/**
 * Show loading screen with a random quote
 * @param {Array} quotes - Optional array of { text, author } objects
 * @returns {Promise<void>} Resolves when the quote has been displayed long enough
 */
export function showLoadingScreen(quotes = null) {
  const screen = $('#loading-screen');
  const quoteText = $('#loading-quote-text');
  const quoteAuthor = $('#loading-quote-author');

  if (!screen || !quoteText || !quoteAuthor) return Promise.resolve();

  // Pick a random quote
  const pool = (quotes && quotes.length > 0) ? quotes : DEFAULT_QUOTES;
  const quote = pool[Math.floor(Math.random() * pool.length)];

  // Set content
  quoteText.textContent = `"${quote.text}"`;
  quoteAuthor.textContent = `— ${quote.author || 'Unknown'}`;

  // Calculate display time based on reading speed
  const wordCount = quote.text.split(/\s+/).length;
  const readTimeMs = (wordCount / READING_WPM) * 60 * 1000;
  const displayTime = Math.max(MIN_QUOTE_DISPLAY_MS, readTimeMs);

  // Show with fade
  screen.style.display = 'flex';
  screen.classList.remove('fade-out');

  return new Promise(resolve => {
    // Fade in quote
    requestAnimationFrame(() => {
      quoteText.classList.add('visible');
      quoteAuthor.classList.add('visible');
    });

    setTimeout(() => {
      resolve();
    }, displayTime);
  });
}

/**
 * Hide the loading screen with fade
 */
export function hideLoadingScreen() {
  const screen = $('#loading-screen');
  if (!screen) return;

  screen.classList.add('fade-out');
  setTimeout(() => {
    screen.style.display = 'none';
  }, 600);
}
