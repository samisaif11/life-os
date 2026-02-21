// ============================================================
// LIFE OS — XP Calculation Engine
// ============================================================

import { TIERS, XP_CONFIG } from '../config.js';
import * as db from './db.js';
import * as storage from '../utils/storage.js';
import { todayISO } from '../utils/date.js';
import { getUserId } from './auth.js';

/**
 * Calculate XP for a task
 * earned_xp = base_xp × tier_weight × health_multiplier × streak_bonus
 *
 * @param {Object} task - Task object with tier and base_xp
 * @returns {number} XP amount (with decimals)
 */
export function calculateXP(task) {
  const tier = TIERS[task.tier] || TIERS[5];
  const baseXp = task.base_xp || tier.baseXp;
  const tierWeight = tier.weight;
  const healthMult = isHealthMultiplierActive() ? XP_CONFIG.healthMultiplierValue : XP_CONFIG.defaultMultiplier;
  const streakBonus = getStreakBonus();

  const xp = baseXp * tierWeight * healthMult * streakBonus;

  // Round to 2 decimal places
  return Math.round(xp * 100) / 100;
}

/**
 * Award XP for completing a task
 * @param {Object} task
 * @returns {number} XP amount awarded
 */
export function awardXP(task) {
  const amount = calculateXP(task);
  const multiplier = isHealthMultiplierActive() ? XP_CONFIG.healthMultiplierValue : XP_CONFIG.defaultMultiplier;

  // Log the XP transaction
  db.create('xp_logs', {
    task_id: task.id,
    goal_id: task.goal_id,
    amount,
    multiplier,
    source: 'task',
    description: `Completed: ${task.title}`,
  });

  // Update profile total XP
  updateTotalXP(amount);

  return amount;
}

/**
 * Get total XP earned today
 * @returns {number}
 */
export function getTodayXP() {
  const today = todayISO();
  const logs = db.getAll('xp_logs', {
    filter: log => log.created_at && log.created_at.startsWith(today),
  });
  return logs.reduce((sum, log) => sum + (log.amount || 0), 0);
}

/**
 * Get total XP earned all time
 * @returns {number}
 */
export function getTotalXP() {
  const profile = getProfile();
  return profile?.xp_total || 0;
}

/**
 * Get current level based on total XP
 * @returns {number}
 */
export function getLevel() {
  const totalXP = getTotalXP();
  let level = 1;
  let xpNeeded = XP_CONFIG.xpPerLevel;

  while (totalXP >= xpNeeded) {
    level++;
    xpNeeded += XP_CONFIG.xpPerLevel * Math.pow(XP_CONFIG.levelScaleFactor, level - 1);
  }

  return level;
}

/**
 * Get XP progress toward next level
 * @returns {{ current: number, needed: number, percentage: number }}
 */
export function getLevelProgress() {
  const totalXP = getTotalXP();
  let level = 1;
  let prevThreshold = 0;
  let nextThreshold = XP_CONFIG.xpPerLevel;

  while (totalXP >= nextThreshold) {
    level++;
    prevThreshold = nextThreshold;
    nextThreshold += XP_CONFIG.xpPerLevel * Math.pow(XP_CONFIG.levelScaleFactor, level - 1);
  }

  const current = totalXP - prevThreshold;
  const needed = nextThreshold - prevThreshold;
  const percentage = Math.min(100, Math.round((current / needed) * 100));

  return { current: Math.round(current * 100) / 100, needed: Math.round(needed * 100) / 100, percentage };
}

/**
 * Check if health multiplier is active today
 * @returns {boolean}
 */
export function isHealthMultiplierActive() {
  const today = todayISO();
  const checks = db.getAll('daily_health_checks', {
    filter: check => check.check_date === today,
  });
  return checks.length > 0 && checks[0].health_minimum_met === true;
}

/**
 * Activate/update today's health check
 * @param {Object} data - { meds_taken, symptom_notes, health_minimum_met }
 * @returns {Object}
 */
export function updateHealthCheck(data) {
  const today = todayISO();
  const existing = db.getAll('daily_health_checks', {
    filter: check => check.check_date === today,
  });

  if (existing.length > 0) {
    return db.update('daily_health_checks', existing[0].id, data);
  } else {
    return db.create('daily_health_checks', {
      check_date: today,
      ...data,
    });
  }
}

/**
 * Get current streak (consecutive days with at least 1 task completed)
 * @returns {number}
 */
export function getCurrentStreak() {
  const profile = getProfile();
  return profile?.streak_current || 0;
}

/**
 * Get streak bonus multiplier
 * @returns {number} Between 1.0 and 1.50
 */
export function getStreakBonus() {
  const streak = getCurrentStreak();
  return Math.min(
    XP_CONFIG.streakBonusCap,
    XP_CONFIG.streakBonusBase + streak * XP_CONFIG.streakBonusPerDay
  );
}

/**
 * Update streak — call this when a task is completed
 */
export function updateStreak() {
  const profile = getProfile();
  if (!profile) return;

  const today = todayISO();
  const lastActivity = storage.get('lastActivityDate', '');

  if (lastActivity === today) return; // Already counted today

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayISO = yesterday.toISOString().split('T')[0];

  let newStreak = profile.streak_current || 0;

  if (lastActivity === yesterdayISO) {
    // Consecutive day — increment streak
    newStreak += 1;
  } else if (lastActivity !== today) {
    // Missed a day — reset streak
    newStreak = 1;
  }

  const bestStreak = Math.max(profile.streak_best || 0, newStreak);

  updateProfile({
    streak_current: newStreak,
    streak_best: bestStreak,
  });

  storage.set('lastActivityDate', today);
}

/**
 * Update total XP in profile
 * @param {number} amount - XP to add
 */
function updateTotalXP(amount) {
  const profile = getProfile();
  if (!profile) return;

  const newTotal = (profile.xp_total || 0) + amount;
  const newLevel = getLevel();

  updateProfile({
    xp_total: Math.round(newTotal * 100) / 100,
    level: newLevel,
  });
}

/**
 * Get user profile from localStorage
 * @returns {Object|null}
 */
function getProfile() {
  const userId = getUserId();
  if (!userId) return null;

  const profiles = storage.getTable('profiles');
  return profiles.find(p => p.id === userId) || null;
}

/**
 * Update user profile
 * @param {Object} updates
 */
function updateProfile(updates) {
  const userId = getUserId();
  if (!userId) return;

  const profiles = storage.getTable('profiles');
  const index = profiles.findIndex(p => p.id === userId);

  if (index >= 0) {
    profiles[index] = { ...profiles[index], ...updates, updated_at: new Date().toISOString() };
  } else {
    profiles.push({ id: userId, ...updates, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
  }

  storage.setTable('profiles', profiles);
}

/**
 * Ensure profile exists in localStorage
 */
export function ensureProfile() {
  const userId = getUserId();
  if (!userId) return;

  const profile = getProfile();
  if (!profile) {
    const profiles = storage.getTable('profiles');
    profiles.push({
      id: userId,
      display_name: '',
      xp_total: 0,
      level: 1,
      streak_current: 0,
      streak_best: 0,
      health_multiplier_active: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    storage.setTable('profiles', profiles);
  }
}
