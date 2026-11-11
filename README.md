# ✨ Modern Elegant Calculator

A sleek, responsive, and fully functional web calculator built with vanilla **HTML5**, **CSS3**, and **JavaScript (ES6+)**.

---

## 🚀 Features

- **Standard Arithmetic Operations**:
  - Addition (`+`)
  - Subtraction (`−`)
  - Multiplication (`×`)
  - Division (`÷`) with zero-division protection
- **Special Operations**:
  - Percentage (`%`): context-aware (e.g. `200 + 10% = 220`) and standalone (e.g. `50% = 0.5`)
  - Sign toggle (`±`): toggle between positive and negative numbers
  - Decimal (`.`): strictly prevents duplicate decimal points
  - Delete (`DEL` / Backspace): removes the last entered digit
  - All Clear (`AC`): resets the calculator state
- **Precision Arithmetic**:
  - Fixes JavaScript floating-point rounding quirks (e.g. `0.1 + 0.2 = 0.3`).
  - Scientific notation support for very large or microscopic numbers.
- **Dynamic Display**:
  - Live preview of previous expression and operator.
  - Auto-scaling font size for long numbers so digits never clip or break out of bounds.
  - Comma separation for thousands (e.g. `1,234,567.89`).
- **Interactive UI & Themes**:
  - **Dark Mode & Light Mode**: Smooth transition with persistent theme preference in `localStorage`.
  - **Tactile Sound Effects**: Built with Web Audio API synthesis (pure code, zero external audio files). Includes an easy mute/unmute toggle.
  - **Slide-out Calculation History**: View up to 25 past calculations, tap any previous entry to reload its result back onto the display, and clear history with one click.
  - **Visual Button Ripple & Active States**: Smooth micro-interactions and tactile feedback on both mouse and touch.
- **Full Keyboard Support**:
  - Numbers: `0` - `9`
  - Operations: `+`, `-`, `*` or `x`, `/`
  - Calculate: `Enter` or `=`
  - Delete: `Backspace`
  - All Clear: `Escape`
  - Percentage: `%`
  - Decimal: `.`

---

## 📁 File Structure

```
calculator/
├── index.html     # Semantic, accessible HTML structure
├── style.css      # Modern design tokens, glassmorphism, responsive grid, dark/light themes
├── script.js     # Robust OOP Calculator engine with state management & audio synthesis
└── README.md      # Documentation & usage guide
```

---

## 💻 How to Run

1. Open `index.html` directly in any modern browser (Chrome, Edge, Firefox, Safari), or
2. Use a local development server like VS Code's **Live Server** extension.

