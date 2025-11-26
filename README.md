# CSS Overview Extractor

A robust, high-performance Chrome extension that extracts, categorizes, and normalizes design tokens (colors, fonts, etc.) from any webpage.

![Extension Icon](Icon.png)

## Features

*   **Deep Extraction:** Scans both inline `<style>` tags and external `<link rel="stylesheet">` resources.
*   **Component-Based Organization:** Automatically groups tokens by UI components:
    *   **Primitives:** Global design tokens (colors, fonts, spacing, radii)
    *   **Components:** Component-specific tokens organized by type:
        *   Buttons (primary, secondary, danger, etc.)
        *   Inputs (default, focus, error, etc.)
        *   Cards, Badges, Alerts, Modals, Navigation, Links, Tables
*   **Smart Detection:** Uses pattern matching to identify components from:
    *   CSS variable names (`--btn-primary-bg`, `--input-border`)
    *   CSS selectors (`.btn-primary`, `.card`, `input`)
    *   Variant detection (primary, secondary, success, danger, etc.)
*   **Advanced Transformation:** Automatically cleans and structures tokens:
    *   **Semantic Nesting:** Converts hyphenated keys to nested objects
    *   **camelCase Conversion:** Modern JavaScript naming conventions
    *   **Design System Detection:** Auto-extracts WDS-, MUI-, MATERIAL- prefixed tokens
    *   **Garbage Filtering:** Removes obfuscated keys (x1abc2d, generated-123) to `legacy`
    *   **Redundant Removal:** Strips repeated component names from properties
*   **CSS Noise Filtering:** Strips framework clutter before extraction:
    *   **Tailwind Utilities:** Removes .mt-4, .p-2, .bg-blue-500, etc.
    *   **Bootstrap Utilities:** Filters .mt-3, .px-4, .text-primary, etc.
    *   **Vendor Prefixes:** Strips -webkit-, -moz-, -ms- properties
    *   **Framework Variables:** Removes --tw-*, --bs-* CSS variables
    *   **Directives:** Cleans @tailwind, @apply, @layer declarations
*   **Color Normalization:** Uses the browser's native engine to convert named colors (e.g., `cornflowerblue`) to standard `rgb()` or `rgba()` values.
*   **Export Options:**
    *   **Download JSON:** Get a structured `.json` file organized by components.
    *   **Clipboard:** Instantly copy the JSON structure.
*   **Security:** Securely fetches external resources using Chrome's permission model.

## 🚀 How to Run the Project

Since this is a Chrome Extension, "running" it involves loading it into your browser in Developer Mode.

### Prerequisites
*   Google Chrome (or a Chromium-based browser like Edge or Brave).
*   Git (to clone the repo) or simply download the ZIP.

### Step-by-Step Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/mushfiqk47/Css-Extractor.git
    ```
    *Or download the ZIP and extract it.*

2.  **Open Chrome Extensions Page**
    *   Open Chrome.
    *   Navigate to `chrome://extensions/` in the address bar.

3.  **Enable Developer Mode**
    *   Toggle the **Developer mode** switch in the top-right corner of the page.

4.  **Load the Extension**
    *   Click the **Load unpacked** button (top-left).
    *   Select the root folder of this project (the folder containing `manifest.json`).

5.  **Run It**
    *   Go to any website (e.g., `example.com`).
    *   Click the **Puzzle Piece** icon in Chrome's toolbar and pin the **CSS Overview Extractor**.
    *   Click the extension icon to analyze the page.

## Architecture

The project follows a modular, maintainable structure using ES Modules:

```
src/
├── core/
│   ├── config.js             # Regex patterns, constants, and group definitions
│   ├── component-detector.js # Component pattern matching and detection
│   ├── css-filter.js         # Framework noise filtering (Tailwind, Bootstrap)
│   ├── extractor.js          # Core parsing logic (Framework agnostic)
│   ├── token-transformer.js  # Advanced JSON transformation engine
│   └── utils.js              # Helpers (Color normalization, File I/O)
├── ui/
│   └── popup.js              # Extension UI logic and Event Handling
manifest.json                 # Extension Configuration
popup.html                    # UI Entry Point
```

## 🛠 Development & Testing

### Making Changes
1.  Modify files in `src/` or `popup.html`.
2.  Go to `chrome://extensions/`.
3.  Click the **Reload** (circular arrow) icon on the extension card.
4.  Re-open the extension popup on your target webpage.


## Contributing
Pull requests are welcome! Please ensure existing tests pass by checking `tests/index.html` before submitting.
