# 🎨 CSS Overview Extractor

**Steal the look!** (Legally, of course 😉). This powerful Chrome extension is your new best friend for extracting, organizing, and making sense of design tokens from *any* website.

![Extension Icon](Icon.png)

## ✨ Why You'll Love It

Stop digging through DevTools like a caveman. We do the heavy lifting for you!

*   **🕵️‍♂️ Sherlock Holmes Mode:** We scan everything—inline styles, external stylesheets, you name it. Nothing hides from us.
*   **🧩 Component Magic:** We don't just dump a list of colors. We intelligently group them into:
    *   **Primitives:** The building blocks (colors, fonts, spacing).
    *   **Components:** Buttons, Inputs, Cards, and more!
*   **🧠 Big Brain Detection:** We spot patterns like a hawk. `--btn-primary-bg`? We know that's a Primary Button background.
*   **🧹 The Marie Kondo Treatment:**
    *   **Nesting:** Hyphenated-keys become beautiful nested objects.
    *   **CamelCase:** Because we live in 2025 (or whenever you're reading this).
    *   **Trash Collection:** We filter out the junk (looking at you, obfuscated class names).
*   **🤫 Shhh, No Noise:** We strip out Tailwind utilities, Bootstrap clutter, and vendor prefixes so you only get the *pure* design system.
*   **🌈 Color Wizardry:** `cornflowerblue`? We convert that to standard `rgb()` so your computer understands it too.
*   **📤 Export Like a Pro:**
    *   **JSON Download:** Get a neat file for your project.
    *   **Clipboard:** Copy-paste and go!

## 🚀 Let's Get This Party Started

Since this is a Chrome Extension, we're going to load it up in **Developer Mode**. Don't worry, it's easy!

### What You Need
*   Chrome (or Edge, Brave, etc.)
*   Git (or just know how to unzip a file)

### 3-Minute Setup

1.  **Grab the Code**
    ```bash
    git clone https://github.com/mushfiqk47/Css-Extractor.git
    ```
    *(Or just download the ZIP and unzip it somewhere safe)*

2.  **Open Chrome Extensions**
    *   Type `chrome://extensions/` in your address bar.
    *   Hit Enter.

3.  **Unlock Developer Powers**
    *   Flip that **Developer mode** switch in the top-right corner. ⚡

4.  **Load It Up**
    *   Click **Load unpacked** (top-left).
    *   Pick the folder where you put this project.

5.  **Go Wild!**
    *   Visit your favorite site (e.g., `example.com`).
    *   Click the **Puzzle Piece** 🧩, pin **CSS Overview Extractor**, and click it!
    *   Watch the magic happen. ✨

## 🏗️ Under the Hood

For the nerds (like us):

```
src/
├── core/                 # The Brains 🧠
│   ├── config.js         # The Rules
│   ├── component-detector.js # The Detective
│   ├── css-filter.js     # The Bouncer (keeps noise out)
│   ├── extractor.js      # The Miner
│   ├── token-transformer.js # The Translator
│   └── utils.js          # The Helpers
├── ui/                   # The Face 💅
│   └── popup.js          # The Logic
manifest.json             # The ID Card
popup.html                # The Look
```

## 🛠️ Hacking on It

Want to make it better?

1.  Tweak the code in `src/`.
2.  Head back to `chrome://extensions/`.
3.  Hit that **Reload** 🔄 button.
4.  Test it out!

## 🤝 Join the Club

Found a bug? Have a cool idea? Pull requests are super welcome! Just make sure you didn't break anything first. 😉

---
*Made with ❤️ and a lot of caffeine.*
