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
      
      // Update toolbox buttons when opening
      updateToolboxMenu();
      ensureToolboxHeroButton();

      setTimeout(() => {
        document.addEventListener('click', outsideClick);
        document.addEventListener('keydown', escClose);
      }, 0);
    }
  });

  /* Stäng menyn när man klickar en länk */
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

  /* TOOLBOX menu item logic (hamburger) */
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
          });
        }
      } else {
        if (toolboxBtn) {
          toolboxBtn.remove();
        }
      }
    } catch (err) { console.error("Menu update error:", err); }
  }

  /* TOOLBOX hero button logic - direct anchor-based insertion */
  function ensureToolboxHeroButton() {
    try {
      const unlocked = localStorage.getItem("toolbox_access") === "1";
      
      // Robust element search
      const allEls = document.querySelectorAll("a,button");
      const servicesEl = Array.from(allEls).find(el => /services/i.test(el.textContent.trim()));
      const portfolioEl = Array.from(allEls).find(el => /portfolio/i.test(el.textContent.trim()));
      const linkedInEl = Array.from(allEls).find(el => /connect on linkedin/i.test(el.textContent.trim()));

      let heroToolboxBtn = document.getElementById('heroToolboxBtn');

      console.log("[toolbox] ensure", { 
        unlocked, 
        servicesFound: !!servicesEl, 
        portfolioFound: !!portfolioEl, 
        linkedInFound: !!linkedInEl, 
        hasBtn: !!heroToolboxBtn 
      });

      if (unlocked) {
        if (!heroToolboxBtn) {
          heroToolboxBtn = document.createElement('a');
          heroToolboxBtn.id = 'heroToolboxBtn';
          heroToolboxBtn.href = 'toolbox.html';
          heroToolboxBtn.textContent = 'TOOLBOX';
          
          // Copy className from linkedInEl (if found) or use fallback
          if (linkedInEl) {
            heroToolboxBtn.className = linkedInEl.className;
          } else {
            heroToolboxBtn.className = 'btn-pill btn-linkedin';
          }

          // Insert after first available anchor
          if (servicesEl) {
            servicesEl.insertAdjacentElement("afterend", heroToolboxBtn);
          } else if (portfolioEl) {
            portfolioEl.insertAdjacentElement("afterend", heroToolboxBtn);
          } else if (linkedInEl) {
            linkedInEl.insertAdjacentElement("afterend", heroToolboxBtn);
          } else {
            document.body.appendChild(heroToolboxBtn);
            console.log("[toolbox] ensure: all anchors missing, appended to body");
          }
        }
      } else {
        if (heroToolboxBtn) {
          heroToolboxBtn.remove();
        }
      }
    } catch (err) { console.error("ensureToolboxHeroButton error:", err); }
  }

  // MutationObserver to handle rerenders
  let debounceTimer;
  const observer = new MutationObserver(() => {
    if (debounceTimer) cancelAnimationFrame(debounceTimer);
    debounceTimer = requestAnimationFrame(() => {
      ensureToolboxHeroButton();
      updateToolboxMenu();
    });
  });

  // Start observer on body
  observer.observe(document.body, { childList: true, subtree: true });

  // Handle storage changes
  window.addEventListener("storage", () => {
    ensureToolboxHeroButton();
    updateToolboxMenu();
  });

  // Initial calls
  document.addEventListener("DOMContentLoaded", () => {
    ensureToolboxHeroButton();
    updateToolboxMenu();
  });

  // Run immediately
  ensureToolboxHeroButton();
  updateToolboxMenu();
})();
