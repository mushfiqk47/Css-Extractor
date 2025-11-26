/**
 * Component Detection Module
 * Identifies UI components and their variants from CSS selectors and variable names
 */

// Component patterns to match against selectors and variable names
const COMPONENT_PATTERNS = {
    button: {
        selectors: /\b(btn|button)\b/i,
        variables: /\b(btn|button)\b/i,
        variants: /\b(primary|secondary|success|danger|warning|info|light|dark|outline|ghost|link)\b/i
    },
    input: {
        selectors: /\b(input|field|form-control|textbox)\b/i,
        variables: /\b(input|field|form)\b/i,
        variants: /\b(text|email|password|search|error|disabled|focus)\b/i
    },
    card: {
        selectors: /\b(card|panel|box|container)\b/i,
        variables: /\b(card|panel|box)\b/i,
        variants: /\b(primary|secondary|outlined|elevated|flat)\b/i
    },
    badge: {
        selectors: /\b(badge|tag|chip|label)\b/i,
        variables: /\b(badge|tag|chip)\b/i,
        variants: /\b(primary|secondary|success|danger|warning|info)\b/i
    },
    alert: {
        selectors: /\b(alert|notification|message|toast)\b/i,
        variables: /\b(alert|notification|message)\b/i,
        variants: /\b(success|error|warning|info)\b/i
    },
    modal: {
        selectors: /\b(modal|dialog|popup|overlay)\b/i,
        variables: /\b(modal|dialog|popup)\b/i,
        variants: /\b(backdrop|content|header|footer)\b/i
    },
    navbar: {
        selectors: /\b(nav|navbar|header|topbar)\b/i,
        variables: /\b(nav|navbar|header)\b/i,
        variants: /\b(fixed|sticky|transparent)\b/i
    },
    sidebar: {
        selectors: /\b(sidebar|drawer|side-nav)\b/i,
        variables: /\b(sidebar|drawer)\b/i,
        variants: /\b(collapsed|expanded|left|right)\b/i
    },
    link: {
        selectors: /\b(link|anchor)\b/i,
        variables: /\b(link|anchor)\b/i,
        variants: /\b(primary|secondary|hover|active|visited)\b/i
    },
    table: {
        selectors: /\b(table|grid|data-table)\b/i,
        variables: /\b(table|grid)\b/i,
        variants: /\b(header|row|cell|striped|hover)\b/i
    }
};

/**
 * Detects component type from a CSS selector or variable name
 * @param {string} text - Selector or variable name to analyze
 * @returns {string|null} - Component type or null if not detected
 */
export function detectComponentType(text) {
    if (!text) return null;

    const lowerText = text.toLowerCase();

    for (const [componentType, patterns] of Object.entries(COMPONENT_PATTERNS)) {
        if (patterns.selectors.test(lowerText) || patterns.variables.test(lowerText)) {
            return componentType;
        }
    }

    return null;
}

/**
 * Detects component variant from a CSS selector or variable name
 * @param {string} text - Selector or variable name to analyze
 * @param {string} componentType - The component type to check variants for
 * @returns {string} - Variant name or 'default'
 */
export function detectComponentVariant(text, componentType) {
    if (!text || !componentType) return 'default';

    const pattern = COMPONENT_PATTERNS[componentType];
    if (!pattern) return 'default';

    const lowerText = text.toLowerCase();
    const match = lowerText.match(pattern.variants);

    if (match && match[1]) {
        return match[1];
    }

    return 'default';
}

/**
 * Determines if a CSS variable belongs to a component or is a primitive
 * @param {string} varName - CSS variable name (with or without --)
 * @returns {Object} - { isComponent: boolean, componentType: string|null, variant: string }
 */
export function analyzeVariable(varName) {
    const cleanName = varName.replace(/^--/, '');
    const componentType = detectComponentType(cleanName);

    if (componentType) {
        const variant = detectComponentVariant(cleanName, componentType);
        return {
            isComponent: true,
            componentType,
            variant,
            cleanName
        };
    }

    return {
        isComponent: false,
        componentType: null,
        variant: 'default',
        cleanName
    };
}

/**
 * Parses a CSS rule to extract component information
 * @param {string} selector - CSS selector
 * @param {Object} properties - Object of CSS properties
 * @returns {Object|null} - Parsed component info or null
 */
export function parseComponentRule(selector, properties) {
    const componentType = detectComponentType(selector);

    if (!componentType) return null;

    const variant = detectComponentVariant(selector, componentType);

    return {
        componentType,
        variant,
        properties: { ...properties }
    };
}

/**
 * Categorizes a CSS property/value as primitive or component-specific
 * @param {string} property - CSS property name
 * @param {string} value - CSS property value
 * @returns {Object} - { category: 'color'|'font'|'spacing'|'radius'|'other', value: string }
 */
export function categorizePrimitive(property, value) {
    const prop = property.toLowerCase();

    // Color-related
    if (prop.includes('color') || prop.includes('background') || prop.includes('border-color') ||
        prop.includes('fill') || prop.includes('stroke')) {
        return { category: 'colors', value };
    }

    // Font-related
    if (prop.includes('font')) {
        return { category: 'fonts', value };
    }

    // Spacing
    if (prop.includes('padding') || prop.includes('margin') || prop.includes('gap')) {
        return { category: 'spacing', value };
    }

    // Border radius
    if (prop.includes('radius') || prop.includes('rounded')) {
        return { category: 'radii', value };
    }

    return { category: 'other', value };
}
