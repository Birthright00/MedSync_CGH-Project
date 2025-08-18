/**
 * Standardized Color Palette for Session Status Indicators
 * 
 * This file contains all standardized colors used across the student interface
 * to ensure consistency between notifications, timetable calendars, and event displays.
 * 
 * Usage:
 * import { SESSION_COLORS } from '../constants/colors';
 * 
 * Last Updated: Based on calendar timetable colors for consistency
 */

export const SESSION_COLORS = {
  // Session modification colors
  RESIZED: '#D49A00',           // Dark orange - for resized sessions
  RESCHEDULED: '#D49A00',       // Dark orange - for rescheduled sessions (same as resized)
  LOCATION_CHANGED: '#00BFA6',  // Teal - for location changes only
  
  // Default session colors
  NORMAL: '#3174ad',            // Blue - for normal sessions
  PAST: '#999999',              // Gray - for past sessions
  BLOCKED: '#bdbdbd',           // Light gray - for blocked/institutional dates
  
  // Background colors (transparent overlays)
  MODIFICATION_BG: 'rgba(212, 154, 0, 0.05)', // Light orange background for modified sessions
  NORMAL_BG: 'transparent',      // Transparent for normal sessions
};

/**
 * Helper function to get session status color
 * @param {string} changeType - The type of change (resized, rescheduled, location_changed)
 * @param {boolean} isPast - Whether the session is in the past
 * @param {boolean} isBlocked - Whether the session is blocked
 * @returns {string} Hex color code
 */
export const getSessionColor = (changeType, isPast = false, isBlocked = false) => {
  if (isPast) return SESSION_COLORS.PAST;
  if (isBlocked) return SESSION_COLORS.BLOCKED;
  
  switch (changeType) {
    case 'resized':
    case 'rescheduled':
      return SESSION_COLORS.RESIZED;
    case 'location_changed':
      return SESSION_COLORS.LOCATION_CHANGED;
    default:
      return SESSION_COLORS.NORMAL;
  }
};

/**
 * Helper function to get background color for session cards
 * @param {string} changeType - The type of change
 * @returns {string} CSS background color value
 */
export const getSessionBackgroundColor = (changeType) => {
  return changeType ? SESSION_COLORS.MODIFICATION_BG : SESSION_COLORS.NORMAL_BG;
};

/**
 * Status indicator emojis for different session modifications
 */
export const STATUS_INDICATORS = {
  resized: '📏',           // Ruler emoji for resized sessions
  rescheduled: '🔄',       // Cycle emoji for rescheduled sessions
  location_changed: '📍',  // Pin emoji for location changes
};

/**
 * Helper function to get status indicator emoji
 * @param {string} changeType - The type of change
 * @returns {string|null} Emoji or null if no indicator needed
 */
export const getStatusIndicator = (changeType) => {
  return STATUS_INDICATORS[changeType] || null;
};