const { dialog, fs, path } = window.__TAURI__;
const { getCurrentWindow } = window.__TAURI__.window;

const info = document.querySelector('.info');
const footer = document.querySelector('footer > div');
const editor = document.querySelector('div[contenteditable]');
const placeholder = editor.getAttribute('placeholder');
const searchInput = document.querySelector('.command-palette input');
let codeMode = false;
let rainbow = false;
let dynamicGlow = false;
let saved = true;
let activeFilePath = null;
let timer, timer2;
let activeFile = 'untitled.txt';
let fontSize = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--font-size'));

const fileName = 'data.inkless';
const saveTimers = {};

async function parseFile() {
  const filePath = `./${fileName}`;
  try {
    const content = await fs.readTextFile(filePath);
    const lines = content.split('\n');
    const data = {};
    let multiLineKey = null;
    let multiLineValue = [];

    for (const line of lines) {
      let trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('#') && !multiLineKey) {
        continue;
      }

      if (multiLineKey) {
        if (trimmed === '---') {
          const parts = multiLineKey.split('.');
          let ref = data;
          for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (i === parts.length - 1) ref[part] = multiLineValue.join('\n');
            else ref[part] = ref[part] || {};
            ref = ref[part];
          }
          multiLineKey = null;
          multiLineValue = [];
        } else {
          multiLineValue.push(trimmed);
        }
        continue;
      }

      if (trimmed.includes('#')) {
        const commentIndex = trimmed.indexOf('#');
        trimmed = trimmed.slice(0, commentIndex).trim();
      }

      const [k, ...rest] = trimmed.split('=');
      const val = rest.join('=').trim();

      if (val === '---') {
        multiLineKey = k.trim();
        multiLineValue = [];
      } else {
        const parts = k.trim().split('.');
        let ref = data;
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          if (i === parts.length - 1) ref[part] = val;
          else ref[part] = ref[part] || {};
          ref = ref[part];
        }
      }
    }
    return data;
  } catch (e) {
    return {};
  }
}

async function saveData(key, value) {
  const data = await parseFile();
  if (saveTimers[key]) clearTimeout(saveTimers[key]);

  saveTimers[key] = setTimeout(async () => {
    const parts = key.split('.');
    let ref = data;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) ref[part] = value.includes('\n') ? value : value.trim();
      else ref[part] = ref[part] || {};
      ref = ref[part];
    }

    function serialize(obj, prefix = '') {
      let result = '';
      for (const [key, val] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof val === 'object' && !Array.isArray(val)) result += serialize(val, fullKey);
        else result += typeof val === 'string' && val.includes('\n') ? `${fullKey} = ---\n${val}\n---\n` : `${fullKey} = ${val}\n`;
      }
      return result;
    }

    const formatted = serialize(data);
    await fs.writeTextFile(`./${fileName}`, formatted);

    delete saveTimers[key];
  }, 500);
}

async function getData(key) {
  const data = await parseFile();
  const parts = key.split('.');
  let ref = data;

  for (const part of parts) {
    if (ref[part] === undefined) return null;
    ref = ref[part];
  }

  return ref.startsWith('---') && ref.endsWith('---') ? ref.slice(3, -3).trim() : ref;
}

async function getAll() {
  return await parseFile();
}

// Keyboard handler

const keydownHandler = function (e) {
  if ((e.key === 'Tab' && e.shiftKey) || e.key === 'Tab') {
    e.preventDefault();
    if (e.shiftKey) {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      const range = selection.getRangeAt(0);
      const node = range.startContainer;
      const offset = range.startOffset;
      if (node.nodeType === Node.TEXT_NODE && offset >= 4 && node.textContent.slice(offset - 4, offset) === '    ') {
        range.setStart(node, offset - 4);
        range.setEnd(node, offset);
        range.deleteContents();
      }
    } else {
      document.execCommand('insertText', false, '    ');
    }
  } else if (['"', "'", '(', '{', '[', '<'].includes(e.key)) {
    e.preventDefault();
    const pairMap = { '"': '"', "'": "'", '(': ')', '{': '}', '[': ']', '<': '>' };
    const pair = pairMap[e.key];
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const startNode = document.createTextNode(e.key);
    const endNode = document.createTextNode(pair);
    range.insertNode(endNode);
    range.insertNode(startNode);
    range.setStart(startNode, 1);
    range.setEnd(startNode, 1);
    selection.removeAllRanges();
    selection.addRange(range);
  } else if (e.key === 'x' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    let start = range.startContainer;
    while (start && start.nodeType !== Node.ELEMENT_NODE) start = start.parentNode;
    let end = range.endContainer;
    while (end && end.nodeType !== Node.ELEMENT_NODE) end = end.parentNode;
    if (start && end && start === end && start.nodeType === Node.ELEMENT_NODE) {
      const lineText = start.textContent;
      navigator.clipboard.writeText(lineText).then(() => {
        start.textContent = '';
      });
    }
  } else if (e.key === 'Home') {
    e.preventDefault();
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    const node = range.startContainer;
    const offset = range.startOffset;
    const lineText = node.textContent;
    let newOffset = 0;
    for (let i = 0; i < lineText.length; i++) {
      if (lineText[i] !== ' ' && lineText[i] !== '\t') {
        newOffset = i;
        break;
      }
    }
    if (offset === newOffset || offset === 0) newOffset = 0;
    range.setStart(node, newOffset);
    range.setEnd(node, newOffset);
    selection.removeAllRanges();
    selection.addRange(range);
  }
};

