/**
 * Utility functions
 */
import { CONFIG } from './config.js';

/**
 * Checks if a string represents a valid color value.
 * @param {string} val - The string to check.
 * @returns {boolean}
 */
export function isColor(val) {
  if (!val) return false;
  if (CONFIG.IGNORED_VALUES.includes(val)) return false;
  
  // Basic pattern check
  return /^(#|rgb|hsl)/i.test(val) || /^[a-z]+$/i.test(val);
}

/**
 * Checks if a string looks like a font stack.
 * @param {string} val 
 * @returns {boolean}
 */
export function isFont(val) {
  if (!val) return false;
  const lower = val.toLowerCase();
  return lower.includes('sans-serif') || 
         lower.includes('serif') || 
         lower.includes('monospace') || 
         lower.includes('arial') || 
         lower.includes('helvetica') ||
         lower.includes('system-ui');
}

/**
 * Normalizes a color string to a standard format (RGB/RGBA/Hex) using the browser's engine.
 * Uses a singleton cache to avoid re-computation.
 */
const normalizationCache = new Map();
let sharedHelperDiv = null;

export function getNormalizedColor(val) {
  if (!val) return null;
  if (normalizationCache.has(val)) return normalizationCache.get(val);
  
  // Fast path: if it's already a clean hex or functional notation, trust it (mostly)
  // But we still want to resolve named colors like "red" to "rgb(255, 0, 0)"
  // So we only fast-path strictly formatted values if we want to avoid normalization.
  // However, the goal is "consistency", so normalizing everything to what the browser computes is safest.
  
  if (!sharedHelperDiv) {
    sharedHelperDiv = document.createElement('div');
    sharedHelperDiv.style.display = 'none';
    document.body.appendChild(sharedHelperDiv);
  }

  // Reset
  sharedHelperDiv.style.color = '';
  
  try {
    sharedHelperDiv.style.color = val;
    if (sharedHelperDiv.style.color) {
       // window.getComputedStyle is necessary to resolve variables if we were in that context,
       // but here we are in popup context. Variables from the page won't resolve here unless we fetched them.
       // We are mostly normalizing named colors and hex formats.
       const computed = window.getComputedStyle(sharedHelperDiv).color;
       normalizationCache.set(val, computed);
       return computed;
    }
  } catch (e) {
    // Invalid color
  }
  
  return val; // Fallback
}

/**
 * Debounce function for potential UI needs (not strictly used yet but good for utils)
 */
export function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * Helper to download data as JSON
 */
export function downloadJSON(data, pageTitle) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const cleanTitle = (pageTitle || 'design-tokens').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${cleanTitle}_tokens.json`;

    chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: true
    });
}

/**
 * Helper to copy data to clipboard
 */
export async function copyToClipboard(data) {
    const jsonString = JSON.stringify(data, null, 2);
    await navigator.clipboard.writeText(jsonString);
}