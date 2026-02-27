(function() {
  const toggle = document.getElementById('menuToggle');
  const menu = document.getElementById('siteMenu');

  if (!toggle || !menu) return;

  function closeMenu() {
    toggle.setAttribute('aria-expanded', 'false');
    menu.classList.remove('open');
    /* Återställ scroll när menyn stängs */
    document.body.style.overflow = '';
    document.removeEventListener('click', outsideClick);
    document.removeEventListener('keydown', escClose);
  }

  function outsideClick(e) {
    if (!menu.contains(e.target) && e.target !== toggle) closeMenu();
  }

  function escClose(e) {
    if (e.key === 'Escape') closeMenu();
  }

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    if (open) {
      closeMenu();
    } else {
      toggle.setAttribute('aria-expanded', 'true');
      menu.classList.add('open');
      /* Lås bakgrunds-scroll på mobil när overlay-meny är öppen */
      document.body.style.overflow = 'hidden';
      
      // Update toolbox button when opening
      updateToolboxMenu();

      setTimeout(() => {
        document.addEventListener('click', outsideClick);
        document.addEventListener('keydown', escClose);
      }, 0);
    }
  });

  /* Stäng menyn när man klickar en länk */
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

  /* TOOLBOX menu item logic */
  function updateToolboxMenu() {
    try {
      const isUnlocked = localStorage.getItem("toolbox_access") === "1";
      let toolboxBtn = document.getElementById('menuToolboxBtn');

      if (isUnlocked) {
        if (!toolboxBtn && menu) {
          toolboxBtn = document.createElement('a');
          toolboxBtn.id = 'menuToolboxBtn';
          toolboxBtn.href = 'toolbox.html';
          toolboxBtn.textContent = 'Toolbox';
          toolboxBtn.className = 'primary'; // Neon green style
          toolboxBtn.style.marginTop = '10px';
          menu.appendChild(toolboxBtn);
          
          toolboxBtn.addEventListener('click', (e) => {
            closeMenu();
            // Optional: trigger page loader here if you want consistency
          });
        }
      } else {
        if (toolboxBtn) {
          toolboxBtn.remove();
        }
      }
    } catch (err) { console.error("Menu update error:", err); }
  }

  // Run on load
  updateToolboxMenu();
})();