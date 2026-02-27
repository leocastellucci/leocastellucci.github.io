const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwwV3M1hHwQSsuoKgPAM0WxRXyA7Qh0e7X5p2kD07pq7tV2fhRw5h-8JKJDrrb9q2vW4w/exec";

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("toolboxGateRoot");
  if (!root) return;

  const isUnlocked = localStorage.getItem("toolbox_access") === "1";

  if (isUnlocked) {
    // STATE A: Unlocked
    root.innerHTML = `
      <h2 class="hero">Toolbox Already Unlocked!</h2>
      <p class="lead">Your access is active. Click below to enter the premium marketing resource center.</p>
      <div class="audit-container">
        <a href="toolbox.html" class="btn-pill btn-linkedin" id="continueToToolbox" style="min-width: auto; padding: 26px 48px; display: inline-block;">CONTINUE TO TOOLBOX</a>
      </div>
    `;
    
    // Attach loader logic to the new button
    const btn = document.getElementById("continueToToolbox");
    if (btn) {
      btn.addEventListener('click', (e) => {
        if (e.metaKey || e.ctrlKey) return;
        const loader = document.getElementById("pageLoader");
        if (loader) {
          loader.style.display = "block";
          loader.classList.remove("finishing");
          loader.classList.add("active");
        }
      });
    }
  } else {
    // STATE B: Locked
    root.innerHTML = `
      <h2 class="hero">Unlock Our Exclusive Toolbox</h2>
      <p class="lead">Submit your email below to unlock the SETTEBELLO Marketing Toolbox.</p>
      
      <div class="audit-container">
        <form id="gateForm" class="audit-form" style="display: flex; flex-direction: column; align-items: flex-start;">
          <div style="display: flex; gap: 16px; width: 100%; flex-wrap: wrap;">
            <input type="email" id="email" placeholder="you@example.com" required class="audit-input" aria-label="Email Address">
            <button type="submit" class="btn-pill btn-linkedin" id="gateSubmit">UNLOCK TOOLBOX</button>
          </div>
          <label style="display: flex; align-items: center; gap: 12px; margin-top: 20px; color: var(--muted); font-size: 14px; cursor: pointer;">
            <input type="checkbox" id="consent" required style="width: 18px; height: 18px; cursor: pointer;">
            I consent to receive marketing updates and agree to the terms.
          </label>
          <div id="gateStatus" class="audit-status hidden" style="margin-top: 16px;"></div>
        </form>
      </div>
    `;

    // Attach Submission Logic
    const gateForm = document.getElementById("gateForm");
    const emailInput = document.getElementById("email");
    const consentCheckbox = document.getElementById("consent");

    if (gateForm) {
      gateForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = emailInput.value;
        const consent = consentCheckbox.checked;
        const gateSubmit = document.getElementById("gateSubmit");
        const gateStatus = document.getElementById("gateStatus");

        // Start Loading UI
        if (gateSubmit) {
          gateSubmit.disabled = true;
          gateSubmit.classList.add("is-loading");
          gateSubmit.textContent = "UNLOCKING...";
        }
        if (gateStatus) {
          gateStatus.textContent = "Submitting...";
          gateStatus.classList.remove("hidden");
        }

        try {
          const response = await fetch(SCRIPT_URL, {
            method: "POST",
            headers: {
              "Content-Type": "text/plain;charset=utf-8",
            },
            body: JSON.stringify({
              email: email,
              consent: consent,
              page: window.location.pathname
            }),
          });

          const data = await response.json();

          if (data.ok !== true) {
            throw new Error(data.message || "Submission failed");
          }

          // Forever Access Logic
          localStorage.setItem("toolbox_access", "1");
          localStorage.setItem("toolbox_email", email);
          
          // Page Loader UI before redirect
          const loader = document.getElementById("pageLoader");
          if (loader) {
            loader.style.display = "block";
            loader.classList.remove("finishing");
            loader.classList.add("active");
          }
          
          window.location.href = "toolbox.html";
        } catch (error) {
          console.error("Submission error:", error);
          if (gateStatus) {
            gateStatus.textContent = "Error: " + (error.message || "Failed to submit. Please try again.");
            gateStatus.style.color = "#ff4d4d";
          }
          // Restore Button State
          if (gateSubmit) {
            gateSubmit.disabled = false;
            gateSubmit.classList.remove("is-loading");
            gateSubmit.textContent = "UNLOCK TOOLBOX";
          }
        }
      });
    }
  }
});