// Search

document.addEventListener('DOMContentLoaded', () => {
  const items = Array.from(document.querySelectorAll('.command-palette .item'));
  const noResultsItem = document.createElement('div');
  const itemMap = new Map();

  noResultsItem.className = 'item no-results';
  noResultsItem.innerHTML = "<span class='description'>No results found</span>";
  noResultsItem.style.display = 'none';
  document.querySelector('.command-palette .results').appendChild(noResultsItem);

  items.forEach((item) => itemMap.set(item.innerText.toLowerCase(), item));

  function levenshteinDistance(a, b) {
    if (!a || !b) return Math.max(a.length, b.length);
    const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
    }
    return dp[a.length][b.length];
  }

  function jaroWinkler(s1, s2) {
    if (!s1 || !s2) return 0;
    let m = 0;
    const matchDistance = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
    const s1Matches = new Array(s1.length).fill(false);
    const s2Matches = new Array(s2.length).fill(false);
    for (let i = 0; i < s1.length; i++) {
      const start = Math.max(0, i - matchDistance);
      const end = Math.min(i + matchDistance + 1, s2.length);
      for (let j = start; j < end; j++) {
        if (s2Matches[j]) continue;
        if (s1[i] !== s2[j]) continue;
        s1Matches[i] = true;
        s2Matches[j] = true;
        m++;
        break;
      }
    }
    if (m === 0) return 0;
    let t = 0;
    let k = 0;
    for (let i = 0; i < s1.length; i++) {
      if (!s1Matches[i]) continue;
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) t++;
      k++;
    }
    t /= 2;
    let jaro = (m / s1.length + m / s2.length + (m - t) / m) / 3;
    let p = 0.1;
    let l = 0;
    while (l < 4 && s1[l] === s2[l]) l++;
    return jaro + l * p * (1 - jaro);
  }

  function diceCoefficient(s1, s2) {
    if (!s1 || !s2) return 0;
    if (s1.length < 2 || s2.length < 2) return s1 === s2 ? 1 : 0;
    const bigrams = new Map();
    for (let i = 0; i < s1.length - 1; i++) {
      const bigram = s1.substring(i, i + 2);
      bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1);
    }
    let intersection = 0;
    for (let i = 0; i < s2.length - 1; i++) {
      const bigram = s2.substring(i, i + 2);
      if (bigrams.has(bigram) && bigrams.get(bigram) > 0) {
        intersection++;
        bigrams.set(bigram, bigrams.get(bigram) - 1);
      }
    }
    return (2 * intersection) / (s1.length + s2.length - 2);
  }

  function isSimilar(query, text) {
    if (text.includes(query)) return true;
    const words = text.split(/\s+/);
    return words.some((word) => levenshteinDistance(word, query) <= Math.max(1, Math.floor(word.length * 0.3)) || jaroWinkler(word, query) > 0.85 || diceCoefficient(word, query) > 0.6);
  }

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    let matches = 0;

    itemMap.forEach((item, text) => {
      const isMatch = isSimilar(query, text);
      item.style.display = isMatch ? 'flex' : 'none';
      if (isMatch) matches++;
    });

    noResultsItem.style.display = matches === 0 ? 'flex' : 'none';
  });
});

// Utility

function toggleCodeMode(div = editor) {
  if (codeMode) {
    div.removeEventListener('keydown', keydownHandler);
    codeMode = false;
  } else {
    div.addEventListener('keydown', keydownHandler);
    codeMode = true;
  }
}

function setTitle() {
  getCurrentWindow().setTitle(`Inkless${codeMode ? ' Code' : ''}${dynamicGlow ? ' (Dynamic glow)' : ''} — ${activeFile}${saved ? '' : ' *'}`);
}

