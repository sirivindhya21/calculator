/**
 * Modern Elegant Calculator
 * Fully-featured with keyboard support, precision arithmetic,
 * calculation history, theme switcher, and Web Audio feedback.
 */

class Calculator {
  constructor(previousDisplayElement, currentDisplayElement) {
    this.previousDisplayElement = previousDisplayElement;
    this.currentDisplayElement = currentDisplayElement;
    this.history = this.loadHistory();
    this.soundEnabled = localStorage.getItem('calc_sound') === 'true';
    this.audioCtx = null;
    this.clear();
  }

  clear() {
    this.currentOperand = '0';
    this.previousOperand = '';
    this.operation = undefined;
    this.shouldResetScreen = false;
    this.isError = false;
  }

  delete() {
    if (this.isError) {
      this.clear();
      return;
    }
    if (this.shouldResetScreen) {
      this.currentOperand = '0';
      this.shouldResetScreen = false;
      return;
    }
    if (this.currentOperand === '0') return;

    if (this.currentOperand.length === 1 || (this.currentOperand.length === 2 && this.currentOperand.startsWith('-'))) {
      this.currentOperand = '0';
    } else {
      this.currentOperand = this.currentOperand.slice(0, -1);
    }
  }

  appendNumber(number) {
    if (this.isError) this.clear();

    if (this.shouldResetScreen) {
      this.currentOperand = '';
      this.shouldResetScreen = false;
    }

    // Prevent multiple decimals
    if (number === '.' && this.currentOperand.includes('.')) return;

    // Handle initial decimal
    if (number === '.') {
      if (this.currentOperand === '' || this.currentOperand === '0') {
        this.currentOperand = '0.';
        return;
      }
      if (this.currentOperand === '-') {
        this.currentOperand = '-0.';
        return;
      }
    }

    // Prevent excessive leading zeros
    if (number === '0' && this.currentOperand === '0') return;

    // Replace initial 0 with the number if not a decimal
    if (this.currentOperand === '0' && number !== '.') {
      this.currentOperand = number.toString();
      return;
    }

    // Cap max display length to prevent overflow
    if (this.currentOperand.replace(/[-.]/g, '').length >= 14) return;

    this.currentOperand = this.currentOperand.toString() + number.toString();
  }

  chooseOperation(operation) {
    if (this.isError) this.clear();

    // If user clicked an operator and then clicked another operator before entering a number,
    // update the operator without recomputing
    if (this.shouldResetScreen && this.operation != null) {
      this.operation = operation;
      return;
    }

    if (this.previousOperand !== '') {
      this.compute();
    }

    this.operation = operation;
    this.previousOperand = this.currentOperand;
    this.shouldResetScreen = true;
  }

  compute() {
    let computation;
    const prev = parseFloat(this.previousOperand);
    const current = parseFloat(this.currentOperand);

    if (isNaN(prev) || isNaN(current) || !this.operation) return;

    switch (this.operation) {
      case '+':
        computation = prev + current;
        break;
      case '-':
        computation = prev - current;
        break;
      case '×':
      case '*':
        computation = prev * current;
        break;
      case '÷':
      case '/':
        if (current === 0) {
          this.currentOperand = 'Cannot divide by 0';
          this.previousOperand = '';
          this.operation = undefined;
          this.isError = true;
          this.shouldResetScreen = true;
          return;
        }
        computation = prev / current;
        break;
      case '^':
        computation = Math.pow(prev, current);
        break;
      default:
        return;
    }

    // Normalize floating point inaccuracies (e.g., 0.1 + 0.2 = 0.3)
    const normalizedResult = this.normalizeResult(computation);

    // Save calculation to history
    this.addHistoryItem(`${this.previousOperand} ${this.getSymbol(this.operation)} ${this.currentOperand}`, normalizedResult);

    this.currentOperand = normalizedResult.toString();
    this.previousOperand = '';
    this.operation = undefined;
    this.shouldResetScreen = true;
  }

