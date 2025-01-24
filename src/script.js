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

// Utility

function makeEditor(div) {
  div.onpaste = (e) => {
    e.preventDefault();
    const clipboardData = e.clipboardData || window.clipboardData;
    const pastedText = clipboardData?.getData('text/plain') || '';
    document.execCommand('inserttext', false, pastedText);
  };

  div.addEventListener('keydown', function (e) {
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
      const pairMap = {
        '"': '"',
        "'": "'",
        '(': ')',
        '{': '}',
        '[': ']',
        '<': '>',
      };
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
      while (start && start.nodeType !== Node.ELEMENT_NODE) {
        start = start.parentNode;
      }
      let end = range.endContainer;
      while (end && end.nodeType !== Node.ELEMENT_NODE) {
        end = end.parentNode;
      }
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
      if (offset === newOffset || offset === 0) {
        newOffset = 0;
      }
      range.setStart(node, newOffset);
      range.setEnd(node, newOffset);
      selection.removeAllRanges();
      selection.addRange(range);
    } else if (e.key === 'b' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      const isBold = document.queryCommandState('bold');
      document.execCommand('bold', false, !isBold);
    } else if (e.key === 'i' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      const isItalic = document.queryCommandState('italic');
      document.execCommand('italic', false, !isItalic);
    } else if (e.key === 'u' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      const isUnderline = document.queryCommandState('underline');
      document.execCommand('underline', false, !isUnderline);
    } else if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      const isStrikethrough = document.queryCommandState('strikethrough');
      document.execCommand('strikethrough', false, !isStrikethrough);
    }
  });
}

function setTitle() {
  getCurrentWindow().setTitle(`Inkless${codeMode ? ' Code' : ''}${dynamicGlow ? ' (Dynamic glow)' : ''} — ${activeFile}${saved ? '' : ' *'}`);
}

// Run at start

setTitle();
makeEditor(document.querySelector('div[contenteditable]'));

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
    codeMode = true;
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
      const e = document.querySelector('div[contenteditable]');
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      const clonedRange = range.cloneRange();
      clonedRange.selectNodeContents(e);
      clonedRange.setEnd(range.endContainer, range.endOffset);
      const cursorPosition = clonedRange.toString().length;

      const createRange = (node, targetPosition) => {
        let range = document.createRange();
        range.selectNode(node);
        range.setStart(node, 0);
        let pos = 0;
        const stack = [node];
        while (stack.length > 0) {
          const current = stack.pop();
          if (current.nodeType === Node.TEXT_NODE) {
            const len = current.textContent.length;
            if (pos + len >= targetPosition) {
              range.setEnd(current, targetPosition - pos);
              return range;
            }
            pos += len;
          } else if (current.childNodes && current.childNodes.length > 0) {
            for (let i = current.childNodes.length - 1; i >= 0; i--) {
              stack.push(current.childNodes[i]);
            }
          }
        }
        range.setEnd(node, node.childNodes.length);
        return range;
      };

      const setPosition = (targetPosition) => {
        const range = createRange(e, targetPosition);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      };

      e.querySelectorAll('div').forEach((d) => {
        if (d.textContent.replaceAll(' ', '') == '') {
          return;
        }
        try {
          delete d.dataset.highlighted;
          d.className = '';
        } catch (_) {}
        hljs.highlightElement(d);
      });

      if (dynamicGlow) {
        e.querySelectorAll('& span').forEach((d) => {
          d.style.setProperty('--glow', window.getComputedStyle(d).color);
        });
      }

      setPosition(cursorPosition);

      console.clear();

      const selection2 = window.getSelection();
      const range2 = selection.getRangeAt(0);
      const cursorPositionElement = range2.endContainer;
      selection2.removeAllRanges();
      const newRange = document.createRange();
      newRange.setStart(cursorPositionElement, range2.endOffset);
      newRange.setEnd(cursorPositionElement, range2.endOffset);
      selection2.addRange(newRange);
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
