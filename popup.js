document.addEventListener('DOMContentLoaded', function() {
  const extractBtn = document.getElementById('extractBtn');
  const copyBtn = document.getElementById('copyBtn');
  const statusDiv = document.getElementById('status');
  const styleTagCountEl = document.getElementById('styleTagCount');
  const linkTagCountEl = document.getElementById('linkTagCount');
  const extractBtnText = extractBtn.querySelector('.btn-text');
  const copyBtnText = copyBtn.querySelector('.btn-text');

  // Initial check to update stats
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    const tab = tabs[0];
    if (tab?.id && !isRestrictedUrl(tab.url)) {
      chrome.scripting.executeScript({
        target: {tabId: tab.id},
        func: countStyles
      }, (results) => {
        if (chrome.runtime.lastError) return;
        if (results && results[0]?.result) {
          const { inline, external } = results[0].result;
          styleTagCountEl.textContent = inline;
          linkTagCountEl.textContent = external;
        }
      });
    } else if (isRestrictedUrl(tab?.url)) {
       setStatus('Cannot run on this page', 'error');
       disableButtons(true);
    }
  });

  extractBtn.addEventListener('click', async function() {
    await handleAction('download');
  });

  copyBtn.addEventListener('click', async function() {
    await handleAction('copy');
  });

  async function handleAction(actionType) {
    setLoading(true, actionType);
    setStatus('Analyzing page...', '');

    try {
      const [tab] = await chrome.tabs.query({active: true, currentWindow: true});

      if (!tab || !tab.url) throw new Error('No active tab found');
      if (isRestrictedUrl(tab.url)) throw new Error('Restricted page.');

      // 1. Get the list of resources
      const executionResult = await chrome.scripting.executeScript({
        target: {tabId: tab.id},
        func: getPageCSSInfo
      });

      if (!executionResult || !executionResult[0]?.result) {
        throw new Error('Failed to analyze page.');
      }

      const { inlineStyles, externalLinks, pageTitle, hostname, pathname } = executionResult[0].result;

      // 2. Fetch external resources
      setStatus(`Fetching ${externalLinks.length} stylesheets...`, '');
      
      const externalCSSContents = await Promise.allSettled(
        externalLinks.map(async (link) => {
          try {
            const response = await fetch(link);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.text();
          } catch (err) {
            console.warn(`Failed to fetch ${link}:`, err);
            return ''; // Return empty on failure to not break everything
          }
        })
      );

      const cssParts = [
        ...inlineStyles,
        ...externalCSSContents.map(r => r.status === 'fulfilled' ? r.value : '')
      ];

      const fullCSS = cssParts.join('\n');

      // 3. Process and Extract Tokens
      setStatus('Extracting tokens...', '');
      const rawTokens = extractDesignTokens(fullCSS);

      // 4. Structure Hierarchically (Domain -> Groups)
      // User requested: Website Name -> Groups -> Colors
      const structuredData = {
        [hostname]: rawTokens // rawTokens now contains the groups directly
      };

      if (actionType === 'download') {
        // 5a. Download JSON
        setStatus('Downloading JSON...', 'success');
        downloadJSON(structuredData, pageTitle);
      } else {
        // 5b. Copy to Clipboard
        setStatus('Copying to clipboard...', '');
        await copyToClipboard(structuredData);
        setStatus('Copied to clipboard!', 'success');
      }
      
    } catch (error) {
      console.error(error);
      setStatus(error.message, 'error');
    } finally {
      setLoading(false, actionType);
    }
  }

  // --- Helpers ---

  function deriveCategory(pathname) {
    if (!pathname || pathname === '/') return 'landing_page';
    
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return 'landing_page';

    const firstSegment = segments[0].toLowerCase();

    // Common mappings
    if (['shop', 'product', 'item', 'p'].includes(firstSegment)) return 'products';
    if (['blog', 'article', 'news', 'post'].includes(firstSegment)) return 'articles';
    if (['user', 'profile', 'account', 'me'].includes(firstSegment)) return 'user_profiles';
    if (['login', 'signup', 'auth'].includes(firstSegment)) return 'authentication';
    
    // Fallback to the segment name itself
    return firstSegment;
  }

  // --- Token Extraction Logic ---

  function extractDesignTokens(css) {
    const groups = {
      "Backgrounds": {},
      "Text Colors": {},
      "Borders": {},
      "Fills": {},
      "Other Colors": {},
      "Font Families": {}
    };

    const valueToNameMap = new Map(); // To avoid duplicates: value -> generated name
    const normalizationCache = new Map();

    // Helper to normalize color
    function getNormalizedColor(val) {
      if (normalizationCache.has(val)) return normalizationCache.get(val);
      
      // Simple check: if it's already hex or rgb, return it clean
      if (val.match(/^#[0-9a-f]{3,8}$/i) || val.startsWith('rgb') || val.startsWith('hsl')) {
        return val;
      }
      
      // Try to normalize named colors using a temporary element
      // Since we are in popup context (a webpage), we can use the DOM
      const d = document.createElement('div');
      d.style.color = val;
      // If invalid, style.color remains empty
      if (d.style.color) {
         // Browser computes it to RGB
         document.body.appendChild(d);
         const computed = window.getComputedStyle(d).color;
         document.body.removeChild(d);
         normalizationCache.set(val, computed);
         return computed;
      }
      
      return val; // Fallback
    }

    function addToken(group, name, value, type = "color") {
      if (!groups[group]) groups[group] = {};
      
      const cleanValue = type === 'color' ? getNormalizedColor(value) : value;
      
      groups[group][name] = {
        value: cleanValue,
        type: type
      };
      
      if (type === 'color') {
        valueToNameMap.set(cleanValue, name);
      }
    }

    // 1. Extract CSS Variables (Categorized by Name)
    const varRegex = /(--[\w-]+)\s*:\s*([^;\}]+)/g;
    let match;
    while ((match = varRegex.exec(css)) !== null) {
      const name = match[1].trim();
      const value = match[2].trim();
      const lowerName = name.toLowerCase();

      if (isColor(value)) {
        const cleanName = name.replace(/^--/, '');
        let group = "Other Colors";
        
        if (lowerName.includes('bg') || lowerName.includes('background') || lowerName.includes('surface') || lowerName.includes('canvas')) {
          group = "Backgrounds";
        } else if (lowerName.includes('text') || lowerName.includes('font') || lowerName.includes('fg') || lowerName.includes('content')) {
          group = "Text Colors";
        } else if (lowerName.includes('border') || lowerName.includes('stroke') || lowerName.includes('outline') || lowerName.includes('divider')) {
          group = "Borders";
        } else if (lowerName.includes('fill') || lowerName.includes('icon')) {
          group = "Fills";
        }
        
        addToken(group, cleanName, value);
      } else if (isFont(value) || lowerName.includes('font')) {
        const cleanName = name.replace(/^--/, '');
        addToken("Font Families", cleanName, value, "fontFamilies");
      }
    }

    // 2. Extract Properties from Rules for Better Categorization
    // Regex to find property: value pairs in context (simplified)
    // We look for "property: value;"
    const propRegex = /(background(?:-color)?|color|border(?:-color)?|fill|stroke)\s*:\s*([^;\}]+)/gi;
    let propMatch;
    while ((propMatch = propRegex.exec(css)) !== null) {
      const prop = propMatch[1].toLowerCase();
      const val = propMatch[2].trim();

      // Split values if there are multiple (e.g. border: 1px solid #000)
      // We strictly look for color-like parts
      const colorParts = val.match(/(#[0-9a-f]{3,8}\b|rgba?\([^)]+\)|hsla?\([^)]+\)|[a-z]+)/gi);
      
      if (colorParts) {
        colorParts.forEach(c => {
          if (isColor(c) && !['none', 'transparent', 'initial', 'inherit'].includes(c)) {
            const normalized = getNormalizedColor(c);
            
            // If we already have a named variable for this value, we skip creating a raw one?
            // Actually, we might want to know it exists. But for simplicity, if it exists, ignore.
            if (!valueToNameMap.has(normalized)) {
              let group = "Other Colors";
              if (prop.includes('background')) group = "Backgrounds";
              else if (prop === 'color') group = "Text Colors";
              else if (prop.includes('border')) group = "Borders";
              else if (prop.includes('fill') || prop.includes('stroke')) group = "Fills";

              const name = `generated-${group.toLowerCase().split(' ')[0]}-${Object.keys(groups[group]).length + 1}`;
              addToken(group, name, c);
            }
          }
        });
      }
    }
    
    // 3. Extract Raw Fonts
    const fontRegex = /font-family\s*:\s*([^;\}]+)/gi;
    let fontMatch;
    while ((fontMatch = fontRegex.exec(css)) !== null) {
      const f = fontMatch[1].trim().replace(/['"]/g, '');
      if (!f.startsWith('var(')) {
        // Check if exists
        let exists = false;
        Object.values(groups["Font Families"]).forEach(token => {
            if (token.value === f) exists = true;
        });
        
        if (!exists) {
           const name = `font-${Object.keys(groups["Font Families"]).length + 1}`;
           addToken("Font Families", name, f, "fontFamilies");
        }
      }
    }

    return groups;
  }

  function isColor(val) {
    // Expanded check to include named colors but exclude common keywords that aren't "colors" in the token sense
    const keywords = ['none', 'inherit', 'initial', 'unset', 'currentColor', 'transparent', 'auto'];
    if (keywords.includes(val)) return false;

    return /^(#|rgb|hsl)/i.test(val) || /^[a-z]+$/i.test(val); 
    // Note: /^[a-z]+$/ is broad, but getNormalizedColor will verify if it's a real color.
  }

  function isFont(val) {
    return val.includes('sans-serif') || val.includes('serif') || val.includes('monospace') || val.includes(' Arial') || val.includes('Helvetica');
  }

  // --- Helpers ---

  function isRestrictedUrl(url) {
    return !url || url.startsWith('chrome://') || url.startsWith('edge://') || url.startsWith('about:') || url.startsWith('view-source:');
  }

  function disableButtons(disabled) {
    extractBtn.disabled = disabled;
    copyBtn.disabled = disabled;
  }

  function setLoading(isLoading, actionType) {
    disableButtons(isLoading);
    
    // Reset texts
    if (!isLoading) {
      extractBtnText.textContent = 'Export JSON for Figma';
      copyBtnText.textContent = 'Copy JSON to Clipboard';
      extractBtn.classList.remove('loading');
      return;
    }

    // Set loading state
    if (actionType === 'download') {
      extractBtn.classList.add('loading');
      extractBtnText.textContent = 'Processing...';
    } else {
      copyBtnText.textContent = 'Processing...';
    }
  }

  function setStatus(msg, type) {
    statusDiv.textContent = msg;
    statusDiv.className = 'status ' + type;
  }

  function downloadJSON(data, pageTitle) {
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

  async function copyToClipboard(data) {
    const jsonString = JSON.stringify(data, null, 2);
    await navigator.clipboard.writeText(jsonString);
  }
});

// --- In-Page Functions ---

function countStyles() {
  return {
    inline: document.querySelectorAll('style').length,
    external: document.querySelectorAll('link[rel="stylesheet"]').length
  };
}

function getPageCSSInfo() {
  const inlineStyles = Array.from(document.querySelectorAll('style'))
    .map(style => style.textContent);

  const externalLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .map(link => link.href)
    .filter(href => href); 

  return {
    inlineStyles,
    externalLinks,
    pageTitle: document.title,
    hostname: window.location.hostname,
    pathname: window.location.pathname
  };
}