// Run at start

setTitle();

getCurrentWindow().listen('tauri://close-requested', async (event) => {
  if (!saved) {
    const shouldExit = await dialog.ask('You have unsaved changes. Do you really want to exit?', { title: 'Unsaved Changes' });
    if (shouldExit) {
      getCurrentWindow().destroy();
    }
  } else {
    getCurrentWindow().destroy();
  }
});

// Handle settings and extensions

function getOSTheme() {
  if (window.matchMedia) {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return isDarkMode ? 'dark' : 'light';
  }
  return 'light';
}

(async () => {
  const data = await getAll();

  if (data.theme) {
    document.documentElement.classList.add(data.theme);
  } else {
    if (getOSTheme() == 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  if (data.glow && data.glow.toLowerCase() == 'yes') {
    document.documentElement.classList.add('glow');
  }

  if (data.dynamic_glow && data.dynamic_glow.toLowerCase() == 'yes') {
    dynamicGlow = true;
  }

  if (data.code_mode && data.code_mode.toLowerCase() == 'yes') {
    toggleCodeMode();
    setTitle();
    document.documentElement.classList.add('mono');
    updateEditor();
  }

  if (data.ext) {
    Object.keys(data.ext).forEach((key) => {
      eval(data.ext[key]);
    });
  }
})();

// Placeholder

const updatePlaceholder = () => {
  const isEmpty = editor.textContent.replaceAll(' ', '').replaceAll('\n', '') == '';
  if (isEmpty) {
    editor.setAttribute('placeholder', placeholder);
  } else {
    editor.removeAttribute('placeholder');
  }
};

editor.addEventListener('blur', updatePlaceholder);

updatePlaceholder();

// Update elements

const updateInfo = () => {
  const text = editor.innerText.trim();
  const words = text.length > 0 ? text.split(/\s+/).filter(Boolean).length : 0;
  const chars = text.length;
  const lines = text.split(/\n/).length;
  updateDisplay('#words', words, 'word');
  updateDisplay('#chars', chars, 'character');
  updateDisplay('#lines', lines, 'line');
  document.querySelector('#read').textContent = ((t) => {
    let h = Math.floor(t / 3600),
      m = Math.floor((t % 3600) / 60),
      s = t % 60;
    return (h ? `${h}h ` : '') + (m ? `${m}m` : '') + (s ? ` ${s}s` : '0s');
  })(Math.ceil(chars / 17));
};

const updateDisplay = (selector, count, label) => {
  const element = document.querySelector(selector);
  if (element) {
    element.textContent = `${count} ${label}${count === 1 ? '' : 's'}`;
  }
};

updateInfo();

function updateEditor() {
  try {
    if (codeMode) {
      const e = editor;
      if (e.textContent.replaceAll(' ', '') == '') {
        return;
      }

      const selection = window.getSelection();
      let cursorOffset = null;
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(e);
        preCaretRange.setEnd(range.startContainer, range.startOffset);
        cursorOffset = preCaretRange.toString().length;
      }

      try {
        delete e.dataset.highlighted;
        e.className = '';
      } catch (_) {}

      hljs.highlightElement(e);

      if (dynamicGlow) {
        e.querySelectorAll('& span').forEach((d) => {
          d.style.setProperty('--glow', window.getComputedStyle(d).color);
        });
      }

      if (cursorOffset !== null) {
        const range = document.createRange();
        const newSelection = window.getSelection();
        let currentOffset = 0;

        function setCaret(node) {
          if (node.nodeType === Node.TEXT_NODE) {
            const nodeLength = node.textContent.length;
            if (currentOffset + nodeLength >= cursorOffset) {
              range.setStart(node, cursorOffset - currentOffset);
              range.collapse(true);
              return true;
            }
            currentOffset += nodeLength;
          } else {
            for (let i = 0; i < node.childNodes.length; i++) {
              if (setCaret(node.childNodes[i])) {
                return true;
              }
            }
          }
          return false;
        }

        setCaret(e);
        newSelection.removeAllRanges();
        newSelection.addRange(range);
      }
    }
  } catch (e) {
    console.error(e);
  }
}

editor.addEventListener('input', () => {
  saved = false;
  setTitle();
  updatePlaceholder();
  clearTimeout(timer);
  clearTimeout(timer2);
  timer = setTimeout(updateInfo, 100);
  timer2 = setTimeout(() => {
    updateEditor();
  }, 2000);
});

// Footer scroll

footer.addEventListener('wheel', (e) => {
  if (e.deltaY !== 0) {
    footer.scrollLeft += e.deltaY;
    e.preventDefault();
  }
});