  applyPercentage() {
    if (this.isError || this.currentOperand === '0') return;

    const current = parseFloat(this.currentOperand);
    if (isNaN(current)) return;

    if (this.previousOperand !== '' && this.operation) {
      const prev = parseFloat(this.previousOperand);
      if (!isNaN(prev)) {
        // Context-aware percentage: 100 + 10% = 100 + (100 * 0.10)
        let percentValue;
        if (this.operation === '+' || this.operation === '-') {
          percentValue = prev * (current / 100);
        } else {
          percentValue = current / 100;
        }
        this.currentOperand = this.normalizeResult(percentValue).toString();
        return;
      }
    }

    // Standalone percentage: 50% = 0.5
    this.currentOperand = this.normalizeResult(current / 100).toString();
    this.shouldResetScreen = true;
  }

  executeSci(fn) {
    if (this.isError) this.clear();

    if (fn === 'pi') {
      this.currentOperand = this.normalizeResult(Math.PI).toString();
      this.shouldResetScreen = true;
      return;
    }
    if (fn === 'e') {
      this.currentOperand = this.normalizeResult(Math.E).toString();
      this.shouldResetScreen = true;
      return;
    }

    const current = parseFloat(this.currentOperand);
    if (isNaN(current)) return;

    let res;
    let label = '';
    switch (fn) {
      case 'sqrt':
        if (current < 0) {
          this.currentOperand = 'Invalid Input';
          this.isError = true;
          this.shouldResetScreen = true;
          return;
        }
        res = Math.sqrt(current);
        label = `√(${current})`;
        break;
      case 'sqr':
        res = current * current;
        label = `sqr(${current})`;
        break;
      case 'reciprocal':
        if (current === 0) {
          this.currentOperand = 'Cannot divide by 0';
          this.isError = true;
          this.shouldResetScreen = true;
          return;
        }
        res = 1 / current;
        label = `1/(${current})`;
        break;
      case 'sin': {
        const rad = (current * Math.PI) / 180;
        res = Math.sin(rad);
        label = `sin(${current}°)`;
        break;
      }
      case 'cos': {
        const rad = (current * Math.PI) / 180;
        res = Math.cos(rad);
        label = `cos(${current}°)`;
        break;
      }
      case 'tan': {
        if (Math.abs(current % 180) === 90) {
          this.currentOperand = 'Invalid Input';
          this.isError = true;
          this.shouldResetScreen = true;
          return;
        }
        const rad = (current * Math.PI) / 180;
        res = Math.tan(rad);
        label = `tan(${current}°)`;
        break;
      }
      case 'log':
        if (current <= 0) {
          this.currentOperand = 'Invalid Input';
          this.isError = true;
          this.shouldResetScreen = true;
          return;
        }
        res = Math.log10(current);
        label = `log(${current})`;
        break;
      case 'ln':
        if (current <= 0) {
          this.currentOperand = 'Invalid Input';
          this.isError = true;
          this.shouldResetScreen = true;
          return;
        }
        res = Math.log(current);
        label = `ln(${current})`;
        break;
      case 'fact':
        if (current < 0 || !Number.isInteger(current) || current > 170) {
          this.currentOperand = 'Invalid Input';
          this.isError = true;
          this.shouldResetScreen = true;
          return;
        }
        res = 1;
        for (let i = 2; i <= current; i++) res *= i;
        label = `${current}!`;
        break;
      default:
        return;
    }

    const normalized = this.normalizeResult(res);
    this.addHistoryItem(label, normalized);
    this.currentOperand = normalized.toString();
    this.shouldResetScreen = true;
  }

  toggleSign() {
    if (this.isError) return;

    if (this.shouldResetScreen && this.operation != null) {
      this.currentOperand = '-';
      this.shouldResetScreen = false;
      return;
    }

    if (this.currentOperand === '0' || this.currentOperand === '') {
      this.currentOperand = '-';
      return;
    }

    if (this.currentOperand === '-') {
      this.currentOperand = '0';
      return;
    }

    if (this.currentOperand.startsWith('-')) {
      this.currentOperand = this.currentOperand.substring(1);
    } else {
      this.currentOperand = '-' + this.currentOperand;
    }
  }

