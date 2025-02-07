const { dialog, fs, path } = window.__TAURI__;
const { getCurrentWindow } = window.__TAURI__.window;

const info = document.querySelector('.info');
const footer = document.querySelector('footer > div');
const editor = document.querySelector('div[contenteditable]');
const placeholder = editor.getAttribute('placeholder');
let codeMode = false;
let rainbow = false;
let dynamicGlow = false;
let saved = true;
let activeFilePath = null;
let timer, timer2;
let activeFile = 'untitled.txt';
let fontSize = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--font-size'));

const fileName = 'data.inkfmt';
const saveTimers = {};

async function saveData(key, value) {
  const filePath = `./${fileName}`;
  let data = {};

  try {
    const content = await fs.readTextFile(filePath);
    const lines = content.split('\n');
    let currentSection = null;
    let multiLineKey = null;
    let multiLineValue = [];
    data = {};

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      if (multiLineKey) {
        if (trimmed === '---') {
          const parts = multiLineKey.split('.');
          let ref = data;
          for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (i === parts.length - 1) ref[part] = multiLineValue.join('\n');
            else {
              if (!ref[part] || typeof ref[part] !== 'object') ref[part] = {};
              ref = ref[part];
            }
          }
          multiLineKey = null;
          multiLineValue = [];
        } else {
          multiLineValue.push(trimmed);
        }
        continue;
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
          else {
            if (!ref[part] || typeof ref[part] !== 'object') ref[part] = {};
            ref = ref[part];
          }
        }
      }
    }
  } catch (e) {}

  if (saveTimers[key]) clearTimeout(saveTimers[key]);

  saveTimers[key] = setTimeout(async () => {
    const parts = key.split('.');
    let ref = data;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) ref[part] = value.includes('\n') ? value : value.trim();
      else {
        if (!ref[part] || typeof ref[part] !== 'object') ref[part] = {};
        ref = ref[part];
      }
    }

    function serialize(obj, prefix = '') {
      let result = '';
      for (const [key, val] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof val === 'object' && !Array.isArray(val)) result += serialize(val, fullKey);
        else if (typeof val === 'string' && val.includes('\n')) result += `${fullKey} = ---\n${val}\n---\n`;
        else result += `${fullKey} = ${val}\n`;
      }
      return result;
    }

    const formatted = serialize(data);
    await fs.writeTextFile(filePath, formatted);

    delete saveTimers[key];
  }, 500);
}

async function getData(key) {
  const filePath = `./${fileName}`;
  try {
    const content = await fs.readTextFile(filePath);
    const lines = content.split('\n');
    let currentSection = null;
    let multiLineKey = null;
    let multiLineValue = [];
    const data = {};

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      if (multiLineKey) {
        if (trimmed === '---') {
          const parts = multiLineKey.split('.');
          let ref = data;
          for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (i === parts.length - 1) ref[part] = multiLineValue.join('\n');
            else {
              if (!ref[part] || typeof ref[part] !== 'object') ref[part] = {};
              ref = ref[part];
            }
          }
          multiLineKey = null;
          multiLineValue = [];
        } else {
          multiLineValue.push(trimmed);
        }
        continue;
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
          else {
            if (!ref[part] || typeof ref[part] !== 'object') ref[part] = {};
            ref = ref[part];
          }
        }
      }
    }

    const parts = key.split('.');
    let ref = data;

    for (const part of parts) {
      if (ref[part] === undefined) return null;
      ref = ref[part];
    }

    return ref.startsWith('---') && ref.endsWith('---') ? ref.slice(3, -3).trim() : ref;
  } catch (e) {
    return null;
  }
}

async function getAll() {
  const filePath = `./${fileName}`;
  try {
    const content = await fs.readTextFile(filePath);
    const lines = content.split('\n');
    let currentSection = null;
    let multiLineKey = null;
    let multiLineValue = [];
    const data = {};

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      if (multiLineKey) {
        if (trimmed === '---') {
          const parts = multiLineKey.split('.');
          let ref = data;
          for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (i === parts.length - 1) ref[part] = multiLineValue.join('\n');
            else {
              if (!ref[part] || typeof ref[part] !== 'object') ref[part] = {};
              ref = ref[part];
            }
          }
          multiLineKey = null;
          multiLineValue = [];
        } else {
          multiLineValue.push(trimmed);
        }
        continue;
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
          else {
            if (!ref[part] || typeof ref[part] !== 'object') ref[part] = {};
            ref = ref[part];
          }
        }
      }
    }

    return data;
  } catch (e) {
    return {};
  }
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
      navigator.clipboard.writeText(lineText).then(() => { start.textContent = ''; });
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

  if (data.glow && data.glow == 'true') {
    document.documentElement.classList.add('glow');
  }

  if (data.dynamic_glow && data.dynamic_glow == 'true') {
    dynamicGlow = true;
  }

  if (data.code_mode && data.code_mode == 'true') {
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
