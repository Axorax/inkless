const shortcuts = {
  'ctrl+S': async () => {
    const text = editor.innerText.trim();
    if (text) {
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
    const htmlClass = document.documentElement.classList;
    const newTheme = htmlClass.contains('dark') ? 'mica' : htmlClass.contains('mica') ? 'dark' : 'mica';
    htmlClass.remove('dark', 'mica');
    htmlClass.add(newTheme);
    saveData('theme', newTheme);
  },

  'ctrl+N': async () => {
    const htmlClass = document.documentElement.classList;
    const glowEnabled = htmlClass.contains('glow');
    htmlClass.toggle('glow', !glowEnabled);
    saveData('glow', glowEnabled ? 'false' : 'true');
  },

  'ctrl+T': async () => {
    const htmlClass = document.documentElement.classList;
    const newTheme = htmlClass.contains('mica') ? 'dark' : htmlClass.contains('dark') ? 'light' : 'mica';
    htmlClass.remove('mica', 'dark');
    htmlClass.add(newTheme);
    saveData('theme', newTheme);
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
    saveData('code_mode', codeMode.toString());
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
    saveData('dynamic_glow', dynamicGlow.toString());
  },

  'ESCAPE': () => {
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