  normalizeResult(num) {
    if (!isFinite(num)) return 'Error';
    // Round to 10 decimal digits to eliminate floating point glitches
    const rounded = Math.round((num + Number.EPSILON) * 1e10) / 1e10;
    // Format scientific notation if exceedingly large or tiny
    if (Math.abs(rounded) >= 1e14 || (Math.abs(rounded) > 0 && Math.abs(rounded) < 1e-6)) {
      return rounded.toExponential(6);
    }
    return rounded;
  }

  getSymbol(op) {
    if (op === '*') return '×';
    if (op === '/') return '÷';
    return op;
  }

  formatDisplayNumber(numberStr) {
    if (numberStr === 'Cannot divide by 0' || numberStr === 'Error') {
      return numberStr;
    }

    const stringNumber = numberStr.toString();
    if (stringNumber.includes('e')) {
      return stringNumber; // Scientific notation
    }

    const [integerDigits, decimalDigits] = stringNumber.split('.');
    let integerDisplay;

    if (integerDigits === '-' || integerDigits === '') {
      integerDisplay = integerDigits;
    } else {
      const parsed = parseFloat(integerDigits);
      if (isNaN(parsed)) {
        integerDisplay = '';
      } else {
        integerDisplay = parsed.toLocaleString('en-US', { maximumFractionDigits: 0 });
        if (integerDigits.startsWith('-') && integerDisplay === '0') {
          integerDisplay = '-' + integerDisplay;
        }
      }
    }

    if (decimalDigits != null) {
      return `${integerDisplay}.${decimalDigits}`;
    }
    return integerDisplay;
  }

  updateDisplay() {
    const formatted = this.formatDisplayNumber(this.currentOperand);
    this.currentDisplayElement.innerText = formatted;

    // Dynamically adjust font size to avoid overflow
    const length = formatted.length;
    this.currentDisplayElement.className = 'display-current';
    if (length > 13) {
      this.currentDisplayElement.classList.add('font-xs');
    } else if (length > 9) {
      this.currentDisplayElement.classList.add('font-sm');
    } else if (length > 7) {
      this.currentDisplayElement.classList.add('font-md');
    }

    if (this.operation != null && !this.isError) {
      this.previousDisplayElement.innerText = `${this.formatDisplayNumber(this.previousOperand)} ${this.getSymbol(this.operation)}`;
    } else {
      this.previousDisplayElement.innerText = '';
    }
  }

  // --- Sound Effects via Web Audio API (zero external assets needed) ---
  playSound(type = 'click') {
    if (!this.soundEnabled) return;
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      const now = this.audioCtx.currentTime;

      if (type === 'operator') {
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(480, now + 0.06);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === 'equals') {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.1);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'clear') {
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.linearRampToValueAtTime(140, now + 0.08);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else {
        // Standard digit click
        osc.frequency.setValueAtTime(520, now);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
        osc.start(now);
        osc.stop(now + 0.035);
      }
    } catch {
      // Audio playback fails silently if browser blocks autoplay
    }
  }

  // --- Calculation History Management ---
  loadHistory() {
    try {
      const saved = localStorage.getItem('calc_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  saveHistory() {
    try {
      localStorage.setItem('calc_history', JSON.stringify(this.history));
    } catch {
      // Storage quota or restriction
    }
  }

  addHistoryItem(expression, result) {
    this.history.unshift({ expression, result });
    if (this.history.length > 25) {
      this.history.pop();
    }
    this.saveHistory();
    this.renderHistory();
  }

  clearHistory() {
    this.history = [];
    this.saveHistory();
    this.renderHistory();
  }

  renderHistory() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;

    if (this.history.length === 0) {
      historyList.innerHTML = '<p class="history-empty">No calculations yet</p>';
      return;
    }

    historyList.innerHTML = this.history
      .map(
        (item, index) => `
        <div class="history-item" data-index="${index}">
          <div class="history-item-expr">${item.expression} =</div>
          <div class="history-item-res">${item.result}</div>
        </div>
      `
      )
      .join('');

    // Clicking an item in history loads its result
    historyList.querySelectorAll('.history-item').forEach((item) => {
      item.addEventListener('click', () => {
        const index = item.getAttribute('data-index');
        const record = this.history[index];
        if (record) {
          this.currentOperand = record.result.toString();
          this.previousOperand = '';
          this.operation = undefined;
          this.shouldResetScreen = true;
          this.updateDisplay();
          this.playSound('click');
          const panel = document.getElementById('historyPanel');
          if (panel) {
            panel.classList.remove('open');
            panel.setAttribute('aria-hidden', 'true');
          }
        }
      });
    });
  }
}

