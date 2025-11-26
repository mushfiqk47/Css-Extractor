import { CONFIG } from './config.js';
import { isColor, isFont, getNormalizedColor } from './utils.js';

/**
 * Main Logic: Parses CSS content and groups tokens.
 * @param {string} css - The full CSS string to parse.
 * @returns {Object} - The structured design tokens.
 */
export function extractDesignTokens(css) {
  const groups = {
    [CONFIG.GROUPS.BG]: {},
    [CONFIG.GROUPS.TEXT]: {},
    [CONFIG.GROUPS.BORDER]: {},
    [CONFIG.GROUPS.FILL]: {},
    [CONFIG.GROUPS.OTHER]: {},
    [CONFIG.GROUPS.FONT]: {}
  };

  const valueToNameMap = new Map(); 

  // Helper to safely add a token
  function addToken(group, name, value, type = "color") {
    if (!groups[group]) groups[group] = {};
    
    const cleanValue = type === 'color' ? getNormalizedColor(value) : value;
    if (!cleanValue) return; // Skip invalid

    // Deduping check: If we have this value already in this group, skip or alias?
    // For now, we overwrite or keep separate. Let's keep separate to preserve semantic names if possible.
    
    groups[group][name] = {
      value: cleanValue,
      type: type
    };
    
    if (type === 'color') {
      valueToNameMap.set(cleanValue, name);
    }
  }

  // 1. CSS Variables
  let match;
  // Reset lastIndex is important if reusing global regex, but we use a fresh regex literal or clone
  // CONFIG.REGEX.CSS_VAR is global, so we must loop carefully or reset it. 
  // Better to create a new RegExp or reset lastIndex.
  CONFIG.REGEX.CSS_VAR.lastIndex = 0; 
  
  while ((match = CONFIG.REGEX.CSS_VAR.exec(css)) !== null) {
    const name = match[1].trim();
    const value = match[2].trim();
    const lowerName = name.toLowerCase();

    if (isColor(value)) {
      const cleanName = name.replace(/^--/, '');
      let group = CONFIG.GROUPS.OTHER;
      
      if (lowerName.includes('bg') || lowerName.includes('background') || lowerName.includes('surface') || lowerName.includes('canvas')) {
        group = CONFIG.GROUPS.BG;
      } else if (lowerName.includes('text') || lowerName.includes('font') || lowerName.includes('fg') || lowerName.includes('content')) {
        group = CONFIG.GROUPS.TEXT;
      } else if (lowerName.includes('border') || lowerName.includes('stroke') || lowerName.includes('outline') || lowerName.includes('divider')) {
        group = CONFIG.GROUPS.BORDER;
      } else if (lowerName.includes('fill') || lowerName.includes('icon')) {
        group = CONFIG.GROUPS.FILL;
      }
      
      addToken(group, cleanName, value);
    } else if (isFont(value) || lowerName.includes('font')) {
      const cleanName = name.replace(/^--/, '');
      addToken(CONFIG.GROUPS.FONT, cleanName, value, "fontFamilies");
    }
  }

  // 2. Properties (Contextual extraction)
  CONFIG.REGEX.CSS_PROP.lastIndex = 0;
  while ((match = CONFIG.REGEX.CSS_PROP.exec(css)) !== null) {
    const prop = match[1].toLowerCase();
    const val = match[2].trim();

    // Extract potential color parts
    const colorParts = val.match(CONFIG.REGEX.COLOR_PARTS);
    
    if (colorParts) {
      colorParts.forEach(c => {
        if (isColor(c)) {
          const normalized = getNormalizedColor(c);
          
          // Optimization: Only add if we haven't seen this exact color value used in a variable
          // This reduces noise. If "--primary" is "blue", we don't want "generated-other-1: blue" as well.
          if (!valueToNameMap.has(normalized)) {
            let group = CONFIG.GROUPS.OTHER;
            if (prop.includes('background')) group = CONFIG.GROUPS.BG;
            else if (prop === 'color') group = CONFIG.GROUPS.TEXT;
            else if (prop.includes('border')) group = CONFIG.GROUPS.BORDER;
            else if (prop.includes('fill') || prop.includes('stroke')) group = CONFIG.GROUPS.FILL;

            const name = `generated-${Object.keys(groups[group]).length + 1}`;
            addToken(group, name, c);
          }
        }
      });
    }
  }
  
  // 3. Font Families (Raw)
  CONFIG.REGEX.FONT_FAMILY.lastIndex = 0;
  while ((match = CONFIG.REGEX.FONT_FAMILY.exec(css)) !== null) {
    const f = match[1].trim().replace(/['"]/g, '');
    if (!f.startsWith('var(')) {
      // Check duplication
      let exists = false;
      Object.values(groups[CONFIG.GROUPS.FONT]).forEach(token => {
          if (token.value === f) exists = true;
      });
      
      if (!exists) {
         const name = `font-${Object.keys(groups[CONFIG.GROUPS.FONT]).length + 1}`;
         addToken(CONFIG.GROUPS.FONT, name, f, "fontFamilies");
      }
    }
  }

  return groups;
}