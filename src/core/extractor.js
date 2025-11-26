import { CONFIG } from './config.js';
import { isColor, isFont, getNormalizedColor } from './utils.js';
import { analyzeVariable, parseComponentRule, categorizePrimitive } from './component-detector.js';
import { shouldFilterRule, filterVendorProperties, isFrameworkVariable, filterCSSNoise } from './css-filter.js';

/**
 * Extracts design tokens organized by components and primitives
 * @param {string} css - The full CSS string to parse
 * @returns {Object} - Structured design tokens with primitives and components
 */
export function extractDesignTokens(css) {
  // Pre-filter: Remove Tailwind, Bootstrap, and framework noise
  const filteredCSS = filterCSSNoise(css);

  const output = {
    primitives: {
      colors: {},
      fonts: {},
      spacing: {},
      radii: {},
      other: {}
    },
    components: {}
  };

  const seenColors = new Set(); // Track colors we've already added

  // ============================================
  // 1. Extract CSS Variables (Primitives & Components)
  // ============================================
  CONFIG.REGEX.CSS_VAR.lastIndex = 0;
  let match;

  while ((match = CONFIG.REGEX.CSS_VAR.exec(filteredCSS)) !== null) {
    const varName = match[1].trim();
    const varValue = match[2].trim();

    // Skip framework noise variables
    if (isFrameworkVariable(varName)) {
      continue;
    }

    const analysis = analyzeVariable(varName);

    if (analysis.isComponent) {
      // This variable belongs to a component
      const { componentType, variant, cleanName } = analysis;

      // Initialize component structure
      if (!output.components[componentType]) {
        output.components[componentType] = {};
      }
      if (!output.components[componentType][variant]) {
        output.components[componentType][variant] = {};
      }

      // Determine property name from variable name
      const propertyName = cleanName
        .replace(new RegExp(`${componentType}`, 'i'), '')
        .replace(new RegExp(`${variant}`, 'i'), '')
        .replace(/^[-_]+|[-_]+$/g, '')
        .trim() || 'value';

      if (isColor(varValue)) {
        const normalized = getNormalizedColor(varValue);
        output.components[componentType][variant][propertyName] = normalized;
        seenColors.add(normalized);
      } else if (isFont(varValue)) {
        output.components[componentType][variant][propertyName] = varValue;
      } else {
        output.components[componentType][variant][propertyName] = varValue;
      }

    } else {
      // This is a primitive token
      const { cleanName } = analysis;

      if (isColor(varValue)) {
        const normalized = getNormalizedColor(varValue);
        output.primitives.colors[cleanName] = normalized;
        seenColors.add(normalized);
      } else if (isFont(varValue)) {
        output.primitives.fonts[cleanName] = varValue;
      } else {
        // Categorize by property type
        const lowerName = cleanName.toLowerCase();
        if (lowerName.includes('space') || lowerName.includes('gap') ||
          lowerName.includes('padding') || lowerName.includes('margin')) {
          output.primitives.spacing[cleanName] = varValue;
        } else if (lowerName.includes('radius') || lowerName.includes('rounded')) {
          output.primitives.radii[cleanName] = varValue;
        } else {
          output.primitives.other[cleanName] = varValue;
        }
      }
    }
  }

  // ============================================
  // 2. Extract CSS Rules (Component-specific)
  // ============================================
  CONFIG.REGEX.CSS_RULE.lastIndex = 0;

  while ((match = CONFIG.REGEX.CSS_RULE.exec(filteredCSS)) !== null) {
    const selector = match[1].trim();
    const ruleBody = match[2].trim();

    // Skip :root, *, html, body - these are global
    if (/^(:root|\*|html|body)\b/i.test(selector)) continue;

    // Skip framework utility classes
    if (shouldFilterRule(selector, null)) {
      continue;
    }

    // Parse properties from rule body
    const properties = {};
    const propRegex = /([\w-]+)\s*:\s*([^;]+)/g;
    let propMatch;

    while ((propMatch = propRegex.exec(ruleBody)) !== null) {
      const propName = propMatch[1].trim();
      const propValue = propMatch[2].trim();

      // Skip CSS variables in values (they reference primitives)
      if (propValue.includes('var(')) continue;

      properties[propName] = propValue;
    }

    if (Object.keys(properties).length === 0) continue;

    // Filter out vendor-prefixed properties
    const cleanProperties = filterVendorProperties(properties);

    if (Object.keys(cleanProperties).length === 0) continue;

    // Try to match this rule to a component
    const componentInfo = parseComponentRule(selector, cleanProperties);

    if (componentInfo) {
      const { componentType, variant, properties: props } = componentInfo;

      if (!output.components[componentType]) {
        output.components[componentType] = {};
      }
      if (!output.components[componentType][variant]) {
        output.components[componentType][variant] = {};
      }

      // Merge properties
      for (const [prop, value] of Object.entries(props)) {
        if (isColor(value)) {
          const normalized = getNormalizedColor(value);
          output.components[componentType][variant][prop] = normalized;
          seenColors.add(normalized);
        } else {
          output.components[componentType][variant][prop] = value;
        }
      }
    }
  }

  // ============================================
  // 3. Extract Standalone Colors/Fonts (Primitives fallback)
  // ============================================
  // Only add colors that weren't already captured
  CONFIG.REGEX.CSS_PROP.lastIndex = 0;

  while ((match = CONFIG.REGEX.CSS_PROP.exec(filteredCSS)) !== null) {
    const val = match[2].trim();
    const colorParts = val.match(CONFIG.REGEX.COLOR_PARTS);

    if (colorParts) {
      colorParts.forEach(c => {
        if (isColor(c)) {
          const normalized = getNormalizedColor(c);

          // Only add if not already seen
          if (!seenColors.has(normalized)) {
            const name = `color-${Object.keys(output.primitives.colors).length + 1}`;
            output.primitives.colors[name] = normalized;
            seenColors.add(normalized);
          }
        }
      });
    }
  }

  // Extract fonts
  CONFIG.REGEX.FONT_FAMILY.lastIndex = 0;

  while ((match = CONFIG.REGEX.FONT_FAMILY.exec(filteredCSS)) !== null) {
    const fontValue = match[1].trim().replace(/['"]/g, '');

    if (!fontValue.startsWith('var(')) {
      // Check if already exists
      const exists = Object.values(output.primitives.fonts).some(f => f === fontValue);

      if (!exists) {
        const name = `font-${Object.keys(output.primitives.fonts).length + 1}`;
        output.primitives.fonts[name] = fontValue;
      }
    }
  }

  // Clean up empty categories
  for (const category of Object.keys(output.primitives)) {
    if (Object.keys(output.primitives[category]).length === 0) {
      delete output.primitives[category];
    }
  }

  return output;
}