// ==========================================================================
// App Initialization & DOM Binding
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  const previousDisplayElement = document.getElementById('previousOperand');
  const currentDisplayElement = document.getElementById('currentOperand');
  const calculator = new Calculator(previousDisplayElement, currentDisplayElement);

  // Initial display update & history render
  calculator.updateDisplay();
  calculator.renderHistory();

  // ---------------- Button Click Handling ----------------
  const buttons = document.querySelectorAll('.calc-keypad button, .calc-scientific button');

  buttons.forEach((button) => {
    button.addEventListener('click', (e) => {
      createRipple(e, button);

      const action = button.dataset.action;
      const number = button.dataset.number;
      const operator = button.dataset.operator;

      if (number !== undefined) {
        calculator.appendNumber(number);
        calculator.playSound('click');
      } else if (action === 'operator') {
        calculator.chooseOperation(operator);
        calculator.playSound('operator');
      } else if (action === 'equals') {
        calculator.compute();
        calculator.playSound('equals');
      } else if (action === 'clear') {
        calculator.clear();
        calculator.playSound('clear');
      } else if (action === 'delete') {
        calculator.delete();
        calculator.playSound('click');
      } else if (action === 'percent') {
        calculator.applyPercentage();
        calculator.playSound('operator');
      } else if (action === 'decimal') {
        calculator.appendNumber('.');
        calculator.playSound('click');
      } else if (action === 'negate') {
        calculator.toggleSign();
        calculator.playSound('click');
      } else if (action === 'sci') {
        const fn = button.dataset.fn;
        calculator.executeSci(fn);
        calculator.playSound('operator');
      }

      calculator.updateDisplay();
      highlightActiveOperator();
    });
  });

  function highlightActiveOperator() {
    const operatorButtons = document.querySelectorAll('.btn-operator');
    operatorButtons.forEach((btn) => {
      if (calculator.operation && btn.dataset.operator === calculator.operation && calculator.shouldResetScreen) {
        btn.classList.add('active-operator');
      } else {
        btn.classList.remove('active-operator');
      }
    });
  }

  // ---------------- Ripple Effect ----------------
  function createRipple(event, button) {
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    const rect = button.getBoundingClientRect();
    const x = event.clientX ? event.clientX - rect.left - radius : radius;
    const y = event.clientY ? event.clientY - rect.top - radius : radius;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${x}px`;
    circle.style.top = `${y}px`;
    circle.classList.add('ripple');

    const ripple = button.getElementsByClassName('ripple')[0];
    if (ripple) ripple.remove();

    button.appendChild(circle);
    setTimeout(() => circle.remove(), 500);
  }

  // ---------------- Full Keyboard Support ----------------
  window.addEventListener('keydown', (e) => {
    // Avoid interfering if user is focused on an input element
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    let key = e.key;
    let targetButton = null;

    if (key >= '0' && key <= '9') {
      targetButton = document.querySelector(`button[data-number="${key}"]`);
    } else if (key === '.') {
      targetButton = document.querySelector('button[data-action="decimal"]');
    } else if (key === '+' || key === '-') {
      targetButton = document.querySelector(`button[data-operator="${key}"]`);
    } else if (key === '*' || key === 'x' || key === 'X') {
      targetButton = document.querySelector('button[data-operator="×"]');
    } else if (key === '/') {
      e.preventDefault(); // Prevent Firefox quick-find
      targetButton = document.querySelector('button[data-operator="÷"]');
    } else if (key === 'Enter' || key === '=') {
      e.preventDefault();
      targetButton = document.querySelector('button[data-action="equals"]');
    } else if (key === 'Backspace') {
      targetButton = document.querySelector('button[data-action="delete"]');
    } else if (key === 'Escape') {
      targetButton = document.querySelector('button[data-action="clear"]');
    } else if (key === '%') {
      targetButton = document.querySelector('button[data-action="percent"]');
    }

    if (targetButton) {
      targetButton.classList.add('btn-active-key');
      setTimeout(() => targetButton.classList.remove('btn-active-key'), 140);
      targetButton.click();
    }
  });

  // ---------------- Theme Switcher ----------------
  const themeToggle = document.getElementById('themeToggle');
  const sunIcon = themeToggle.querySelector('.sun-icon');
  const moonIcon = themeToggle.querySelector('.moon-icon');

  function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    if (theme === 'light') {
      sunIcon.classList.remove('hidden');
      moonIcon.classList.add('hidden');
    } else {
      sunIcon.classList.add('hidden');
      moonIcon.classList.remove('hidden');
    }
    localStorage.setItem('calc_theme', theme);
  }

  const savedTheme = localStorage.getItem('calc_theme') || 'dark';
  applyTheme(savedTheme);

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    calculator.playSound('click');
  });

  // ---------------- Sound Toggle ----------------
  const soundToggle = document.getElementById('soundToggle');
  const soundOnIcon = soundToggle.querySelector('.sound-on');
  const soundOffIcon = soundToggle.querySelector('.sound-off');

  function updateSoundUI() {
    if (calculator.soundEnabled) {
      soundOnIcon.classList.remove('hidden');
      soundOffIcon.classList.add('hidden');
      soundToggle.classList.add('active');
    } else {
      soundOnIcon.classList.add('hidden');
      soundOffIcon.classList.remove('hidden');
      soundToggle.classList.remove('active');
    }
  }

  updateSoundUI();

  soundToggle.addEventListener('click', () => {
    calculator.soundEnabled = !calculator.soundEnabled;
    localStorage.setItem('calc_sound', calculator.soundEnabled ? 'true' : 'false');
    updateSoundUI();
    if (calculator.soundEnabled) calculator.playSound('click');
  });

  // ---------------- History Panel Drawer ----------------
  const historyToggle = document.getElementById('historyToggle');
  const historyPanel = document.getElementById('historyPanel');
  const closeHistoryBtn = document.getElementById('closeHistoryBtn');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');

  function openHistory() {
    historyPanel.classList.add('open');
    historyPanel.setAttribute('aria-hidden', 'false');
    calculator.renderHistory();
  }

  function closeHistory() {
    historyPanel.classList.remove('open');
    historyPanel.setAttribute('aria-hidden', 'true');
  }

  historyToggle.addEventListener('click', () => {
    if (historyPanel.classList.contains('open')) {
      closeHistory();
    } else {
      openHistory();
    }
    calculator.playSound('click');
  });

  closeHistoryBtn.addEventListener('click', () => {
    closeHistory();
    calculator.playSound('click');
  });

  clearHistoryBtn.addEventListener('click', () => {
    calculator.clearHistory();
    calculator.playSound('clear');
  });

  // ---------------- Scientific Mode Switcher ----------------
  const modeToggle = document.getElementById('modeToggle');
  const calcCard = document.getElementById('calcCard');
  if (modeToggle && calcCard) {
    modeToggle.addEventListener('click', () => {
      const isActive = calcCard.classList.toggle('scientific-active');
      modeToggle.classList.toggle('active', isActive);
      calculator.playSound('click');
    });
  }

  // ---------------- Click to Copy Display Result ----------------
  const displayArea = document.getElementById('displayArea');
  const copyToast = document.getElementById('copyToast');
  if (displayArea) {
    displayArea.addEventListener('click', async () => {
      const val = calculator.currentOperand;
      if (val && val !== 'Cannot divide by 0' && val !== 'Error' && val !== 'Invalid Input') {
        try {
          await navigator.clipboard.writeText(val);
          if (copyToast) {
            copyToast.classList.add('show');
            setTimeout(() => copyToast.classList.remove('show'), 1500);
          }
        } catch {
          // Fallback if clipboard API is restricted
        }
      }
    });
  }

  // ---------------- Service Worker for Offline PWA Support ----------------
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }
});
