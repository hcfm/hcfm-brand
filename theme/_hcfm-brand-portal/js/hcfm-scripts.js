/* HCFM Brand Portal, Theme: _hcfm-brand-portal
 * Generated for HubSpot Theme system. URLs are absolute to HubSpot Files.
 */

/* HCFM Brand Identity · scripts.js · v4
   - Hash routing with ministry sub-pages (#ministry/CODE)
   - Color cube click-to-copy
   - Image lightbox for photography
   - Downloads dual-gate: ministry password + admin password (Source Files)
   - Ministry detail rendered from a manifest of actual file paths
   - Plain YouTube embeds (no overlays)
   - Brand helper chat with KB lookup
   - FAQ search */

(function () {
  'use strict';

  /* ---------- Toast ---------- */
  const toast = document.getElementById('toast');
  let toastTimer = null;
  function showToast(text) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
  }

  /* ---------- Ministry data ---------- */
  const ministries = (function () {
    // Source of truth: HubDB table hcfm_ministries (id 282663491)
    // Server-rendered into hidden <template> tags inside #hcfm-ministries-host
    var host = document.getElementById('hcfm-ministries-host');
    if (!host) return [];
    var templates = host.querySelectorAll('template[data-code]');
    var rows = [];
    for (var i = 0; i < templates.length; i++) {
      var t = templates[i];
      rows.push({
        code: t.getAttribute('data-code') || '',
        name: t.getAttribute('data-name') || '',
        region: t.getAttribute('data-region') || ''
      });
    }
    return rows;
  })();

  // Manifest of actual file paths per ministry, loaded from JSON
  let ministryManifest = {};

  // HCFM Foundation uses the parent HCFM logo as-is (no "FOUNDATION" added
  // to the wordmark). The entity sits AT the parent ministry; its visual
  // identity is the parent identity. We override its preview paths to point
  // at the parent HCFM previews instead of the ministry-folder previews.
  const FOUNDATION_CODE = '02_HCFM_Foundation';
  const FOUNDATION_AS_PARENT = [
    {
      folder: 'HCFM_Logotype1',
      basePath: 'assets/previews/parent',
      files: [
        'hcfm_logo1_pos_2728c.png',
        'hcfm_logo1_pos_871c_2728c.png',
        'hcfm_logo1_pos_black.png',
        'hcfm_logo1_rev_1245c_white.png',
        'hcfm_logo1_rev_white.png'
      ]
    },
    {
      folder: 'HCFM_Logotype2',
      basePath: 'assets/previews/parent',
      files: [
        'hcfm_logo2_pos_2728c.png',
        'hcfm_logo2_pos_871c_2728c.png',
        'hcfm_logo2_pos_black.png',
        'hcfm_logo2_rev_1245c_white.png',
        'hcfm_logo2_rev_white.png'
      ]
    }
  ];

  // Pick the canonical HCFM-Blue mark preview for a ministry, falling back
  // to the parent symbol if the manifest hasn't loaded yet or the ministry
  // doesn't have a Blue variant in its preview set.
  // Logotype 2 (stacked) is preferred for grid thumbnails because mark-on-top
  // + wordmark-below fits naturally in a square preview slot.
  function ministryMarkUrl(code) {
    // HCFM Foundation override, use parent HCFM Logotype 2 Blue
    if (code === FOUNDATION_CODE) {
      return 'https://275132.fs1.hubspotusercontent-na1.net/hubfs/275132/_hcfm-brand/assets/previews/parent/HCFM_Logotype2/hcfm_logo2_pos_2728c.png';
    }
    const groups = ministryManifest[code];
    if (groups && groups.length) {
      // Prefer Logotype2 (stacked, fits square previews), then Logotype1, then anything Blue
      const ordered = [...groups].sort((a, b) => {
        const score = g => g.folder.toLowerCase().includes('logotype2') ? 0 : g.folder.toLowerCase().includes('logotype1') ? 1 : 2;
        return score(a) - score(b);
      });
      for (const g of ordered) {
        const blueFile = g.files.find(f => f.toLowerCase().includes('pos_2728c') && !f.toLowerCase().includes('871c'));
        if (blueFile) {
          return `https://275132.fs1.hubspotusercontent-na1.net/hubfs/275132/_hcfm-brand/assets/previews/ministries/${encodeURIComponent(code)}/${encodeURIComponent(g.folder)}/${blueFile}`;
        }
      }
    }
    return 'assets/logos/hcfm-symbol-blue.png';
  }

  function renderMinistryDirectory() {
    const grid = document.getElementById('ministryGrid');
    if (!grid) return;
    // The whole card is the link; we drop the redundant "View logos →" text and
    // let the hover state (gold border + lift) carry the affordance.
    grid.innerHTML = ministries.map(m => `
      <a class="ministry-card" href="#ministry/${m.code}" aria-label="View logos for ${m.name}">
        <img src="${ministryMarkUrl(m.code)}" alt="" class="ministry-mark" loading="lazy" onerror="this.src='https://275132.fs1.hubspotusercontent-na1.net/hubfs/275132/_hcfm-brand/assets/logos/hcfm-symbol-blue.png'">
        <p class="ministry-name">${m.name}</p>
        <p class="ministry-region">${m.region.toUpperCase()}</p>
      </a>
    `).join('');
  }

  /* Cache-busting: HubSpot's CDN aggressively caches the JSON file, so any
     time we update the manifest (e.g., add a ministry, rename a logo file),
     browsers can serve a stale version. The `cache: 'no-store'` option tells
     the browser to bypass its HTTP cache for this specific fetch. Adding a
     timestamp query parameter ensures the CDN intermediary doesn't serve a
     cached response either. */
  fetch('https://275132.fs1.hubspotusercontent-na1.net/hubfs/275132/_hcfm-brand/assets/ministry-manifest.json?v=' + Date.now(), { cache: 'no-store' })
    .then(r => r.json())
    .then(data => {
      ministryManifest = data;
      // Re-render the directory grid now that we have ministry-specific marks
      renderMinistryDirectory();
      // If we are already on a ministry detail route, re-render now that manifest is loaded
      if (location.hash.startsWith('#ministry/')) {
        const code = location.hash.split('/')[1];
        const m = ministries.find(x => x.code === code);
        if (m) renderMinistryDetail(m);
      }
      // If Tier 1 is unlocked (member or password), refresh the ministry grid now that
      // the manifest is available. Safe to call multiple times, function is idempotent.
      if ((window.HCFM_MEMBERSHIP && window.HCFM_MEMBERSHIP.hasMinistry)
          || sessionStorage.getItem('hcfm-tier1-unlocked') === '1') {
        renderDlMinistryGrid();
      }
    })
    .catch(() => console.warn('Ministry manifest failed to load'));

  /* ---------- Hash routing ---------- */
  const pages = document.querySelectorAll('.page');
  const navLinks = document.querySelectorAll('.sidebar-nav a');

  function setRoute(hash) {
    let route = (hash || '').replace('#', '');
    if (!route) route = 'home';

    if (route.startsWith('ministry/')) {
      const code = route.split('/')[1];
      const m = ministries.find(x => x.code === code);
      if (m) {
        renderMinistryDetail(m);
        showPage('ministry-detail');
        navLinks.forEach(a => a.classList.toggle('active', a.dataset.route === 'ministries'));
        document.title = `${m.name} · HCFM Brand Identity`;
        window.scrollTo({ top: 0, behavior: 'auto' });
        return;
      }
    }

    if (!document.getElementById(route)) route = 'home';
    showPage(route);
    navLinks.forEach(a => a.classList.toggle('active', a.dataset.route === route));
    const page = document.getElementById(route);
    document.title = page ? `${page.dataset.title} · HCFM Brand Identity` : 'HCFM Brand Identity';
    window.scrollTo({ top: 0, behavior: 'auto' });
    buildPageToc(page);
  }

  /* ---------- Right-rail "On this page" TOC ----------
     Generated per route from the current section's h2's. Hidden when
     there are fewer than 3 h2's (no value adding a 2-item TOC).
     IntersectionObserver highlights the h2 currently in view. */
  const pageToc = document.getElementById('pageToc');
  const pageTocList = document.getElementById('pageTocList');
  let tocObserver = null;

  function slugify(s) {
    return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  }

  function buildPageToc(page) {
    if (!pageToc || !pageTocList || !page) return;
    // Tear down any previous observer
    if (tocObserver) { tocObserver.disconnect(); tocObserver = null; }
    const h2s = [...page.querySelectorAll('h2')].filter(h => h.offsetParent !== null || h.getClientRects().length);
    // Need at least 4 h2's to be worth showing. Home is a launch pad
    // (3 h2's) — gets cleaner without a self-TOC. Stationery / Platforms
    // / Design Elements also stay clean.
    if (h2s.length < 4) {
      pageToc.hidden = true;
      pageTocList.innerHTML = '';
      return;
    }
    pageTocList.innerHTML = '';
    h2s.forEach((h, i) => {
      if (!h.id) h.id = page.id + '-' + slugify(h.textContent) + (i ? '-' + i : '');
      const li = document.createElement('li');
      // Use <button> not <a href="#..."> — host JS (HubSpot tools menu,
      // page-level jQuery) intercepts hash-link clicks before our
      // preventDefault can fire, which triggers the router with a non-
      // existent route and blanks the page. Buttons have no default
      // navigation, so there's nothing to intercept.
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = h.textContent.trim();
      btn.dataset.tocFor = h.id;
      btn.addEventListener('click', () => {
        h.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Brief visible highlight so the user sees "I landed here"
        h.classList.remove('toc-flash');
        // Force reflow so animation re-triggers when same item is clicked twice
        void h.offsetWidth;
        h.classList.add('toc-flash');
        setTimeout(() => h.classList.remove('toc-flash'), 1400);
      });
      li.appendChild(btn);
      pageTocList.appendChild(li);
    });
    pageToc.hidden = false;

    // Track active h2 via IntersectionObserver
    const tocLinks = [...pageTocList.querySelectorAll('button')];
    tocObserver = new IntersectionObserver((entries) => {
      const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (!visible) return;
      const id = visible.target.id;
      tocLinks.forEach(l => l.classList.toggle('is-active', l.dataset.tocFor === id));
    }, { rootMargin: '-80px 0px -60% 0px', threshold: [0, 1] });
    h2s.forEach(h => tocObserver.observe(h));
    // Default-highlight the first item
    if (tocLinks[0]) tocLinks[0].classList.add('is-active');
  }

  function showPage(id) {
    pages.forEach(p => p.classList.toggle('active', p.id === id));
  }

  window.addEventListener('hashchange', () => setRoute(location.hash));
  setRoute(location.hash);

  /* ---------- Theme (dark mode) toggle ----------
     Always defaults to light on a first visit. The toggle button in
     the header is always visible so anyone can switch whenever they
     want. Choice persists in localStorage for return visits. OS
     preference is intentionally NOT followed automatically. */
  const themeToggle = document.getElementById('themeToggle');
  function applyTheme(theme) {
    if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    if (themeToggle) themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }
  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }
  if (themeToggle) {
    applyTheme(currentTheme());
    themeToggle.addEventListener('click', () => {
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem('hcfm-theme', next); } catch (e) {}
    });
  }

  /* ---------- Mobile hamburger nav drawer ----------
     Slides the sidebar in from the left on phones (≤640px). Backdrop
     dims the rest of the page. Tapping a nav link, the backdrop, or the
     hamburger again closes it. Escape key also closes. */
  const navToggle = document.getElementById('navToggle');
  const sidebar = document.getElementById('sidebar');
  const navBackdrop = document.getElementById('navBackdrop');

  function openNav() {
    if (!sidebar) return;
    sidebar.classList.add('is-open');
    if (navBackdrop) navBackdrop.classList.add('is-open');
    if (navToggle) navToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeNav() {
    if (!sidebar) return;
    sidebar.classList.remove('is-open');
    if (navBackdrop) navBackdrop.classList.remove('is-open');
    if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  function toggleNav() {
    if (!sidebar) return;
    if (sidebar.classList.contains('is-open')) closeNav(); else openNav();
  }

  if (navToggle) navToggle.addEventListener('click', toggleNav);
  if (navBackdrop) navBackdrop.addEventListener('click', closeNav);

  // Close drawer whenever the route changes — i.e. whenever the user picks
  // anything from the sidebar nav. We listen on `hashchange` rather than on
  // click because some host JS (HubSpot tools menu, parent-site smooth-scroll
  // shims) intercepts clicks on `a[href^="#"]` and stops propagation before
  // it can reach the sidebar. `hashchange` is fired by the browser itself and
  // is not affected by any of that — bulletproof.
  window.addEventListener('hashchange', () => {
    if (sidebar && sidebar.classList.contains('is-open')) closeNav();
  });

  // Belt-and-suspenders: also attach a direct click listener to every nav
  // link, in capture phase, so we close even if for some reason the hash
  // doesn't actually change (e.g. user clicks the link for the current
  // section). Capture-phase fires before any descendant handler can cancel
  // the event.
  document.querySelectorAll('.sidebar a[href^="#"]').forEach(link => {
    link.addEventListener('click', () => {
      if (sidebar && sidebar.classList.contains('is-open')) closeNav();
    }, true);
  });

  // Escape key closes the drawer
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar && sidebar.classList.contains('is-open')) closeNav();
  });

  // Close drawer automatically when viewport grows past mobile breakpoint
  // (e.g., user rotates phone from portrait to landscape and is now on tablet)
  const mobileQuery = window.matchMedia('(max-width: 640px)');
  mobileQuery.addEventListener('change', (e) => { if (!e.matches) closeNav(); });

  /* ---------- Color cube click-to-copy ---------- */
  document.querySelectorAll('.color-cube').forEach(cube => {
    cube.addEventListener('click', async () => {
      const hex = cube.dataset.hex;
      if (!hex) return;
      try {
        await navigator.clipboard.writeText(hex);
        showToast(`Copied ${hex}`);
      } catch {
        showToast('Copy failed');
      }
    });
  });

  /* ---------- Email-signature copy buttons ---------- */
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.email-sig-copy');
    if (!btn) return;
    e.preventDefault();
    const targetId = btn.dataset.copyTarget;
    const target = targetId && document.getElementById(targetId);
    if (!target) return;
    const text = target.textContent;
    try {
      await navigator.clipboard.writeText(text);
      const originalLabel = btn.textContent;
      btn.textContent = 'Copied ✓';
      setTimeout(() => { btn.textContent = originalLabel; }, 1800);
      showToast('Signature copied to clipboard');
    } catch {
      showToast('Copy failed, select and copy manually');
    }
  });

  /* ---------- Sidebar search ----------
     Filters the sidebar nav by section title. Surfaces a visible status
     above the nav so the user can see what's been filtered and clear it
     in one click (without this, the search looks like it does nothing). */
  const search = document.getElementById('search');
  const searchStatus = document.getElementById('searchStatus');
  const searchStatusQuery = document.getElementById('searchStatusQuery');
  const searchStatusCount = document.getElementById('searchStatusCount');
  const searchStatusClear = document.getElementById('searchStatusClear');
  const searchEmpty = document.getElementById('searchEmpty');
  const searchEmptyClear = document.getElementById('searchEmptyClear');

  function runSearch() {
    if (!search) return;
    const q = search.value.trim().toLowerCase();
    let matchCount = 0;
    navLinks.forEach(a => {
      const visible = !q || a.textContent.toLowerCase().includes(q);
      a.style.display = visible ? '' : 'none';
      if (visible && q) matchCount++;
    });
    document.querySelectorAll('.nav-group').forEach(g => {
      const anyVisible = Array.from(g.querySelectorAll('a')).some(a => a.style.display !== 'none');
      const label = g.querySelector('.nav-group-label');
      if (label) label.style.display = anyVisible ? '' : 'none';
    });
    if (searchStatus) {
      if (q) {
        if (searchStatusQuery) searchStatusQuery.textContent = '“' + search.value.trim() + '”';
        if (searchStatusCount) searchStatusCount.textContent = String(matchCount);
        searchStatus.hidden = false;
        if (searchEmpty) searchEmpty.hidden = matchCount > 0;
      } else {
        searchStatus.hidden = true;
        if (searchEmpty) searchEmpty.hidden = true;
      }
    }
  }

  function clearSearch() {
    if (!search) return;
    search.value = '';
    runSearch();
    search.focus();
  }

  if (search) search.addEventListener('input', runSearch);
  if (searchStatusClear) searchStatusClear.addEventListener('click', clearSearch);
  if (searchEmptyClear) searchEmptyClear.addEventListener('click', clearSearch);
  // Escape inside the search field clears it
  if (search) search.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && search.value) { e.preventDefault(); clearSearch(); }
  });

  /* ---------- Video chapter jumps ----------
     Each chapter button has data-t="seconds". On click, reload the
     iframe with ?start=Xs&autoplay=1 so YouTube jumps to that
     timestamp and starts playing. The previously-clicked chapter
     button gets an is-playing highlight. */
  document.querySelectorAll('.video-detail').forEach(card => {
    const ytId = card.dataset.ytId;
    const iframe = card.querySelector('.video-frame iframe');
    if (!ytId || !iframe) return;
    const chapters = [...card.querySelectorAll('.chapter-jump')];
    chapters.forEach(btn => {
      btn.addEventListener('click', () => {
        const t = parseInt(btn.dataset.t || '0', 10) || 0;
        iframe.src = 'https://www.youtube.com/embed/' + ytId + '?start=' + t + '&autoplay=1&rel=0';
        chapters.forEach(b => b.classList.toggle('is-playing', b === btn));
        // Smooth-scroll the frame back into view so the user sees it after click
        iframe.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  });

  /* ---------- Contrast checker ----------
     Live WCAG 2.1 contrast ratio. Formula: linearize each RGB channel,
     compute relative luminance L = 0.2126R + 0.7152G + 0.0722B,
     contrast = (L_lighter + 0.05) / (L_darker + 0.05). */
  const ccText = document.getElementById('ccText');
  const ccBg = document.getElementById('ccBg');
  const ccPreview = document.getElementById('ccPreview');
  const ccRatio = document.getElementById('ccRatio');
  const ccGradeAA = document.getElementById('ccGradeAA');
  const ccGradeAAA = document.getElementById('ccGradeAAA');
  const ccGradeLarge = document.getElementById('ccGradeLarge');
  const ccMessage = document.getElementById('ccMessage');

  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function luminance([r, g, b]) {
    const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  }
  function contrastRatio(fgHex, bgHex) {
    const L1 = luminance(hexToRgb(fgHex));
    const L2 = luminance(hexToRgb(bgHex));
    const [lo, hi] = L1 > L2 ? [L2, L1] : [L1, L2];
    return (hi + 0.05) / (lo + 0.05);
  }
  function updateContrastChecker() {
    if (!ccText || !ccBg) return;
    const fg = ccText.value;
    const bg = ccBg.value;
    const ratio = contrastRatio(fg, bg);
    ccPreview.style.color = fg;
    ccPreview.style.background = bg;
    if (ccRatio) ccRatio.textContent = ratio.toFixed(2) + ':1';
    // WCAG thresholds: AA normal 4.5, AAA normal 7, AA large 3
    const passAA = ratio >= 4.5;
    const passAAA = ratio >= 7;
    const passLarge = ratio >= 3;
    if (ccGradeAA) ccGradeAA.classList.toggle('is-pass', passAA), ccGradeAA.classList.toggle('is-fail', !passAA);
    if (ccGradeAAA) ccGradeAAA.classList.toggle('is-pass', passAAA), ccGradeAAA.classList.toggle('is-fail', !passAAA);
    if (ccGradeLarge) ccGradeLarge.classList.toggle('is-pass', passLarge), ccGradeLarge.classList.toggle('is-fail', !passLarge);
    if (ccMessage) {
      let msg;
      if (fg.toLowerCase() === bg.toLowerCase()) msg = 'Same color front and back — the text would be invisible. Pick a different pair.';
      else if (passAAA) msg = 'Excellent contrast. Safe for any text size, including body copy.';
      else if (passAA) msg = 'Passes AA for body text. Safe for paragraphs, captions, and UI text.';
      else if (passLarge) msg = 'Passes only for large display text (24px+ regular or 18.66px+ bold). Avoid for body copy.';
      else msg = 'Fails WCAG. Hard to read. Use one of the recommended brand combinations instead — Black background with Yellow Gold or White, or White background with HCFM Blue.';
      ccMessage.textContent = msg;
    }
  }
  if (ccText) ccText.addEventListener('change', updateContrastChecker);
  if (ccBg) ccBg.addEventListener('change', updateContrastChecker);
  // Initial state
  if (ccText && ccBg) updateContrastChecker();

  /* ---------- Playlist Script playground ---------- */
  const playInput = document.getElementById('playlistInput');
  const playOutput = document.getElementById('playlistOutput');
  if (playInput && playOutput) {
    const colors = ['#FFB500', '#FFFFFF', '#00A9E0'];
    let i = 0;
    playInput.addEventListener('input', () => {
      const value = playInput.value.trim() || 'pray';
      playOutput.textContent = value;
      i = (i + 1) % colors.length;
      playOutput.style.color = colors[i];
    });
  }

  /* ---------- Ministry directory ---------- */
  renderMinistryDirectory(); // initial render with parent fallback; manifest fetch will re-render with actual marks

  /* ---------- Ministry detail page (reads from manifest) ---------- */
  function variantLabelFromFile(filename) {
    // Strip prefix to get the suffix that describes color
    const lower = filename.toLowerCase();
    if (lower.includes('rev_white')) return { label: 'White (reverse)', dark: true };
    if (lower.includes('rev_1245c')) return { label: 'Gold (reverse)', dark: true };
    if (lower.includes('pos_871c_2728c')) return { label: 'Two-tone', dark: false };
    if (lower.includes('pos_871c')) return { label: 'Muted Gold', dark: false };
    if (lower.includes('pos_2728c')) return { label: 'HCFM Blue', dark: false };
    if (lower.includes('pos_black') || lower.includes('_black')) return { label: 'Black', dark: false };
    return { label: 'Variant', dark: false };
  }

  // Tier 1 unlock check, same logic as the Downloads section uses.
  // Ministry-detail downloads share the same password gate.
  function isMinistryDlUnlocked() {
    return (window.HCFM_MEMBERSHIP && window.HCFM_MEMBERSHIP.hasMinistry)
        || sessionStorage.getItem('hcfm-tier1-unlocked') === '1';
  }

  function renderMinistryDetail(m) {
    const nameEl = document.getElementById('mdName');
    const h1 = document.getElementById('mdH1');
    const intro = document.getElementById('mdIntro');
    const gallery = document.getElementById('mdGallery');
    if (!nameEl || !gallery) return;

    const unlocked = isMinistryDlUnlocked();

    nameEl.textContent = m.name;
    h1.textContent = m.name;
    intro.innerHTML = unlocked
      ? `<strong>${m.region}.</strong> Logo gallery for this ministry. Click any variant to download the PNG, or use the <em>Download all variants</em> button at the top of each section to grab the full pack at once.`
      : `<strong>${m.region}.</strong> Logo gallery for this ministry. <strong>Downloads are gated.</strong> Browse the variants below, then unlock downloads in the <a href="#downloads">Downloads tab</a>.`;

    // HCFM Foundation uses the parent HCFM logos directly (the wordmark is
    // 'Holy Cross Family Ministries' with no 'Foundation' suffix added).
    const isFoundation = m.code === FOUNDATION_CODE;
    if (isFoundation) {
      intro.innerHTML += `<p style="margin-top:12px;font-size:var(--fs-sm);color:var(--text-muted);"><em>The HCFM Foundation uses the parent Holy Cross Family Ministries logo as its identity. The wordmark does not include "Foundation".</em></p>`;
    }
    const groups = isFoundation ? FOUNDATION_AS_PARENT : (ministryManifest[m.code] || []);
    const previewBase = isFoundation ? '' : `https://275132.fs1.hubspotusercontent-na1.net/hubfs/275132/_hcfm-brand/assets/previews/ministries/${encodeURIComponent(m.code)}`;

    if (!groups.length) {
      gallery.innerHTML = `
        <div class="md-ministry-hero">
          <img src="assets/logos/hcfm-symbol-blue.png" alt="">
          <div>
            <h2>${m.name}</h2>
            <p>${m.region} · Code: ${m.code}</p>
          </div>
        </div>
        <div class="info-block">
          <h3>Logo previews loading…</h3>
          <p>If this message stays, the manifest didn't load. Try refreshing the page.</p>
        </div>`;
      return;
    }

    // Collect every file URL across every group so the "download all for this
    // ministry" button can save them all in one click.
    const allFiles = [];

    // Gate banner shown above the gallery when Tier 1 is locked
    const gateBanner = unlocked ? '' : `
      <div class="md-gate" role="region" aria-label="Downloads gated">
        <div class="md-gate-text">
          <p class="md-gate-h">Logo downloads are password-gated.</p>
          <p class="md-gate-p">Browse the variants below to confirm what you need, then enter the access password in the Downloads tab to enable downloads. Same password unlocks all ministry-center logo packs.</p>
        </div>
        <a href="#downloads" class="btn btn-primary">Unlock in Downloads →</a>
      </div>
    `;

    gallery.innerHTML = `
      ${gateBanner}
      <div class="md-ministry-hero">
        <img src="assets/logos/hcfm-symbol-blue.png" alt="">
        <div>
          <h2>${m.name}</h2>
          <p>${m.region} · Code: ${m.code}</p>
        </div>
        ${unlocked ? `<a class="btn btn-primary md-bulk-zip" href="downloads/logo-packs/ministries/${m.code}_Pack.zip" download="${m.code}_Logo_Pack.zip" title="Download every logo for ${m.name} as a single ZIP with PNG/ and JPG/ folders">Download all logos (ZIP) →</a>` : ''}
      </div>
      ${groups.map(g => {
        const ltLabel = g.folder.replace(/.*(Logotype\d)/, '$1').replace('Logotype', 'Logotype ');
        const groupBase = g.basePath ? `${g.basePath}/${encodeURIComponent(g.folder)}` : `${previewBase}/${encodeURIComponent(g.folder)}`;
        const variantsHtml = g.files.map(file => {
          const v = variantLabelFromFile(file);
          const path = `${groupBase}/${file}`;
          allFiles.push({ path, name: file });
          // When locked: render as a non-clickable card (just preview). When unlocked: full download link.
          if (!unlocked) {
            return `
              <div class="md-variant" title="${v.label}">
                <div class="md-variant-bg ${v.dark ? 'dark' : ''}">
                  <img src="${path}" alt="${v.label}" loading="lazy">
                </div>
                <p class="md-variant-name">${v.label}</p>
              </div>
            `;
          }
          return `
            <a class="md-variant md-variant-link" href="${path}" download="${file}" data-dl-url="${path}" data-dl-name="${file}" title="Download ${v.label} (${file})">
              <div class="md-variant-bg ${v.dark ? 'dark' : ''}">
                <img src="${path}" alt="${v.label}" loading="lazy">
                <span class="md-variant-download" aria-hidden="true">↓ PNG</span>
              </div>
              <p class="md-variant-name">${v.label}</p>
            </a>
          `;
        }).join('');
        return `
          <div class="md-section-head">
            <h3 class="md-section-title">${ltLabel}</h3>
          </div>
          <div class="md-variants-grid">${variantsHtml}</div>
        `;
      }).join('')}

      <div class="info-block">
        <h3>About these files</h3>
        <p>The single-variant cards above download <strong>PNG</strong> (web/digital). The <strong>“Download all logos (ZIP)”</strong> button at the top contains both <strong>PNG</strong> and <strong>JPG</strong> versions of every variant, organized in <code>PNG/</code> and <code>JPG/</code> subfolders. Editable AI source files are restricted to the brand owners; if you need a custom edit (embroidery, vinyl, banner-size print), email <a href="mailto:vhassan@hcfm.org">Victoria</a> or <a href="mailto:eepau@hcfm.org">Emmanuel</a>.</p>
      </div>
    `;
  }

  // Re-render the ministry-detail when Tier 1 gets unlocked, so a user who
  // unlocks via password and then navigates back to a ministry detail page
  // sees the download buttons appear without needing a full page refresh.
  document.addEventListener('hcfm:tier1-unlocked', () => {
    if (location.hash.startsWith('#ministry/')) {
      const code = location.hash.split('/')[1];
      const m = ministries.find(x => x.code === code);
      if (m) renderMinistryDetail(m);
    }
  });

  /* ---------- Ministry download helpers ----------
     Files are hosted cross-origin (HubSpot CDN). The native <a download> attribute
     gets ignored cross-origin in most browsers, they navigate instead of saving.
     We fetch the file as a Blob and trigger a save with an object URL, which gives
     a real download UX with the proper filename. */
  function saveBlobAs(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function downloadOne(url, filename) {
    try {
      const res = await fetch(url, { mode: 'cors', cache: 'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const blob = await res.blob();
      saveBlobAs(blob, filename);
      return true;
    } catch (e) {
      console.warn('Download failed for', filename, e);
      // Fallback: open the URL in a new tab so the user can save manually.
      window.open(url, '_blank', 'noopener');
      return false;
    }
  }

  async function downloadMany(files, onProgress) {
    let i = 0;
    for (const f of files) {
      i++;
      if (onProgress) onProgress(i, files.length, f);
      await downloadOne(f.path, f.name);
      // Small delay so browsers don't bunch the downloads and trigger pop-up blockers.
      await new Promise(r => setTimeout(r, 250));
    }
  }

  // Per-variant click on the variant card → fetch + save the PNG
  // Covers BOTH the sub-ministry galleries (.md-variant-link) and the
  // Parent gallery (.dl-variant which is itself an <a>). Without this,
  // Parent variant clicks would just open the image in a new tab because
  // the HubSpot CDN serves PNG with Content-Disposition: inline.
  document.addEventListener('click', (e) => {
    const link = e.target.closest('.md-variant-link, a.dl-variant[href]');
    if (!link) return;
    e.preventDefault();
    const url = link.dataset.dlUrl || link.getAttribute('href');
    const name = link.dataset.dlName || link.getAttribute('download') || 'logo.png';
    downloadOne(url, name).then(ok => {
      if (ok) showToast(`Saved ${name}`);
    });
  });

  // Whole-ministry bulk download is now a direct <a href> link to a pre-built
  // ZIP (`md-bulk-zip`) — no JS click handler needed. The browser handles the
  // download natively. ZIP contains PNG/ and JPG/ subfolders with every
  // configuration. Same for the per-logotype-set buttons (now removed; the
  // whole-ministry ZIP covers them).

  /* ---------- Downloads: 3-tier hybrid gate ----------
     Tier 0 (public): Brand documents, always visible, no gate.
     Tier 1 (password OR ministry-tier membership): Parent / Ministries / Fonts.
       Ministry-tier members auto-unlock via HubSpot Memberships (server-rendered).
       Anonymous users enter a single shared password (cached in sessionStorage).
     Tier 2 (admin-tier membership only): Source files. Server-rendered visibility
       via HubL on `has_admin_access`; the source pane and tab don't render at all
       in HTML for non-admin visitors. */
  const tier1Gate = document.getElementById('tier1Gate');
  const tier1Form = document.getElementById('tier1Form');
  const tier1Password = document.getElementById('tier1Password');
  const sourceTab = document.getElementById('sourceTab');

  const TIER1_STORAGE_KEY = 'hcfm-tier1-unlocked';
  // Single shared password (case-insensitive, multiple acceptable variants for fault tolerance)
  const TIER1_PASSWORDS = ['hcfm2026', 'eastoncreatives', 'familyrosary'];

  const RELEASE_BASE = 'https://275132.fs1.hubspotusercontent-na1.net/hubfs/275132/_hcfm-brand/downloads/source-files';
  // Public-facing logo packs: PNG + JPG, organized in PNG/ and JPG/ subfolders.
  // No AI files. These are the ZIPs every "Download all" button serves.
  const PACKS_BASE = 'https://275132.fs1.hubspotusercontent-na1.net/hubfs/275132/_hcfm-brand/downloads/logo-packs';

  function isTier1Unlocked() {
    return (window.HCFM_MEMBERSHIP && window.HCFM_MEMBERSHIP.hasMinistry)
        || sessionStorage.getItem(TIER1_STORAGE_KEY) === '1';
  }

  function renderTier1ContentIfNeeded() {
    // Only render once per page load, the underlying functions are also idempotent.
    if (renderTier1ContentIfNeeded._done) return;
    renderTier1ContentIfNeeded._done = true;
    renderParentGallery();
    renderDlMinistryGrid();
    if (window.HCFM_MEMBERSHIP && window.HCFM_MEMBERSHIP.hasAdmin) {
      renderSourceMinistryList();
    }
  }

  function showPane(target) {
    // Mark the matching tab active
    document.querySelectorAll('.dl-tab').forEach(t => t.classList.toggle('active', t.dataset.dlTab === target));
    // Hide every pane
    document.querySelectorAll('.dl-pane').forEach(p => { p.classList.remove('active'); p.hidden = true; });
    // For Tier 1 tabs without unlock, show the gate pane in the content area
    const isTier1Tab = ['parent', 'ministries', 'fonts', 'templates'].includes(target);
    if (isTier1Tab && !isTier1Unlocked()) {
      if (tier1Gate) { tier1Gate.hidden = false; tier1Gate.classList.add('active'); }
      // Focus the password field for convenience
      if (tier1Password) tier1Password.focus();
      return;
    }
    // Otherwise show the requested pane
    const pane = document.querySelector('.dl-pane[data-dl-pane="' + target + '"]');
    if (pane) { pane.hidden = false; pane.classList.add('active'); }
  }

  // Wire up the tab buttons
  document.querySelectorAll('.dl-tab').forEach(tab => {
    tab.addEventListener('click', () => showPane(tab.dataset.dlTab));
  });

  // Tier 1 password form
  if (tier1Form) {
    tier1Form.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = (tier1Password.value || '').trim().toLowerCase();
      if (TIER1_PASSWORDS.includes(value)) {
        sessionStorage.setItem(TIER1_STORAGE_KEY, '1');
        renderTier1ContentIfNeeded();
        // Notify ministry-detail (and any other listeners) so they re-render
        // with download buttons enabled.
        document.dispatchEvent(new CustomEvent('hcfm:tier1-unlocked'));
        showToast('Access granted');
        // Switch user to the Parent tab so they immediately see unlocked content
        showPane('parent');
      } else {
        showToast('Wrong password. Email Victoria or Emmanuel for access.');
        tier1Password.value = '';
      }
    });
  }

  // No-op shims kept so any older code path or external integration referencing
  // unlockDownloads()/unlockAdmin() doesn't throw a ReferenceError.
  function unlockDownloads() { sessionStorage.setItem(TIER1_STORAGE_KEY, '1'); renderTier1ContentIfNeeded(); }
  function unlockAdmin() { document.body.classList.add('admin-active'); }

  /* ---------- Parent gallery (PNG/JPG only, no AI files publicly) ---------- */
  function renderParentGallery() {
    const el = document.getElementById('parentGallery');
    if (!el) return;

    const groups = [
      {
        title: 'HCFM Symbol',
        sub: 'The mark alone',
        zip: `${PACKS_BASE}/parent/HCFM_Symbol_Pack.zip`,
        zipSize: '2.1 MB',
        folder: 'HCFM_Symbol',
        variants: [
          { file: 'hcfm_symbol_pos_2728c.png',  label: 'HCFM Blue', dark: false },
          { file: 'hcfm_symbol_pos_871c.png',   label: 'Muted Gold', dark: false },
          { file: 'hcfm_symbol_pos_black.png',  label: 'Black',     dark: false },
          { file: 'hcfm_symbol_rev_1245c.png',  label: 'Gold reverse', dark: true },
          { file: 'hcfm_symbol_rev_white.png',  label: 'White reverse', dark: true }
        ]
      },
      {
        title: 'Logotype 1, Horizontal',
        sub: 'Mark left, wordmark right (single line)',
        zip: `${PACKS_BASE}/parent/HCFM_Logotype1_Pack.zip`,
        zipSize: '2.6 MB',
        folder: 'HCFM_Logotype1',
        variants: [
          { file: 'hcfm_logo1_pos_2728c.png',         label: 'HCFM Blue', dark: false },
          { file: 'hcfm_logo1_pos_871c_2728c.png',    label: 'Two-tone',  dark: false },
          { file: 'hcfm_logo1_pos_black.png',         label: 'Black',     dark: false },
          { file: 'hcfm_logo1_rev_1245c_white.png',   label: 'Gold reverse', dark: true },
          { file: 'hcfm_logo1_rev_white.png',         label: 'White reverse', dark: true }
        ]
      },
      {
        title: 'Logotype 2, Stacked',
        sub: 'Mark on top, wordmark on two lines below',
        zip: `${PACKS_BASE}/parent/HCFM_Logotype2_Pack.zip`,
        zipSize: '2.6 MB',
        folder: 'HCFM_Logotype2',
        variants: [
          { file: 'hcfm_logo2_pos_2728c.png',         label: 'HCFM Blue', dark: false },
          { file: 'hcfm_logo2_pos_871c_2728c.png',    label: 'Two-tone',  dark: false },
          { file: 'hcfm_logo2_pos_black.png',         label: 'Black',     dark: false },
          { file: 'hcfm_logo2_rev_1245c_white.png',   label: 'Gold reverse', dark: true },
          { file: 'hcfm_logo2_rev_white.png',         label: 'White reverse', dark: true }
        ]
      },
      {
        title: 'Logotype 3, Compact stacked',
        sub: 'Mark on top with a smaller wordmark',
        zip: `${PACKS_BASE}/parent/HCFM_Logotype3_Pack.zip`,
        zipSize: '2.3 MB',
        folder: 'HCFM_Logotype3',
        variants: [
          { file: 'hcfm_logo3_pos_2728c.png',         label: 'HCFM Blue', dark: false },
          { file: 'hcfm_logo3_pos_871c_2728c.png',    label: 'Two-tone',  dark: false },
          { file: 'hcfm_logo3_pos_black.png',         label: 'Black',     dark: false },
          { file: 'hcfm_logo3_rev_1245c_white.png',   label: 'Gold reverse', dark: true },
          { file: 'hcfm_logo3_rev_white.png',         label: 'White reverse', dark: true }
        ]
      },
      {
        title: 'Logotype 4, Single line',
        sub: 'Mark with full wordmark on a single line',
        zip: `${PACKS_BASE}/parent/HCFM_Logotype4_Pack.zip`,
        zipSize: '2.5 MB',
        folder: 'HCFM_Logotype4',
        variants: [
          { file: 'hcfm_logo4_pos_2728c.png',         label: 'HCFM Blue', dark: false },
          { file: 'hcfm_logo4_pos_871c_2728c.png',    label: 'Two-tone',  dark: false },
          { file: 'hcfm_logo4_pos_black.png',         label: 'Black',     dark: false },
          { file: 'hcfm_logo4_rev_1245c_white.png',   label: 'Gold reverse', dark: true },
          { file: 'hcfm_logo4_rev_white.png',         label: 'White reverse', dark: true }
        ]
      }
    ];

    // Six representative thumbnails for the Parent Pack hero card
    const featuredPreviews = [
      { folder: 'HCFM_Symbol',    file: 'hcfm_symbol_pos_2728c.png',      label: 'Symbol · Blue',    dark: false },
      { folder: 'HCFM_Logotype1', file: 'hcfm_logo1_pos_2728c.png',       label: 'Logotype 1 · Blue', dark: false },
      { folder: 'HCFM_Logotype2', file: 'hcfm_logo2_pos_871c_2728c.png',  label: 'Logotype 2 · Two-tone', dark: false },
      { folder: 'HCFM_Logotype3', file: 'hcfm_logo3_pos_black.png',       label: 'Logotype 3 · Black', dark: false },
      { folder: 'HCFM_Logotype4', file: 'hcfm_logo4_rev_white.png',       label: 'Logotype 4 · White reverse', dark: true },
      { folder: 'HCFM_Symbol',    file: 'hcfm_symbol_rev_1245c.png',      label: 'Symbol · Gold reverse', dark: true }
    ];

    // Each variant is now an <a> link with download attribute so the user
    // can grab a single Symbol/Logotype/color combination as one PNG file
    // (same UX as the sub-ministry galleries).
    el.innerHTML = `
      <article class="dl-gallery-item dl-gallery-item-feature">
        <div class="dl-gallery-head">
          <div>
            <h3>HCFM Parent Pack</h3>
            <p>Everything: Symbol + all 4 Logotypes, all colors, PNG and JPG. 12 MB.</p>
          </div>
          <a href="${PACKS_BASE}/parent/HCFM_Parent_All_Pack.zip" download="HCFM_Parent_All_Pack.zip" class="btn btn-primary">Download all (ZIP) <span class="btn-meta">12 MB</span></a>
        </div>
        <div class="dl-variants dl-variants-feature">
          ${featuredPreviews.map(v => `
            <a class="dl-variant ${v.dark ? 'dark' : ''}" href="assets/previews/parent/${v.folder}/${v.file}" download="${v.file}" title="Download ${v.label} (${v.file})">
              <img src="assets/previews/parent/${v.folder}/${v.file}" alt="${v.label}" loading="lazy" onerror="this.style.opacity='0.3'">
              <span class="dl-variant-name">${v.label}</span>
              <span class="dl-variant-download" aria-hidden="true">↓ PNG</span>
            </a>
          `).join('')}
        </div>
        <div class="dl-gallery-foot">
          <span class="dl-link">A representative sample. Click any variant above to download just that one as PNG. The “Download all (ZIP)” button serves a single ZIP with <code>PNG/</code> and <code>JPG/</code> subfolders covering every variant in every color across all 5 configurations.</span>
        </div>
      </article>
    ` + groups.map(g => `
      <article class="dl-gallery-item">
        <div class="dl-gallery-head">
          <div>
            <h3>${g.title}</h3>
            <p>${g.sub}</p>
          </div>
          <a href="${g.zip}" download="${g.folder}_Pack.zip" class="btn btn-primary">Download all (ZIP) <span class="btn-meta">${g.zipSize}</span></a>
        </div>
        <div class="dl-variants">
          ${g.variants.map(v => `
            <a class="dl-variant ${v.dark ? 'dark' : ''}" href="assets/previews/parent/${g.folder}/${v.file}" download="${v.file}" title="Download ${v.label} (${v.file})">
              <img src="assets/previews/parent/${g.folder}/${v.file}" alt="${v.label}" loading="lazy" onerror="this.style.opacity='0.3'">
              <span class="dl-variant-name">${v.label}</span>
              <span class="dl-variant-download" aria-hidden="true">↓ PNG</span>
            </a>
          `).join('')}
        </div>
        <div class="dl-gallery-foot">
          <span class="dl-link">Click any variant to download just that one PNG. Use the “Download all (ZIP)” button above for the full pack with <code>PNG/</code> and <code>JPG/</code> subfolders. Source files (AI / EPS) are brand-owner restricted.</span>
        </div>
      </article>
    `).join('');
  }

  /* ---------- Downloads ministry grid ---------- */
  function renderDlMinistryGrid() {
    const el = document.getElementById('dlMinistryGrid');
    if (!el) return;
    el.innerHTML = ministries.map(m => `
      <a class="dl-ministry-card" href="#ministry/${m.code}">
        <img src="${ministryMarkUrl(m.code)}" alt="" loading="lazy" onerror="this.src='https://275132.fs1.hubspotusercontent-na1.net/hubfs/275132/_hcfm-brand/assets/logos/hcfm-symbol-blue.png'">
        <div>
          <p class="dl-ministry-card-name">${m.name}</p>
          <p class="dl-ministry-card-region">${m.region}</p>
        </div>
      </a>
    `).join('');
  }

  /* ---------- Source Files: ministry list (admin tier) ---------- */
  function renderSourceMinistryList() {
    const el = document.getElementById('dlSourceMinistries');
    if (!el) return;
    el.innerHTML = ministries.map(m => `
      <li><a href="${RELEASE_BASE}/ministries/${m.code}_SOURCE.zip"><strong>${m.name}</strong><span>${m.region} · ZIP · AI / JPG / PNG</span></a></li>
    `).join('');
  }

  /* ---------- Auto-unlock Tier 1 on page load when access exists ----------
     Two paths to Tier 1: signed-in ministry-tier member, or sessionStorage flag from
     a previous password unlock in this browser session. Either way, render the
     dynamic galleries so the panes are populated when the user clicks the tabs. */
  if (isTier1Unlocked()) {
    renderTier1ContentIfNeeded();
    if (window.HCFM_MEMBERSHIP && window.HCFM_MEMBERSHIP.hasAdmin) {
      document.body.classList.add('admin-active');
    }
  }

  /* ---------- Image lightbox ---------- */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');

  document.querySelectorAll('[data-zoom]').forEach(card => {
    card.addEventListener('click', () => {
      const src = card.dataset.zoom;
      if (!src || !lightbox || !lightboxImg) return;
      lightboxImg.src = src;
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');
    });
  });

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    setTimeout(() => { if (lightboxImg) lightboxImg.src = 'data:,'; }, 200);
  }

  if (lightbox) lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

  /* ---------- FAQ search ---------- */
  const faqSearch = document.getElementById('faqSearch');
  const faqList = document.getElementById('faqList');
  const faqEmpty = document.getElementById('faqEmpty');
  if (faqSearch && faqList) {
    faqSearch.addEventListener('input', () => {
      const q = faqSearch.value.trim().toLowerCase();
      const items = faqList.querySelectorAll('details');
      let any = false;
      items.forEach(d => {
        const text = (d.textContent || '').toLowerCase();
        const match = !q || text.includes(q);
        d.style.display = match ? '' : 'none';
        if (match && q) d.open = true;
        else if (!q) d.open = false;
        if (match) any = true;
      });
      if (faqEmpty) faqEmpty.hidden = any;
    });
  }

  /* ---------- Brand helper chat ---------- */
  const chatFab = document.getElementById('chatFab');
  const chatPanel = document.getElementById('chatPanel');
  const chatClose = document.getElementById('chatClose');
  const chatBody = document.getElementById('chatBody');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');

  function openChat() {
    if (chatPanel) {
      chatPanel.classList.add('open');
      chatPanel.setAttribute('aria-hidden', 'false');
      // Remove inert so focusable elements inside become tabbable. Setting
      // aria-hidden=false alone isn't enough — axe-core (correctly) flags
      // any element with aria-hidden=true that contains focusable nodes,
      // because tab order leaks the panel even when "hidden" visually.
      chatPanel.removeAttribute('inert');
      setTimeout(() => chatInput && chatInput.focus(), 300);
      // Industry-standard help-bot pattern: open with value (starter pills)
      // not a survey. No identity capture, no friction, user can start
      // asking immediately. Only render on a fresh session (empty body).
      setTimeout(() => {
        if (chatBody && chatBody.children.length === 0) {
          addChatMessage(
            `<p class="chat-starter-intro">Ask anything about the HCFM brand, colors, fonts, logos, voice, the 2026 changes, downloads, or specific ministry-center situations.</p>`,
            false,
            {
              followUps: [
                'why did we move from muted gold to yellow gold',
                'where do I download logos',
                'how do I use Playlist Script',
                'what fonts do we use',
              ],
              followUpsLabel: 'Try one of these:',
            }
          );
        }
      }, 350);
    }
  }
  function closeChat() {
    if (chatPanel) {
      chatPanel.classList.remove('open');
      chatPanel.setAttribute('aria-hidden', 'true');
      // Set inert so descendants (input, send button, pills) drop out of
      // the tab order along with the visual hide. Resolves the
      // aria-hidden-focus violation.
      chatPanel.setAttribute('inert', '');
    }
  }
  if (chatFab) chatFab.addEventListener('click', openChat);
  if (chatClose) chatClose.addEventListener('click', closeChat);

  // Knowledge base, pulled from the actual brand book and updated guidelines
  const knowledge = (function () {
    // Source of truth: HubDB table hcfm_chatbot_kb (id 282697845)
    // Server-rendered into hidden <template> tags inside #hcfm-bot-kb-host
    var host = document.getElementById('hcfm-bot-kb-host');
    if (!host) return [];
    var templates = host.querySelectorAll('template[data-keywords]');
    var rows = [];
    for (var i = 0; i < templates.length; i++) {
      var t = templates[i];
      var kw = (t.getAttribute('data-keywords') || '').split(',').map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean);
      var ans = (t.innerHTML || '').trim();
      if (kw.length && ans) rows.push({ q: kw, a: ans });
    }
    return rows;
  })();


  // ---------- Synonym dictionary: maps user-language to KB-language ----------
  // When a user types something to the left, the matcher also tries the right.
  const SYNONYMS = {
    'reel': 'instagram',
    'reels': 'instagram',
    'story': 'instagram',
    'stories': 'instagram',
    'cover': 'thumbnail',
    'pic': 'image',
    'picture': 'image',
    'photograph': 'photography',
    'photos': 'photography',
    'pics': 'photography',
    'colour': 'color',
    'colours': 'colors',
    'mistake': 'misuse',
    'wrong': 'misuse',
    'rules': 'rule',
    'broken': 'misuse',
    'rule': 'guideline',
    'allowed': 'approved',
    'forbidden': 'avoid',
    'cannot': 'never',
    "can't": 'never',
    'permit': 'allow',
    'modify': 'edit',
    'change': 'edit',
    'tweak': 'edit',
    'adjust': 'edit',
    'add stroke': 'stroke outline',
    'outline': 'stroke',
    'border': 'stroke',
    'big': 'size',
    'small': 'size',
    'tiny': 'minimum size',
    'huge': 'maximum size',
    'partner': 'co-branding',
    'co brand': 'co-branding',
    'cobrand': 'co-branding',
    'campaign': 'special campaign',
    'social media': 'social',
    'fb': 'facebook',
    'ig': 'instagram',
    'twitter': 'x twitter',
    'x': 'x twitter',
    'youtube': 'youtube thumbnail',
    'tagalog': 'translation',
    'filipino': 'translation',
    'french': 'translation',
    'spanish': 'translation',
    'portuguese': 'translation',
    'swahili': 'translation',
    'kiswahili': 'translation',
    'language': 'translation',
    'africa': 'east africa',
    'east africa': 'east africa kenya uganda tanzania',
    'kenya': 'east africa kenya',
    'uganda': 'east africa uganda',
    'tanzania': 'east africa tanzania',
    'philippines': 'philippines',
    'pinas': 'philippines',
    'manila': 'philippines',
    'parish': 'ministry center',
    'parishes': 'ministry centers',
    'how do i': '',
    "how can i": '',
    'where do i': '',
    'where can i': '',
    'what is': '',
    "what's": '',
    'should i': '',
    'do i': '',
    'i want to': '',
    'i need': ''
  };

  // Cheap stemmer, strip common suffixes so 'reels' matches 'reel' etc.
  function stem(w) {
    return w.replace(/(ies|ied|ying|ing|ed|es|s|ly)$/i, '');
  }

  // Expand a query: lowercase, apply synonym substitutions, then split into stem-tokens.
  function tokenize(q) {
    let s = ' ' + q.toLowerCase() + ' ';
    // Apply 2-word and 1-word synonym substitutions
    for (const [from, to] of Object.entries(SYNONYMS)) {
      const re = new RegExp(`\\b${from}\\b`, 'g');
      s = s.replace(re, ' ' + to + ' ');
    }
    return s.split(/[^a-z0-9]+/).filter(Boolean).map(stem);
  }

  // Return all matches ranked by score so the caller can decide single-vs-multi.
  function rankMatches(q) {
    if (!q || !q.trim()) return [];
    const userTokens = tokenize(q);
    if (!userTokens.length) return [];
    const scored = [];
    for (const k of knowledge) {
      let score = 0;
      for (const term of k.q) {
        const termTokens = tokenize(term);
        if ((' ' + userTokens.join(' ') + ' ').includes(' ' + termTokens.join(' ') + ' ')) {
          score += term.length * 2;
        }
        for (const t of termTokens) {
          if (t.length < 2) continue;
          if (userTokens.includes(t)) score += t.length;
        }
      }
      if (score >= 6) scored.push({ k, score });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored;
  }

  // Single-best wrapper kept for backwards compatibility callers.
  function answerQuestion(q) {
    const matches = rankMatches(q);
    if (!matches.length) return null;
    return { answer: matches[0].k.a, key: matches[0].k.q[0] };
  }

  // Parse an answer HTML to extract authored followups (embedded by v3 push
  // as <div class="chat-followups-data" data-followups="a|b|c">). Returns
  // { cleanHTML, followups[] }. Falls back to keyword-similarity neighbours
  // when no authored list is present.
  function parseAnswer(answerHTML) {
    if (!answerHTML) return { cleanHTML: '', followups: [] };
    const m = answerHTML.match(/<div class="chat-followups-data"[^>]*data-followups="([^"]*)"[^>]*><\/div>\s*$/i);
    if (!m) return { cleanHTML: answerHTML, followups: [] };
    const followups = m[1].split('|').map(s => s.trim()).filter(Boolean);
    const cleanHTML = answerHTML.replace(m[0], '').trim();
    return { cleanHTML, followups };
  }

  // Suggest follow-up questions: prefer the authored list embedded in the
  // answer; fall back to keyword-overlap neighbours. Filter out anything
  // the user has already asked this session.
  function suggestFollowUps(matchedKey, authoredList) {
    let candidates = [];
    if (authoredList && authoredList.length) {
      candidates = authoredList.slice();
    } else if (matchedKey) {
      const matchedTokens = tokenize(matchedKey);
      const scored = knowledge.map(k => {
        const kTokens = tokenize(k.q[0]);
        let s = 0;
        for (const t of kTokens) if (matchedTokens.includes(t)) s++;
        return { k, s };
      }).filter(x => x.s > 0 && x.k.q[0] !== matchedKey)
        .sort((a, b) => b.s - a.s)
        .slice(0, 4);
      candidates = scored.map(x => x.k.q[0]);
    }
    // Drop anything the user already asked, then dedupe case-insensitively.
    const seen = new Set();
    const out = [];
    for (const c of candidates) {
      const lc = c.toLowerCase();
      if (chatSession.askedKeys.has(lc)) continue;
      if (seen.has(lc)) continue;
      seen.add(lc);
      out.push(c);
      if (out.length >= 4) break;
    }
    return out;
  }

  // -------- SESSION STATE --------
  // Tracks what the user has already asked + topic thread. No identity
  // capture, this is the industry-standard help-bot pattern. Persisted to
  // sessionStorage so dedup and topic-aware preface survive reloads.
  const chatSession = (function () {
    let saved = {};
    try { saved = JSON.parse(sessionStorage.getItem('hcfm-chat-session') || '{}'); } catch {}
    return {
      askedKeys: new Set(saved.askedKeys || []),
      topics: saved.topics || [],  // ordered list of matched-entry primary keywords
    };
  })();

  function persistSession() {
    try {
      sessionStorage.setItem('hcfm-chat-session', JSON.stringify({
        askedKeys: Array.from(chatSession.askedKeys),
        topics: chatSession.topics,
      }));
    } catch {}
  }

  function rememberTopic(matchedKey) {
    if (!matchedKey) return;
    const k = matchedKey.toLowerCase();
    chatSession.askedKeys.add(k);
    chatSession.topics.push(matchedKey);
    if (chatSession.topics.length > 12) chatSession.topics.shift();
    persistSession();
  }

  // Stopword set for preface, these are too generic to count as "real" overlap.
  const PREFACE_STOP = new Set([
    'why', 'rule', 'rules', 'use', 'used', 'using', 'design', 'system', 'brand',
    'one', 'two', 'three', 'where', 'what', 'how', 'when', 'who',
    'color', 'colors', 'font', 'fonts', 'logo', 'logos', 'image', 'images',
  ]);

  // Manual topic-relatedness clusters, semantic links the stem-overlap
  // matcher can't catch (e.g. "playlist script" ↔ "typography" are related
  // but share no stems).
  const TOPIC_CLUSTERS = [
    ['yellow gold', 'muted gold', 'blue yellow', 'simplified palette', 'hcfm blue', 'marian blue', '60-30-10', 'dark', 'ab test'],
    ['playlist script', 'three fonts', 'whitney', 'calluna', 'typography', 'two fonts'],
    ['10 beads', 'symbol', 'mark', 'rosary', 'family of prayer', 'floral', 'marian', 'mary'],
    ['narrative voice', 'two voice', 'voice', 'tone', 'donor', 'social caption'],
    ['real not stock', 'photography', 'imagery', 'dark overlay', 'thin border'],
    ['digital first', 'platform dimensions', 'social media', 'mobile', 'younger generations'],
    ['same brand globally', 'simplified palette', 'ministry centers', 'translation', 'regional'],
    ['this brand page', 'sharepoint', 'support', 'who maintains', 'why portal'],
  ];

  // Build a "this connects to earlier" preface when the new topic relates
  // to an earlier one, either by non-stopword stem overlap (≥1) or by
  // appearing in the same TOPIC_CLUSTERS group. Returns "" when nothing fits.
  // Note: this runs BEFORE rememberTopic() so chatSession.topics contains only
  // prior topics, not the current one. We need ≥1 prior topic to compare against.
  function buildPreface(matchedKey) {
    if (!matchedKey || chatSession.topics.length < 1) return '';
    const newTokens = tokenize(matchedKey).filter(t => !PREFACE_STOP.has(t) && t.length > 2);
    if (!newTokens.length) return '';
    // Walk earlier topics newest-first so the preface references the MOST recent
    // related topic (more conversational than digging up the first one).
    for (let i = chatSession.topics.length - 1; i >= 0; i--) {
      const t = chatSession.topics[i];
      if (t.toLowerCase() === matchedKey.toLowerCase()) continue;
      const tTokens = tokenize(t).filter(x => !PREFACE_STOP.has(x) && x.length > 2);
      // Path 1: shared real (non-stopword) stem
      const overlap = newTokens.filter(x => tTokens.includes(x)).length;
      if (overlap >= 1) {
        return `This connects to what you asked earlier about <em>${t}</em>.`;
      }
      // Path 2: same topic cluster
      const newLower = matchedKey.toLowerCase();
      const oldLower = t.toLowerCase();
      for (const cluster of TOPIC_CLUSTERS) {
        const newIn = cluster.some(c => newLower.includes(c));
        const oldIn = cluster.some(c => oldLower.includes(c));
        if (newIn && oldIn) {
          return `This builds on what you asked earlier about <em>${t}</em>.`;
        }
      }
    }
    return '';
  }

  function addChatMessage(text, isUser, opts = {}) {
    if (!chatBody) return;
    const div = document.createElement('div');
    div.className = `chat-msg chat-msg-${isUser ? 'user' : 'bot'}`;
    // Don't wrap block-level HTML (the v3 rich answers are already <p>…</p><p>…</p>).
    // Wrap only plain-text or inline-only content.
    const looksBlock = /^\s*<(p|div|ul|ol|h\d|table|blockquote)\b/i.test(text);
    let html = looksBlock ? text : `<p>${text}</p>`;
    if (opts.preface) {
      // Small leading callout that connects to earlier conversation
      html = `<p class="chat-preface">${opts.preface}</p>` + html;
    }
    if (opts.followUps && opts.followUps.length) {
      html += `<div class="chat-followups">`;
      if (opts.followUpsLabel) {
        html += `<p class="chat-followups-h">${opts.followUpsLabel}</p>`;
      }
      for (const f of opts.followUps) {
        const label = f.charAt(0).toUpperCase() + f.slice(1);
        html += `<button class="chat-pill" data-q="${f.replace(/"/g, '&quot;')}">${label}</button>`;
      }
      html += `</div>`;
    }
    if (opts.confirm) {
      // Comprehension check, gives the user a way to say "that didn't land" without
      // typing. The Yes/No queries are handled by the conversational KB entries
      // (priority 204/205 in the v2 expansion).
      html += `<div class="chat-confirm">
        <p class="chat-confirm-h">Did that answer your question?</p>
        <button class="chat-pill chat-pill-confirm" data-q="yes that helped">Yes, thanks</button>
        <button class="chat-pill chat-pill-confirm" data-q="not quite, can you try again">Not quite</button>
      </div>`;
    }
    if (opts.escalate) {
      html += `<div class="chat-escalate">
        <p class="chat-escalate-h">Want a human to take this?</p>
        <p class="chat-escalate-p">Send Victoria and Emmanuel a quick message, they reply within two business days.</p>
        <button class="chat-escalate-btn" id="chatEscalateBtn">Email Victoria & Emmanuel →</button>
      </div>`;
    }
    div.innerHTML = html;
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
    persistChat();
  }

  function persistChat() {
    if (!chatBody) return;
    try { sessionStorage.setItem('hcfm-chat-history', chatBody.innerHTML); } catch {}
  }

  function restoreChat() {
    if (!chatBody) return;
    try {
      const saved = sessionStorage.getItem('hcfm-chat-history');
      if (saved) {
        chatBody.innerHTML = saved;
        chatBody.scrollTop = chatBody.scrollHeight;
      }
    } catch {}
  }
  restoreChat();

  function handleChatQuery(query) {
    if (!query || !query.trim()) return;
    addChatMessage(query, true);
    const matches = rankMatches(query);

    setTimeout(() => {
      if (!matches.length) {
        addChatMessage(
          `I don't have a confident answer for that yet. I cover <em>colors, fonts, logos, voice, photography, design elements, ministries, downloads, transition, password</em>, plus the <em>why</em> behind the 2026 changes. Try one of those topics, or send Victoria and Emmanuel a direct question below.`,
          false,
          { escalate: true }
        );
        return;
      }

      const top = matches[0];
      const parsed = parseAnswer(top.k.a);
      let renderedAnswer = parsed.cleanHTML || top.k.a;
      let authoredFollowups = parsed.followups;

      // ---- Multi-match synthesizer ----
      // If a second match scored within 60% of the top score AND it covers a
      // distinct primary keyword, surface it as a "this also connects to…" teaser.
      let synthesizedTeaser = '';
      if (matches.length > 1) {
        const second = matches[1];
        const secondKey = second.k.q[0];
        if (second.score >= top.score * 0.6 && !chatSession.askedKeys.has(secondKey.toLowerCase())) {
          synthesizedTeaser = `<p class="chat-synth"><strong>Related angle:</strong> this question also overlaps with <em>${secondKey}</em>. <button class="chat-pill chat-pill-inline" data-q="${secondKey.replace(/"/g, '&quot;')}">Read that next →</button></p>`;
        }
      }

      // ---- Topic-aware preface ----
      const preface = buildPreface(top.k.q[0]);

      // ---- Conversational detector, short, casual greeting responses ----
      const isConversational = renderedAnswer && renderedAnswer.length < 200
        && /^(glad|got it|hi ,|anytime|i'm a brand|if you want a person|sure\.|fair\.|definitely|welcome\.|bookmark)/i.test(
            renderedAnswer.replace(/<[^>]+>/g, '').trim()
          );

      // ---- Compose the rendered HTML ----
      let finalHTML = renderedAnswer;
      if (synthesizedTeaser) finalHTML = finalHTML + synthesizedTeaser;

      const followUps = suggestFollowUps(top.k.q[0], authoredFollowups);

      addChatMessage(finalHTML, false, {
        preface: preface || undefined,
        followUps,
        followUpsLabel: followUps.length ? 'You might also want to know:' : undefined,
        confirm: !isConversational,
      });

      rememberTopic(top.k.q[0]);
    }, 280);
  }

  if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = chatInput.value.trim();
      if (!q) return;
      handleChatQuery(q);
      chatInput.value = '';
    });
  }

  document.addEventListener('click', (e) => {
    const pill = e.target.closest('.chat-pill');
    if (pill && pill.dataset.q) handleChatQuery(pill.dataset.q);
    if (e.target.closest('#chatEscalateBtn')) showEscalateForm();
  });

  // Embedded escalation form, keeps the user inside the chat
  function showEscalateForm() {
    if (!chatBody) return;
    const div = document.createElement('div');
    div.className = 'chat-msg chat-msg-bot chat-form-msg';
    div.innerHTML = `
      <p><strong>Send Victoria & Emmanuel a question</strong></p>
      <form class="chat-mini-form" id="chatEscalateForm">
        <input type="text" name="name" placeholder="Your name" required>
        <input type="email" name="email" placeholder="Your email" required>
        <textarea name="message" placeholder="Your question or request" rows="3" required></textarea>
        <button type="submit" class="btn btn-primary">Send →</button>
      </form>`;
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
    const f = div.querySelector('#chatEscalateForm');
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(f);
      const subject = encodeURIComponent('HCFM Brand · question from chat');
      const body = encodeURIComponent(
        `From: ${fd.get('name')} <${fd.get('email')}>\n\n${fd.get('message')}\n\n, Sent from the brand portal chat`
      );
      window.location.href = `mailto:vhassan@hcfm.org,eepau@hcfm.org?subject=${subject}&body=${body}`;
      addChatMessage('Thanks. Your email client should be opening with the message pre-filled. Send it from there and we will reply within two business days.', false);
      f.querySelectorAll('input, textarea, button').forEach(el => el.disabled = true);
    });
    persistChat();
  }

  /* ---------- Help-page forms (asset request + feedback) ----------
     Both forms use the same JS-driven mailto pattern as the chatbot escalate
     form: no `action` attribute on the <form>, no `mailto:` form action that
     Chrome flags as insecure and turns autofill off for. Instead, on submit
     we build a structured mailto link with the form data and open the user's
     email client. The form fields have proper `autocomplete` attributes so
     Chrome behaves cleanly. */
  function wireHelpForm(formId, subject, bodyBuilder, recipients) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      // Manual required-field check (we set `novalidate` on the form so we can
      // control the UX, but we still want to require the same fields).
      const required = Array.from(form.querySelectorAll('[required]'));
      const missing = required.filter(el => !(el.value || '').trim());
      if (missing.length) {
        missing[0].focus();
        showToast('Please fill in all required fields.');
        return;
      }
      const fd = new FormData(form);
      const body = bodyBuilder(fd);
      const url = `mailto:${recipients}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = url;
      // Show a confirmation message under the button, same UX as chat escalate
      const foot = form.querySelector('.form-foot');
      if (foot) {
        foot.innerHTML = '<strong>✓ Your email client should be opening.</strong> Hit send from there and we’ll reply within two business days.';
        foot.style.color = 'var(--hcfm-blue)';
      }
      form.querySelectorAll('input, textarea, select, button').forEach(el => { el.disabled = true; });
    });
  }

  wireHelpForm('requestForm', 'HCFM Brand · Asset request',
    (fd) => (
      `From: ${fd.get('name')} <${fd.get('email')}>\n` +
      `Ministry: ${fd.get('ministry')}\n\n` +
      `${fd.get('request')}\n\n` +
      `, Sent from the HCFM Brand Portal asset-request form`
    ),
    'vhassan@hcfm.org,eepau@hcfm.org');

  /* Note: the feedback form now hyperlinks to the existing Microsoft Forms
     feedback channel (same one ministry centers already use). No JS handler
     needed, it's just an anchor tag with target="_blank". */

  /* ---------- Language switcher placeholder ---------- */
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('lang-active')) return;
      showToast(`${btn.textContent} translation in progress. Coming soon.`);
    });
  });

  /* ---------- Lazy-load images ---------- */
  document.querySelectorAll('img').forEach(img => {
    if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
  });

})();
