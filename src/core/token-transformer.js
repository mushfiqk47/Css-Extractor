/**
 * Token Transformer Module
 * Transforms flat, messy design tokens into clean, semantic, hierarchical structures
 */

// Design system prefixes to detect
const DESIGN_SYSTEM_PREFIXES = [
    'WDS-', 'MDS-', 'MUI-', 'ANT-', 'BS-', 'MATERIAL-',
    'CHAKRA-', 'TAILWIND-', 'BOOTSTRAP-'
];

// Patterns that indicate garbage/obfuscated keys
const GARBAGE_PATTERNS = [
    /^generated-\d+$/i,           // generated-214
    /^x[a-z0-9]{6,}$/i,           // x1bxvvwh, xhj0bg5
    /^_[a-z0-9]{6,}$/i,           // _abc123def
    /^[a-z]{1,2}\d{4,}$/i,        // a1234, ab12345
    /^color-\d+$/i,               // color-1, color-214
    /^font-\d+$/i,                // font-1, font-2
    /^(bg|text|border)-\d+$/i     // bg-1, text-2
];

/**
 * Converts kebab-case to camelCase
 * @param {string} str - String to convert
 * @returns {string} - camelCase string
 */
export function toCamelCase(str) {
    return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Checks if a key looks like garbage/obfuscated code
 * @param {string} key - Key to check
 * @returns {boolean}
 */
export function isGarbageKey(key) {
    return GARBAGE_PATTERNS.some(pattern => pattern.test(key));
}

/**
 * Detects if a key belongs to a design system
 * @param {string} key - Key to check
 * @returns {Object|null} - { system: string, cleanKey: string } or null
 */
export function detectDesignSystem(key) {
    for (const prefix of DESIGN_SYSTEM_PREFIXES) {
        if (key.toUpperCase().startsWith(prefix)) {
            return {
                system: prefix.replace(/-$/, '').toLowerCase(),
                cleanKey: key.slice(prefix.length)
            };
        }
    }
    return null;
}

/**
 * Converts a hyphenated key into nested object path
 * @param {string} key - Hyphenated key (e.g., "button-primary-background-hover")
 * @returns {Array} - Array of path segments
 */
export function parseKeyPath(key) {
    // Split by hyphen, convert to camelCase for non-first segments
    const parts = key.split('-');

    // Keep first part as-is (component name), convert rest to camelCase
    if (parts.length === 1) {
        return [parts[0]];
    }

    const result = [parts[0]];
    let i = 1;

    // Build camelCase segments by grouping related parts
    while (i < parts.length) {
        let segment = parts[i];
        i++;

        // Check if this is a multi-word property (e.g., background-hover)
        // We want to preserve semantic grouping
        result.push(segment);
    }

    return result;
}

/**
 * Removes redundant component name from property keys
 * @param {string} key - Property key
 * @param {string} componentName - Component name to remove
 * @returns {string} - Cleaned key
 */
export function removeRedundantPrefix(key, componentName) {
    const regex = new RegExp(`^${componentName}-?`, 'i');
    return key.replace(regex, '');
}

/**
 * Sets a value in a nested object using a path array
 * @param {Object} obj - Target object
 * @param {Array} path - Path array
 * @param {*} value - Value to set
 */
function setNestedValue(obj, path, value) {
    let current = obj;

    for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];

        // Safety check: if the current value exists and is not an object, skip nesting
        if (current[key] !== undefined && typeof current[key] !== 'object') {
            // Can't nest into a non-object value, flatten the key instead
            const flatKey = path.slice(i).map((p, idx) => idx === 0 ? p : toCamelCase(p)).join('');
            current[flatKey] = value;
            return;
        }

        if (!current[key]) {
            current[key] = {};
        }
        current = current[key];
    }

    current[path[path.length - 1]] = value;
}

/**
 * Transforms component-variant structure into semantic hierarchy
 * @param {Object} componentData - Component data with variants
 * @param {string} componentName - Name of the component
 * @returns {Object} - Transformed structure
 */
