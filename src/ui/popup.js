import { extractDesignTokens } from '../core/extractor.js';
import { downloadJSON, copyToClipboard } from '../core/utils.js';
import { transformFullOutput } from '../core/token-transformer.js';

document.addEventListener('DOMContentLoaded', function () {
  const extractBtn = document.getElementById('extractBtn');
  const copyBtn = document.getElementById('copyBtn');
  const statusDiv = document.getElementById('status');
  const styleTagCountEl = document.getElementById('styleTagCount');
  const linkTagCountEl = document.getElementById('linkTagCount');
  const extractBtnText = extractBtn.querySelector('.btn-text');
  const copyBtnText = copyBtn.querySelector('.btn-text');

  // Check environment
  if (!chrome.tabs) {
    setStatus('Error: Context invalid', 'error');
    return;
  }

  // Initial check to update stats
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (tab?.id && !isRestrictedUrl(tab.url)) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
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

  extractBtn.addEventListener('click', () => handleAction('download'));
  copyBtn.addEventListener('click', () => handleAction('copy'));

  async function handleAction(actionType) {
    setLoading(true, actionType);
    setStatus('Analyzing page...', '');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.url) throw new Error('No active tab found');
      if (isRestrictedUrl(tab.url)) throw new Error('Restricted page.');

      // 1. Get the list of resources
      const executionResult = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: getPageCSSInfo
      });

      if (!executionResult || !executionResult[0]?.result) {
        throw new Error('Failed to analyze page.');
      }

      const { inlineStyles, externalLinks, pageTitle, hostname } = executionResult[0].result;

      // 2. Fetch external resources
      setStatus(`Fetching ${externalLinks.length} stylesheets...`, '');

      // Parallel fetch with timeout handling would be ideal, but Promise.allSettled is good.
      // We could add a timeout wrapper if needed, but fetch usually timeouts eventually.
      const externalCSSContents = await Promise.allSettled(
        externalLinks.map(async (link) => {
          try {
            const response = await fetch(link);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.text();
          } catch (err) {
            console.warn(`Failed to fetch ${link}:`, err);
            return '';
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

      // We yield to UI thread briefly to let status update render if the CSS is huge?
      // JS is single threaded, so this might block. 
      // Using setTimeout is a cheap way to yield.
      await new Promise(resolve => setTimeout(resolve, 10));

      const rawTokens = extractDesignTokens(fullCSS);

      // 4. Structure Hierarchically (Domain -> Groups)
      const structuredData = {
        [hostname]: rawTokens
      };

      // 5. Apply Advanced Transformation (Clean, Semantic, Hierarchical)
      setStatus('Transforming tokens...', '');
      const cleanedData = transformFullOutput(structuredData);

      if (actionType === 'download') {
        setStatus('Downloading JSON...', 'success');
        downloadJSON(cleanedData, pageTitle);
      } else {
        setStatus('Copying to clipboard...', '');
        await copyToClipboard(cleanedData);
        setStatus('Copied to clipboard!', 'success');
      }

    } catch (error) {
      console.error(error);
      setStatus(error.message, 'error');
    } finally {
      setLoading(false, actionType);
    }
  }

  // --- UI Helpers ---

  function isRestrictedUrl(url) {
    return !url || url.startsWith('chrome://') || url.startsWith('edge://') || url.startsWith('about:') || url.startsWith('view-source:');
  }

  function disableButtons(disabled) {
    extractBtn.disabled = disabled;
    copyBtn.disabled = disabled;
  }

  function setLoading(isLoading, actionType) {
    disableButtons(isLoading);

    if (!isLoading) {
      extractBtnText.textContent = 'Export JSON for Figma';
      copyBtnText.textContent = 'Copy JSON to Clipboard';
      extractBtn.classList.remove('loading');
      return;
    }

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
});

// --- In-Page Functions (Must be self-contained) ---
// These are serialized and injected, so they cannot reference outer scope variables.

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
    hostname: window.location.hostname
  };
}
