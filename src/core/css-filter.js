/**
 * CSS Noise Filter Module
 * Filters out framework-generated CSS, utility classes, and verbose logic
 */

// Tailwind utility class patterns
const TAILWIND_PATTERNS = [
    /^(m|p|mt|mb|ml|mr|mx|my|pt|pb|pl|pr|px|py)-\d+$/,  // margin/padding: mt-4, p-2
    /^(w|h|min-w|min-h|max-w|max-h)-/,                   // sizing: w-full, h-screen
    /^(text|font|leading|tracking)-/,                     // typography: text-sm, font-bold
    /^(bg|border|text|ring)-(red|blue|green|yellow|gray|purple|pink|indigo|cyan|teal|orange|amber|lime|emerald|sky|violet|fuchsia|rose|slate|zinc|neutral|stone)-\d+$/,  // colors: bg-blue-500
    /^(flex|grid|block|inline|hidden|absolute|relative|fixed|sticky)/,  // layout
    /^(rounded|border|shadow|opacity|z)-/,                // utilities
    /^(hover|focus|active|disabled|group|peer):/,        // states
    /^(sm|md|lg|xl|2xl):/,                                // breakpoints
    /^gap-|space-/,                                       // spacing
    /^transition|duration|ease-/,                         // animations
    /^cursor-|select-|resize-/,                           // interactions
];

// Bootstrap patterns
const BOOTSTRAP_PATTERNS = [
    /^(container|row|col)-/,
    /^(btn|alert|badge|card|modal|nav|navbar|dropdown)-/,
    /^(m|p)[trblxy]?-[0-5]$/,  // m-1, mt-2, px-3
    /^(text|bg|border)-(primary|secondary|success|danger|warning|info|light|dark|white|muted)$/,
    /^(d|flex|justify|align|float|position)-/,
    /^(w|h)-(25|50|75|100|auto)$/,
];

// Generic utility class patterns
const UTILITY_PATTERNS = [
    /^u-/,                    // utility prefix
    /^is-/,                   // state prefix
    /^has-/,                  // modifier prefix
    /^\.[a-z]-[a-z0-9-]+$/,  // single letter prefix utilities
];

// Vendor prefixes and browser-specific
const VENDOR_PATTERNS = [
    /^-webkit-/,
    /^-moz-/,
    /^-ms-/,
    /^-o-/,
];

// CSS reset/normalize patterns
const RESET_PATTERNS = [
    /\*\s*\{/,                          // universal selector
    /^(html|body|div|span|applet|object|iframe|h[1-6]|p|blockquote|pre|a|abbr|acronym)/,  // reset elements
];

/**
 * Checks if a CSS selector is a Tailwind utility class
 * @param {string} selector - CSS selector
 * @returns {boolean}
 */
export function isTailwindUtility(selector) {
    const cleanSelector = selector.replace(/^\./, '').trim();
    return TAILWIND_PATTERNS.some(pattern => pattern.test(cleanSelector));
}

/**
 * Checks if a CSS selector is a Bootstrap utility class
 * @param {string} selector - CSS selector
 * @returns {boolean}
 */
export function isBootstrapUtility(selector) {
    const cleanSelector = selector.replace(/^\./, '').trim();
    return BOOTSTRAP_PATTERNS.some(pattern => pattern.test(cleanSelector));
}

/**
 * Checks if a CSS selector is a generic utility class
 * @param {string} selector - CSS selector
 * @returns {boolean}
 */
export function isGenericUtility(selector) {
    const cleanSelector = selector.replace(/^\./, '').trim();
    return UTILITY_PATTERNS.some(pattern => pattern.test(cleanSelector));
}

/**
 * Checks if a CSS property uses vendor prefixes
 * @param {string} property - CSS property name
 * @returns {boolean}
 */
export function hasVendorPrefix(property) {
    return VENDOR_PATTERNS.some(pattern => pattern.test(property));
}

/**
 * Checks if a selector is part of CSS reset/normalize
 * @param {string} selector - CSS selector
 * @returns {boolean}
 */
export function isResetSelector(selector) {
    return RESET_PATTERNS.some(pattern => pattern.test(selector));
}

/**
 * Determines if a CSS rule should be filtered out as noise
 * @param {string} selector - CSS selector
 * @param {Object} properties - CSS properties object
 * @returns {boolean} - true if should be filtered out
 */
export function shouldFilterRule(selector, properties) {
    // Filter Tailwind utilities
    if (isTailwindUtility(selector)) {
        return true;
    }

    // Filter Bootstrap utilities
    if (isBootstrapUtility(selector)) {
        return true;
    }

    // Filter generic utilities
    if (isGenericUtility(selector)) {
        return true;
    }

    // Filter reset/normalize
    if (isResetSelector(selector)) {
        return true;
    }

    // Filter if all properties are vendor-prefixed
    if (properties && typeof properties === 'object') {
        const propKeys = Object.keys(properties);
        if (propKeys.length > 0 && propKeys.every(hasVendorPrefix)) {
            return true;
        }
    }

    return false;
}

/**
 * Filters CSS properties to remove vendor prefixes
 * @param {Object} properties - CSS properties object
 * @returns {Object} - Filtered properties
 */
export function filterVendorProperties(properties) {
    const filtered = {};

    for (const [prop, value] of Object.entries(properties)) {
        if (!hasVendorPrefix(prop)) {
            filtered[prop] = value;
        }
    }

    return filtered;
}

/**
 * Checks if a CSS variable name looks like framework noise
 * @param {string} varName - Variable name (with or without --)
 * @returns {boolean}
 */
export function isFrameworkVariable(varName) {
    const clean = varName.replace(/^--/, '');

    // Tailwind CSS variables
    if (clean.startsWith('tw-')) return true;

    // Bootstrap variables that are just utilities
    if (/^bs-(blue|indigo|purple|pink|red|orange|yellow|green|teal|cyan)-\d+$/.test(clean)) {
        return true;
    }

    return false;
}

/**
 * Main filter function to clean CSS before extraction
 * @param {string} css - Raw CSS string
 * @returns {string} - Filtered CSS
 */
export function filterCSSNoise(css) {
    // Remove CSS comments
    let cleaned = css.replace(/\/\*[\s\S]*?\*\//g, '');

    // Remove @tailwind directives
    cleaned = cleaned.replace(/@tailwind\s+[^;]+;/g, '');

    // Remove @apply directives (Tailwind)
    cleaned = cleaned.replace(/@apply\s+[^;]+;/g, '');

    // Remove @layer directives (Tailwind)
    cleaned = cleaned.replace(/@layer\s+[^{]+\{[^}]*\}/g, '');

    // Filter out utility class rules
    const rules = cleaned.match(/[^{]+\{[^}]+\}/g) || [];
    const filteredRules = rules.filter(rule => {
        const selectorMatch = rule.match(/^([^{]+)\{/);
        if (!selectorMatch) return true;

        const selector = selectorMatch[1].trim();
        return !shouldFilterRule(selector, null);
    });

    return filteredRules.join('\n');
}
