/**
 * Configuration constants for the extension
 */
export const CONFIG = {
  TIMEOUT_MS: 5000,
  // Regex patterns for CSS extraction
  REGEX: {
    // Matches: --variable-name: value;
    CSS_VAR: /(--[\w-]+)\s*:\s*([^;\}]+)/g,
    
    // Matches hex, rgb, rgba, hsl, hsla
    COLOR_HEX_RGB: /(#[0-9a-fA-F]{3,8}\b|rgba?\([^)]+\)|hsla?\([^)]+\))/gi,
    
    // Matches property: value
    CSS_PROP: /(background(?:-color)?|color|border(?:-color)?|fill|stroke)\s*:\s*([^;\}]+)/gi,
    
    // Matches font-family: value
    FONT_FAMILY: /font-family\s*:\s*([^;\}]+)/gi,
    
    // Matches distinct color parts in a value string
    COLOR_PARTS: /(#[0-9a-f]{3,8}\b|rgba?\([^)]+\)|hsla?\([^)]+\)|[a-z]+)/gi
  },
  // Non-color keywords to ignore
  IGNORED_VALUES: ['none', 'inherit', 'initial', 'unset', 'currentColor', 'transparent', 'auto'],
  
  // Group Definitions
  GROUPS: {
    BG: "Backgrounds",
    TEXT: "Text Colors",
    BORDER: "Borders",
    FILL: "Fills",
    OTHER: "Other Colors",
    FONT: "Font Families"
  }
};