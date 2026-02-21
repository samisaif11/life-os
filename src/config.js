// ============================================================
// LIFE OS — Configuration
// ============================================================

// --- Supabase ---
// Replace these with your actual Supabase project credentials
// Find them at: Supabase Dashboard → Settings → API
export const SUPABASE_URL = 'YOUR_SUPABASE_URL';
export const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// --- PIANKY Hierarchy (5 Tiers) ---
export const TIERS = {
  1: {
    name: 'The Crystal Flask of Aman',
    shortName: 'Health',
    color: '#D4AF37',
    weight: 1.50,
    baseXp: 6.75,
    icon: '⚗️',
  },
  2: {
    name: "The Father's Legacy",
    shortName: 'Legacy',
    color: '#CD7F32',
    weight: 1.35,
    baseXp: 5.80,
    icon: '📜',
  },
  3: {
    name: 'Sovereign Self',
    shortName: 'Growth',
    color: '#4169E1',
    weight: 1.15,
    baseXp: 5.25,
    icon: '👑',
  },
  4: {
    name: 'PIĀNKY PICTURES',
    shortName: 'Empire',
    color: '#9B59B6',
    weight: 1.00,
    baseXp: 4.80,
    icon: '🎬',
  },
  5: {
    name: 'PIĀNKY OS',
    shortName: 'Architect',
    color: '#00CED1',
    weight: 0.85,
    baseXp: 3.75,
    icon: '💻',
  },
};

// --- XP Calculation ---
export const XP_CONFIG = {
  // Health multiplier: 2x if today's health minimum is met
  healthMultiplierValue: 2.0,
  defaultMultiplier: 1.0,

  // Streak bonus: 1.0 base + 0.05 per day, caps at 1.50 (10-day streak)
  streakBonusPerDay: 0.05,
  streakBonusCap: 1.50,
  streakBonusBase: 1.0,

  // XP for leveling up (each level requires more XP)
  xpPerLevel: 150,
  levelScaleFactor: 1.15,
};

// --- Priority Colors ---
export const PRIORITY_COLORS = {
  1: '#e74c3c',
  2: '#e67e22',
  3: '#f1c40f',
  4: '#2ecc71',
  5: '#3498db',
};

// --- Grocery Categories ---
export const GROCERY_CATEGORIES = [
  'general',
  'produce',
  'dairy',
  'meat',
  'pantry',
  'beverages',
  'snacks',
  'frozen',
  'household',
  'health',
];

// --- Deadline Categories ---
export const DEADLINE_CATEGORIES = [
  'health',
  'work',
  'project',
  'personal',
  'general',
];

// --- Sync Settings ---
export const SYNC_INTERVAL_MS = 60_000; // 60 seconds
export const SYNC_DEBOUNCE_MS = 2_000;  // 2 seconds after last write

// --- Navigation ---
export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '◆', path: '' },
  { id: 'tasks', label: 'Tasks', icon: '☑', path: 'tasks' },
  { id: 'groceries', label: 'Groceries', icon: '🛒', path: 'groceries' },
  { id: 'deadlines', label: 'Deadlines', icon: '⏱', path: 'deadlines' },
  { id: 'settings', label: 'Settings', icon: '⚙', path: 'settings' },
];

// --- Reading Speed (for quote display) ---
export const READING_WPM = 200; // words per minute
export const MIN_QUOTE_DISPLAY_MS = 3000;

// --- Tables that sync between localStorage and Supabase ---
export const SYNCABLE_TABLES = [
  'tasks',
  'groceries',
  'deadlines',
  'daily_health_checks',
  'xp_logs',
  'weight_logs',
  'quotes',
  'goals',
  'key_results',
];