function transformComponent(componentData, componentName) {
    const result = {};

    for (const [variant, properties] of Object.entries(componentData)) {
        const variantObj = {};

        for (let [propKey, propValue] of Object.entries(properties)) {
            // Remove redundant component name prefix
            propKey = removeRedundantPrefix(propKey, componentName);

            // Convert to camelCase
            const camelKey = toCamelCase(propKey);

            // Parse the key path for semantic nesting
            const path = parseKeyPath(propKey);

            if (path.length === 1) {
                // Simple property
                variantObj[camelKey] = propValue;
            } else {
                // Nested property (e.g., background-hover)
                const camelPath = path.map((p, i) => i === 0 ? p : toCamelCase(p));
                setNestedValue(variantObj, camelPath, propValue);
            }
        }

        result[variant] = variantObj;
    }

    return result;
}

/**
 * Transforms primitives into semantic structure
 * @param {Object} primitives - Primitives object
 * @returns {Object} - Transformed primitives
 */
function transformPrimitives(primitives) {
    const result = {};

    for (const [category, tokens] of Object.entries(primitives)) {
        const transformedTokens = {};

        for (let [key, value] of Object.entries(tokens)) {
            // Check for design system prefix
            const dsInfo = detectDesignSystem(key);

            if (dsInfo) {
                // This belongs to a design system
                if (!result.designSystem) {
                    result.designSystem = {};
                }
                if (!result.designSystem[dsInfo.system]) {
                    result.designSystem[dsInfo.system] = {};
                }

                // Parse the clean key into nested structure
                const path = parseKeyPath(dsInfo.cleanKey);
                const camelPath = path.map(toCamelCase);
                setNestedValue(result.designSystem[dsInfo.system], camelPath, value);
            } else {
                // Regular primitive
                const camelKey = toCamelCase(key);
                transformedTokens[camelKey] = value;
            }
        }

        if (Object.keys(transformedTokens).length > 0) {
            result[category] = transformedTokens;
        }
    }

    return result;
}

/**
 * Main transformation function
 * @param {Object} extractedTokens - Tokens from extractor
 * @returns {Object} - Clean, semantic, hierarchical structure
 */
export function transformTokens(extractedTokens) {
    const output = {
        primitives: {},
        components: {},
        legacy: {}
    };

    // Transform primitives
    if (extractedTokens.primitives) {
        const transformedPrimitives = transformPrimitives(extractedTokens.primitives);

        // Separate design systems
        if (transformedPrimitives.designSystem) {
            output.designSystem = transformedPrimitives.designSystem;
            delete transformedPrimitives.designSystem;
        }

        output.primitives = transformedPrimitives;
    }

    // Transform components
    if (extractedTokens.components) {
        for (const [componentName, variants] of Object.entries(extractedTokens.components)) {
            const garbageVariants = {};
            const cleanVariants = {};

            // Separate garbage keys from clean ones
            for (const [variantName, properties] of Object.entries(variants)) {
                const cleanProps = {};
                const garbageProps = {};

                for (const [propKey, propValue] of Object.entries(properties)) {
                    if (isGarbageKey(propKey)) {
                        garbageProps[propKey] = propValue;
                    } else {
                        cleanProps[propKey] = propValue;
                    }
                }

                if (Object.keys(cleanProps).length > 0) {
                    cleanVariants[variantName] = cleanProps;
                }

                if (Object.keys(garbageProps).length > 0) {
                    garbageVariants[variantName] = garbageProps;
                }
            }

            // Transform clean variants
            if (Object.keys(cleanVariants).length > 0) {
                output.components[componentName] = transformComponent(cleanVariants, componentName);
            }

            // Store garbage in legacy
            if (Object.keys(garbageVariants).length > 0) {
                if (!output.legacy.components) {
                    output.legacy.components = {};
                }
                output.legacy.components[componentName] = garbageVariants;
            }
        }
    }

    // Clean up empty sections
    if (Object.keys(output.legacy).length === 0) {
        delete output.legacy;
    }

    if (Object.keys(output.primitives).length === 0) {
        delete output.primitives;
    }

    if (Object.keys(output.components).length === 0) {
        delete output.components;
    }

    return output;
}

/**
 * Transforms the complete extraction output (with domain keys)
 * @param {Object} fullOutput - Complete output from extractor with domain keys
 * @returns {Object} - Transformed output
 */
export function transformFullOutput(fullOutput) {
    const result = {};

    for (const [domain, tokens] of Object.entries(fullOutput)) {
        result[domain] = transformTokens(tokens);
    }

    return result;
}
