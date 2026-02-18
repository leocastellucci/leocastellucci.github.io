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
      setTimeout(() => {
        document.addEventListener('click', outsideClick);
        document.addEventListener('keydown', escClose);
      }, 0);
    }
  });

  /* Stäng menyn när man klickar en länk */
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
})();