# CSS Overview Extractor

A robust, high-performance Chrome extension that extracts, categorizes, and normalizes design tokens (colors, fonts, etc.) from any webpage.

![Extension Icon](Icon.png)

## Features

*   **Deep Extraction:** Scans both inline `<style>` tags and external `<link rel="stylesheet">` resources.
*   **Smart Categorization:** Automatically groups tokens using semantic analysis:
    *   **Backgrounds:** `background-color`, variables like `--bg`, `--surface`.
    *   **Text:** `color`, variables like `--text`, `--fg`.
    *   **Borders:** `border-color`, `--border`.
    *   **Fills:** `fill`, `stroke`.
    *   **Fonts:** `font-family` stacks.
*   **Color Normalization:** Uses the browser's native engine to convert named colors (e.g., `cornflowerblue`) to standard `rgb()` or `rgba()` values.
*   **Export Options:**
    *   **Download JSON:** Get a structured `.json` file for Figma.
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
│   ├── config.js      # Regex patterns, constants, and group definitions
│   ├── extractor.js   # Core parsing logic (Framework agnostic)
│   └── utils.js       # Helpers (Color normalization, File I/O)
├── ui/
│   └── popup.js       # Extension UI logic and Event Handling
tests/
└── index.html         # Browser-based unit test suite
manifest.json          # Extension Configuration
popup.html             # UI Entry Point
```

## 🛠 Development & Testing

### Making Changes
1.  Modify files in `src/` or `popup.html`.
2.  Go to `chrome://extensions/`.
3.  Click the **Reload** (circular arrow) icon on the extension card.
4.  Re-open the extension popup on your target webpage.

### Running Tests
This project includes a browser-based unit test suite to verify the extraction logic.
1.  Locate the file `tests/index.html` in your project folder.
2.  Open it directly in Chrome (Double-click or Drag & Drop).
3.  The page will display "PASS" or "FAIL" for each test case.

## Contributing
Pull requests are welcome! Please ensure existing tests pass by checking `tests/index.html` before submitting.