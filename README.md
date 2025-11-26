# CSS Overview Extractor

A powerful Chrome extension for designers and developers that extracts comprehensive design tokens (colors, fonts, etc.) from any website. It analyzes both inline styles and external stylesheets to generate a structured, grouped JSON file compatible with design tools like Figma.

![Extension Icon](Icon.png)

## Features

*   **Complete CSS Extraction:** Scans inline `<style>` tags and external `<link rel="stylesheet">` resources.
*   **Smart Grouping:** Automatically categorizes tokens into:
    *   Backgrounds
    *   Text Colors
    *   Borders
    *   Fills
    *   Font Families
*   **Color Normalization:** Converts named colors (e.g., "red") to standard Hex/RGB formats for consistency.
*   **JSON Export:**
    *   **Download:** Save a `.json` file locally.
    *   **Copy to Clipboard:** Instantly copy the JSON structure for quick pasting.
*   **CORS Bypass:** securely fetches external stylesheets that standard scripts cannot access.
*   **Modern UI:** Clean interface with dark mode support.

## Installation

1.  Clone this repository or download the source code.
2.  Open Google Chrome and navigate to `chrome://extensions/`.
3.  Enable **Developer mode** using the toggle in the top-right corner.
4.  Click **Load unpacked**.
5.  Select the folder containing this project (`Css_overview`).

## Usage

1.  Navigate to the website you want to analyze.
2.  Click the **CSS Overview Extractor** icon in your browser toolbar.
3.  Wait for the analysis to complete (the popup shows the count of style sources).
4.  Choose your action:
    *   **Export JSON for Figma:** Downloads a `.json` file.
    *   **Copy JSON to Clipboard:** Copies the data directly to your clipboard.

## JSON Output Structure

The output is structured by the website hostname, followed by the token groups:

```json
{
  "www.example.com": {
    "Backgrounds": {
      "generated-background-1": { "value": "rgb(255, 255, 255)", "type": "color" },
      "primary": { "value": "#2563eb", "type": "color" }
    },
    "Text Colors": {
      "text-main": { "value": "#1f2937", "type": "color" }
    },
    "Font Families": {
      "font-1": { "value": "Inter, sans-serif", "type": "fontFamilies" }
    }
    // ... Borders, Fills, Other Colors
  }
}
```

## Development

### Project Structure
*   `manifest.json`: Extension configuration (MV3).
*   `popup.html`: The extension's UI.
*   `popup.js`: Logic for the UI, token extraction, and data formatting.
*   `Icon.png`: Application icon.

### Permissions
*   `activeTab`: To access the current page's DOM.
*   `scripting`: To inject analysis scripts.
*   `downloads`: To save the JSON file.
*   `<all_urls>`: To fetch external stylesheets from different domains (CORS).