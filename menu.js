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
      ensureToolboxButton();

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

  /* TOOLBOX hero button logic */
  function ensureToolboxButton() {
    try {
      const unlocked = localStorage.getItem("toolbox_access") === "1";
      
      // Heuristic to find the right stack (cta-stack or container with SERVICES)
      let stack = document.querySelector('.cta-stack');
      if (!stack) {
        // Fallback: Find container that has a link with text "SERVICES"
        const allLinks = document.querySelectorAll('a');
        const servicesLink = Array.from(allLinks).find(a => a.textContent.trim().toUpperCase() === "SERVICES");
        if (servicesLink) stack = servicesLink.parentElement;
      }

      const linkedInBtn = stack ? stack.querySelector('.btn-linkedin') : null;
      let heroToolboxBtn = document.getElementById('heroToolboxBtn');

      console.log("[toolbox]", { unlocked, hasBtn: !!heroToolboxBtn, stackFound: !!stack, linkedInFound: !!linkedInBtn });

      if (unlocked) {
        if (!heroToolboxBtn && stack) {
          const servicesBtn = Array.from(stack.querySelectorAll('a')).find(
            a => a.textContent.trim().toUpperCase() === "SERVICES"
          );

          heroToolboxBtn = document.createElement('a');
          heroToolboxBtn.id = 'heroToolboxBtn';
          heroToolboxBtn.href = 'toolbox.html';
          heroToolboxBtn.textContent = 'TOOLBOX';
          
          // Copy className from LinkedIn button for perfect styling match
          if (linkedInBtn) {
            heroToolboxBtn.className = linkedInBtn.className;
          } else {
            heroToolboxBtn.className = 'btn-pill btn-linkedin';
          }

          if (servicesBtn) {
            servicesBtn.parentNode.insertBefore(heroToolboxBtn, servicesBtn.nextSibling);
          } else {
            stack.appendChild(heroToolboxBtn);
          }
        }
      } else {
        if (heroToolboxBtn) {
          heroToolboxBtn.remove();
        }
      }
    } catch (err) { console.error("ensureToolboxButton error:", err); }
  }

  // MutationObserver to handle rerenders
  let debounceTimer;
  const observer = new MutationObserver(() => {
    if (debounceTimer) cancelAnimationFrame(debounceTimer);
    debounceTimer = requestAnimationFrame(() => {
      ensureToolboxButton();
      updateToolboxMenu();
    });
  });

  // Start observer on body
  observer.observe(document.body, { childList: true, subtree: true });

  // Handle storage changes (e.g. from another tab or late set)
  window.addEventListener("storage", () => {
    ensureToolboxButton();
    updateToolboxMenu();
  });

  // Initial calls
  document.addEventListener("DOMContentLoaded", () => {
    ensureToolboxButton();
    updateToolboxMenu();
  });

  // Run immediately in case DOM is already ready
  ensureToolboxButton();
  updateToolboxMenu();
})();
