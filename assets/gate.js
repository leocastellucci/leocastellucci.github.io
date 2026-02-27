const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwwV3M1hHwQSsuoKgPAM0WxRXyA7Qh0e7X5p2kD07pq7tV2fhRw5h-8JKJDrrb9q2vW4w/exec";

document.addEventListener("DOMContentLoaded", () => {
  const gateForm = document.getElementById("gateForm");
  const emailInput = document.getElementById("email");
  const consentCheckbox = document.getElementById("consent");

  if (!gateForm) {
    console.error("gateForm not found");
    return;
  }

  gateForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value;
    const consent = consentCheckbox.checked;

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
        alert("Submission failed, please try again.");
        return;
      }

      localStorage.setItem("toolbox_access", "1");
      localStorage.setItem("toolbox_email", email);
      window.location.href = "toolbox.html";
    } catch (error) {
      console.error("Submission error:", error);
      alert("Submission failed, please try again.");
    }
  });
});
