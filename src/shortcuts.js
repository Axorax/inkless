const shortcuts = {
  'ctrl+S': async () => {
    const text = editor.innerText.trim();
    if (saved == false || text) {
      if (activeFilePath) {
        await fs.writeTextFile(activeFilePath, text);
      } else {
        const filePath = await dialog.save({
          defaultPath: 'untitled.txt',
          filters: [{ name: 'Text Files', extensions: ['txt'] }],
        });
        if (filePath) {
          activeFilePath = filePath;
          activeFile = await path.basename(filePath);
          await fs.writeTextFile(filePath, text);
        }
      }
      saved = true;
      setTitle();
    }
  },

  'ctrl+shift+S': () => {
    event.preventDefault();
    const synth = window.speechSynthesis;
    if (synth.speaking) {
      synth.cancel();
      return;
    }
    const selectedText = window.getSelection().toString().trim();
    const contentEditableText = editor?.innerText.trim();
    const text = selectedText || contentEditableText;
    if (text) {
      const utterance = new SpeechSynthesisUtterance(text);
      synth.speak(utterance);
    }
  },

  'ctrl+M': async () => {
    const e = document.documentElement.classList;
    const theme = e.contains('dark') ? 'mica' : e.contains('mica') ? 'dark' : 'mica';
    e.remove('dark', 'mica');
    e.add(theme);
    saveData('theme', theme);
  },

  'ctrl+N': async () => {
    const e = document.documentElement.classList;
    const glowEnabled = e.contains('glow');
    e.toggle('glow', !glowEnabled);
    saveData('glow', glowEnabled ? 'no' : 'yes');
  },

  'ctrl+T': async () => {
    const e = document.documentElement.classList;
    let theme;
    if (e.contains('dark')) {
      theme = 'light';
    } else if (e.contains('light')) {
      theme = 'mica';
    } else {
      theme = 'dark';
    }
    e.remove('mica', 'dark', 'light');
    e.add(theme);
    saveData('theme', theme);
  },

  'ctrl+W': () => {
    const footer = document.querySelector('footer');
    if (footer) {
      footer.style.display = footer.style.display === 'none' ? '' : 'none';
    }
  },

  'ctrl+P': () => {
    const e = document.querySelector('.command-palette');

    if (e.style.display === 'none') {
      e.style.display = 'block';
      searchInput.focus();
    } else {
      e.style.display = 'none';
    }
  },

  'ctrl+G': () => {
    const existingGrid = document.querySelector('.grid-overlay');
    if (existingGrid) {
      existingGrid.remove();
    } else {
      const gridOverlay = document.createElement('div');
      gridOverlay.className = 'grid-overlay';
      document.body.appendChild(gridOverlay);
    }
  },

  'ctrl+O': async () => {
    const filePath = await dialog.open({
      filters: [{ name: 'Text Files', extensions: ['*'] }],
    });
    if (filePath) {
      activeFilePath = filePath;
      activeFile = await path.basename(filePath);
      saved = true;
      const fileContent = await fs.readTextFile(filePath);
      editor.textContent = fileContent;
      setTitle();
      editor.removeAttribute('placeholder');
      updateInfo();
    }
  },

  'ctrl+.': () => {
    const selectedText = window.getSelection().toString().trim().replace(/\s+/g, '').toLowerCase();
    if (!selectedText) return;

    const actions = {
      'i.date': () => new Date().toLocaleString(),
      'i.time': () => new Date().toLocaleTimeString(),
      'i.year': () => new Date().getFullYear().toString(),
      'i.day': () => new Date().toLocaleDateString(undefined, { weekday: 'long' }),
      'i.month': () => new Date().toLocaleDateString(undefined, { month: 'long' }),
      'i.random': () => Math.floor(Math.random() * 100).toString(),
      'i.flip': () => (Math.random() < 0.5 ? 'Heads' : 'Tails'),
      'i.timestamp': () => Math.floor(Date.now() / 1000).toString(),
      'i.iso': () => new Date().toISOString(),
      'i.pi': () => Math.PI.toString(),
      'i.e': () => Math.E.toString(),
      'i.password': () => {
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_-+=<>?';
        let password = '';
        for (let i = 0; i < 12; i++) {
          password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return password;
      },
      'i.hex': () => {
        return '#' + Math.floor(Math.random() * 16777215).toString(16);
      },
      'i.magic8': () => {
        const responses = ['Yes', 'No', 'Ask again later', 'Definitely', 'Not a chance', 'Maybe', 'Very likely'];
        return responses[Math.floor(Math.random() * responses.length)];
      },
      'i.uuid': () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
          var r = (Math.random() * 16) | 0,
            v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      },
      'i.systemInfo': () => {
        const userAgent = navigator.userAgent;
        const platform = navigator.platform;
        return `User Agent: ${userAgent}\nPlatform: ${platform}`;
      },
      'i.memoryUsage': () => {
        if (typeof performance !== 'undefined' && performance.memory) {
          const memory = performance.memory;
          return `Used JS Memory: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)} MB / Total JS Memory: ${Math.round(memory.totalJSHeapSize / 1024 / 1024)} MB`;
        } else {
          return 'Memory usage information is unavailable.';
        }
      },
    };

    if (actions[selectedText]) {
      document.execCommand('insertText', false, actions[selectedText]());
      return;
    }

    if (/^[\d+\-*/().]+$/.test(selectedText)) {
      try {
        const result = Function(`"use strict"; return (${selectedText})`)();
        if (!isNaN(result)) {
          document.execCommand('insertText', false, result.toString());
        }
      } catch (_) {
        return;
      }
    }
  },

  'ctrl+E': () => {
    const spellcheck = editor.getAttribute('spellcheck') === 'true';
    editor.setAttribute('spellcheck', !spellcheck);
  },

  'ctrl+shift+P': () => {
    window.print();
  },

  'ctrl+shift+C': () => {
    toggleCodeMode();
    document.documentElement.classList.toggle('mono', codeMode);
    setTitle();
    updateEditor();
    saveData('code_mode', codeMode ? 'yes' : 'no');
  },

  'ctrl+R': async () => {
    if (!saved) {
      const shouldExit = await dialog.ask('You have unsaved changes. Do you really want to reload?', { title: 'Unsaved Changes' });
      if (shouldExit) {
        window.location.reload();
      }
    } else {
      window.location.reload();
    }
  },

  'ctrl+shift+R': () => {
    rainbow = !rainbow;
    document.documentElement.classList.toggle('rainbow');
  },

  'ctrl+shift+N': () => {
    dynamicGlow = !dynamicGlow;
    document.documentElement.classList.toggle('glow');
    setTitle();
    updateEditor();
    saveData('dynamic_glow', dynamicGlow ? 'yes' : 'no');
  },

  ESCAPE: () => {
    document.querySelector('.command-palette').style.display = 'none';
  },
};

document.addEventListener('keydown', (event) => {
  const isCmdOrCtrl = event.ctrlKey || event.metaKey;
  const isShift = event.shiftKey;
  const key = event.key.toUpperCase();
  const shortcutKey = `${isCmdOrCtrl ? 'ctrl+' : ''}${isShift ? 'shift+' : ''}${key}`;

  if (shortcuts[shortcutKey]) {
    event.preventDefault();
    shortcuts[shortcutKey]();
  }
});

document.addEventListener('wheel', (event) => {
  if (event.ctrlKey || event.metaKey) {
    if (event.deltaY < 0) {
      fontSize += 5;
    } else if (event.deltaY > 0 && fontSize > 15) {
      fontSize -= 5;
    }
    document.documentElement.style.setProperty('--font-size', `${fontSize}px`);
  }
});
