const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwwV3M1hHwQSsuoKgPAM0WxRXyA7Qh0e7X5p2kD07pq7tV2fhRw5h-8JKJDrrb9q2vW4w/exec";

document.addEventListener("DOMContentLoaded", () => {
  const gateForm = document.getElementById("gateForm");
  const emailInput = document.getElementById("email");
  const consentCheckbox = document.getElementById("consent");

  // Check Access Immediately
  if (localStorage.getItem("toolbox_access") === "1") {
    const unlocked = document.getElementById("gateUnlocked");
    const locked = document.getElementById("gateLocked");
    if (unlocked && locked) {
      unlocked.classList.remove("hidden");
      locked.classList.add("hidden");
    }
  }

  if (!gateForm) {
    console.error("gateForm not found");
    return;
  }

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
});
