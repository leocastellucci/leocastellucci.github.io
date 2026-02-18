(() => {
  // === CONFIG ===
  const PROXY_URL = "https://seo-audit-proxy.seo-audit.workers.dev";

  // === ELEMENTS ===
  const form = document.getElementById("auditForm");
  const input = document.getElementById("auditUrl");
  const results = document.getElementById("auditResults");
  const status = document.getElementById("auditStatus");
  const submitBtn = document.getElementById("auditSubmit");

  const headingList = document.getElementById("headingList");
  const metaList = document.getElementById("metaList");
  const keywordCloud = document.getElementById("keywordCloud");
  const keywordWarning = document.getElementById("keywordWarning");
  const linksInfo = document.getElementById("linksInfo");
  const imageInfo = document.getElementById("imageInfo");
  const scoreValue = document.getElementById("scoreValue");
  const scoreFill = document.getElementById("scoreFill");
  const quickWinsList = document.getElementById("quickWinsList");

  const stopWords = new Set([
    "the","a","an","and","or","but","in","on","at","to","for","with","is","are","was","were",
    "it","this","that","of","from","i","you","he","she","they","we","my","your","his","her","their","our",
    "be","been","being","have","has","had","do","does","did","can","could","shall","should","will","would","may","might","must",
    // svenska småord (lite bonus)
    "och","att","det","den","de","en","ett","som","för","på","i","av","till","med","är","var","har","hade","kan","ska","inte"
  ]);

  if (!form || !input || !results || !status || !submitBtn) {
    console.error("Audit elements missing: check #auditForm #auditUrl #auditResults #auditStatus #auditSubmit");
    return;
  }

  // === HELPERS ===
  const showStatus = (msg) => {
    status.textContent = msg;
    status.classList.remove("hidden");
  };

  const hideStatus = () => status.classList.add("hidden");

  const showResults = () => {
    results.style.display = "block";
    results.classList.remove("hidden");
    results.classList.add("visible");
  };

  const hideResults = () => {
    results.classList.add("hidden");
    results.classList.remove("visible");
    results.style.display = "none";
  };

  const normalizeUrl = (raw) => {
    let val = (raw || "").trim();
    if (!val) return "";
    if (!/^https?:\/\//i.test(val)) val = "https://" + val;
    // Validera
    return new URL(val).href;
  };

  async function fetchHtml(targetUrl) {
    // 1) Försök direkt (kommer oftast faila pga CORS, men kan funka på vissa domäner)
    try {
      const directResp = await fetch(targetUrl, { mode: "cors" });
      if (directResp.ok) {
        return { html: await directResp.text(), usedProxy: false };
      }
    } catch (_) {
      // ignore
    }

    // 2) Proxy fallback (det här är huvudvägen)
    const proxyFetchUrl = `${PROXY_URL}?url=${encodeURIComponent(targetUrl)}`;
    const proxyResp = await fetch(proxyFetchUrl, { mode: "cors" });

    if (!proxyResp.ok) {
      let msg = `Proxy fetch failed (${proxyResp.status})`;
      try {
        const data = await proxyResp.json();
        if (data?.error) msg = data.error;
      } catch (_) {}
      throw new Error(msg);
    }

    return { html: await proxyResp.text(), usedProxy: true };
  }

  function performAudit(doc, pageUrl, usedProxy) {
    const quickWins = [];
    let score = 0;

    // --- 1) Headings / Structure ---
    const h1s = doc.querySelectorAll("h1");
    const h2s = doc.querySelectorAll("h2");
    const h3s = doc.querySelectorAll("h3");

    if (headingList) {
      headingList.innerHTML = "";

      let structureScore = 0;
      if (h1s.length === 1) structureScore += 25;
      else if (h1s.length > 1) {
        structureScore += 5;
        quickWins.push("Multiple H1s detected — consolidate to a single primary heading.");
      } else {
        quickWins.push("Missing H1 tag — add one for clear topic definition.");
      }

      // hierarchy jumps
      const headings = Array.from(doc.querySelectorAll("h1,h2,h3,h4,h5,h6"));
      let hierarchyJump = false;
      for (let i = 0; i < headings.length - 1; i++) {
        const curr = Number(headings[i].tagName.substring(1));
        const next = Number(headings[i + 1].tagName.substring(1));
        if (next > curr + 1) hierarchyJump = true;
      }
      if (hierarchyJump) {
        structureScore = Math.max(0, structureScore - 5);
        quickWins.push("Fix heading levels (avoid jumping e.g. H1 → H3).");
        headingList.innerHTML += `<li style="color:#ff4d4d">Hierarchy jumps detected</li>`;
      }

      if (h2s.length > 0) structureScore += 10;
      score += Math.max(0, structureScore);

      headingList.innerHTML += `<li>H1: ${h1s.length}, H2: ${h2s.length}, H3: ${h3s.length}</li>`;
    }

    // --- 2) Metadata ---
    const title = doc.title || "";
    const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute("content") || "";

    if (metaList) {
      metaList.innerHTML = "";

      if (title.length >= 50 && title.length <= 60) score += 15;
      else if (title.length > 0) score += 5;

      metaList.innerHTML += `<li>Title: ${title.length} ch ${title.length < 50 || title.length > 60 ? "(Non-ideal)" : "(Perfect)"}</li>`;
      if (title.length > 0 && title.length < 30) quickWins.push("Lengthen title tag to ~50–60 characters.");

      if (metaDesc.length >= 140 && metaDesc.length <= 160) score += 15;
      else if (metaDesc.length > 0) score += 5;

      metaList.innerHTML += `<li>Meta: ${metaDesc.length} ch ${metaDesc.length < 140 || metaDesc.length > 160 ? "(Non-ideal)" : "(Perfect)"}</li>`;
      if (!metaDesc) quickWins.push("Add a meta description (~140–160 chars).");

      metaList.innerHTML += `<li>Mode: ${usedProxy ? "Proxy" : "Direct"}</li>`;
    }

    // --- 3) Images / Alt ---
    const imgs = doc.querySelectorAll("img");
    const missingAlt = Array.from(imgs).filter((img) => !img.getAttribute("alt")?.trim()).length;
    const missingAltPct = imgs.length ? (missingAlt / imgs.length) * 100 : 0;

    if (imageInfo) {
      imageInfo.style.color = "";
      if (imgs.length === 0) {
        imageInfo.textContent = "No images detected.";
      } else {
        if (missingAltPct === 0) score += 15;
        else if (missingAltPct < 30) score += 5;

        imageInfo.textContent = `${imgs.length} images. ${missingAlt} missing alt text (${Math.round(missingAltPct)}%).`;

        if (missingAltPct > 30) {
          imageInfo.style.color = "#ff4d4d";
          quickWins.push("Critical: Fix missing image alt tags (over 30% missing).");
        }
      }
    }

    // --- 4) Links / Performance ---
    let baseUrl;
    try {
      baseUrl = new URL(pageUrl);
    } catch (_) {
      baseUrl = null;
    }

    const anchors = doc.querySelectorAll("a[href]");
    let internal = 0;
    let external = 0;

    anchors.forEach((a) => {
      const href = (a.getAttribute("href") || "").trim();
      if (!href) return;
      if (href.startsWith("#") || /^(mailto|tel|javascript):/i.test(href)) return;

      if (!baseUrl) return;
      try {
        const linkUrl = new URL(href, baseUrl);
        if (linkUrl.origin === baseUrl.origin) internal++;
        else external++;
      } catch (_) {}
    });

    if (linksInfo) {
      let linkScore = 0;
      if (internal > 0) linkScore += 10;
      if (internal + external > 5) linkScore += 5;
      score += linkScore;

      const scripts = doc.querySelectorAll("script").length;
      const domSize = doc.querySelectorAll("*").length;

      linksInfo.innerHTML = `${internal} internal, ${external} external links.<br><small style="opacity:0.6">${scripts} scripts, ${domSize} DOM elements.</small>`;

      if (domSize > 1500) quickWins.push("Reduce DOM complexity to improve performance.");
      if (internal === 0) quickWins.push("No internal links detected — add links to other pages on your site.");
    }

    // --- 5) Keywords / Density (visible-ish text) ---
    let contentContainer = doc.body ? doc.body.cloneNode(true) : null;
    if (contentContainer) {
      ["script", "style", "nav", "footer", "header", "noscript"].forEach((tag) => {
        contentContainer.querySelectorAll(tag).forEach((el) => el.remove());
      });
    }

    const visibleText = contentContainer ? (contentContainer.innerText || "") : "";
    const words = visibleText.toLowerCase().match(/\b[\p{L}\p{N}_]+\b/gu) || [];
    const wordCount = words.length;

    if (keywordCloud) keywordCloud.innerHTML = "";
    if (keywordWarning) keywordWarning.textContent = "";

    const freq = {};
    for (const w of words) {
      if (w.length <= 3) continue;
      if (stopWords.has(w)) continue;
      freq[w] = (freq[w] || 0) + 1;
    }

    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8);

    if (keywordCloud) {
      if (!sorted.length) {
        keywordCloud.innerHTML = `<span class="kw-tag">N/A</span>`;
      } else {
        for (const [word, count] of sorted) {
          const density = wordCount ? ((count / wordCount) * 100).toFixed(1) : "0.0";
          const span = document.createElement("span");
          span.className = "kw-tag";
          span.textContent = `${word} (${density}%)`;
          keywordCloud.appendChild(span);

          if (Number(density) > 4 && keywordWarning) {
            keywordWarning.textContent = `Warning: "${word}" density is high (${density}%).`;
          }
        }
      }
    }

    if (wordCount < 300) quickWins.push("Add more high-quality text content (aim for 300+ words).");

    // --- 6) Accessibility ---
    if (!doc.documentElement?.getAttribute("lang")) {
      quickWins.unshift('Add a lang attribute to the <html> tag.');
    }

    // --- 7) Final score ---
    score = Math.max(0, Math.min(100, score));
    if (scoreValue) scoreValue.textContent = `${score}${usedProxy ? " (Proxy)" : ""}`;
    if (scoreFill) scoreFill.style.width = `${score}%`;

    // --- 8) Quick wins UI ---
    if (quickWinsList) {
      quickWinsList.innerHTML = "";
      const uniqueWins = Array.from(new Set(quickWins)).slice(0, 3);
      if (!uniqueWins.length) uniqueWins.push("Structure is excellent. Focus on content and backlinks.");

      uniqueWins.forEach((win) => {
        const div = document.createElement("div");
        div.className = "win-item";
        div.textContent = win;
        quickWinsList.appendChild(div);
      });
    }
  }

  async function runAudit() {
    let url;
    try {
      url = normalizeUrl(input.value);
    } catch (_) {
      showStatus("Invalid URL. Please check the format.");
      return;
    }
    if (!url) {
      showStatus("Please enter a URL.");
      return;
    }

    hideResults();
    showStatus("Connecting to website...");
    submitBtn.disabled = true;

    try {
      const { html, usedProxy } = await fetchHtml(url);

      // parse
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      hideStatus();
      showResults();
      performAudit(doc, url, usedProxy);
    } catch (err) {
      console.error("Audit failed:", err);
      showStatus(`Error: ${err.message || "Could not retrieve HTML."}`);
      // Visa resultaten men med “tomma”/N/A istället för att se dött ut:
      hideStatus();
      showResults();

      // Minimal “fallback” rendering:
      if (headingList) headingList.innerHTML = "<li>Unavailable</li>";
      if (metaList) metaList.innerHTML = "<li>Analysis failed</li>";
      if (keywordCloud) keywordCloud.innerHTML = `<span class="kw-tag">N/A</span>`;
      if (keywordWarning) keywordWarning.textContent = "";
      if (linksInfo) linksInfo.textContent = "Unavailable";
      if (imageInfo) imageInfo.textContent = "Unavailable";
      if (scoreValue) scoreValue.textContent = "0 (Error)";
      if (scoreFill) scoreFill.style.width = "0%";
      if (quickWinsList) quickWinsList.innerHTML = `<div class="win-item">Check the URL or try a different site.</div>`;
    } finally {
      submitBtn.disabled = false;
    }
  }

  // === EVENTS ===
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    runAudit();
  });

  // Om knappen är type="button" funkar detta också; om type="submit" är det OK ändå.
  submitBtn.addEventListener("click", (e) => {
    e.preventDefault();
    runAudit();
  });
})();
