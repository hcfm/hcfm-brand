/* HCFM Brand Portal — Theme: _hcfm-brand-portal
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

  // Manifest of actual file paths per ministry — loaded from JSON
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
    // HCFM Foundation override — use parent HCFM Logotype 2 Blue
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

  fetch('https://275132.fs1.hubspotusercontent-na1.net/hubfs/275132/_hcfm-brand/assets/ministry-manifest.json')
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
      // the manifest is available. Safe to call multiple times — function is idempotent.
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
  }

  function showPage(id) {
    pages.forEach(p => p.classList.toggle('active', p.id === id));
  }

  window.addEventListener('hashchange', () => setRoute(location.hash));
  setRoute(location.hash);

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

  /* ---------- Sidebar search ---------- */
  const search = document.getElementById('search');
  if (search) {
    search.addEventListener('input', () => {
      const q = search.value.trim().toLowerCase();
      navLinks.forEach(a => {
        const visible = !q || a.textContent.toLowerCase().includes(q);
        a.style.display = visible ? '' : 'none';
      });
      document.querySelectorAll('.nav-group').forEach(g => {
        const anyVisible = Array.from(g.querySelectorAll('a')).some(a => a.style.display !== 'none');
        const label = g.querySelector('.nav-group-label');
        if (label) label.style.display = anyVisible ? '' : 'none';
      });
    });
  }

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

  function renderMinistryDetail(m) {
    const nameEl = document.getElementById('mdName');
    const h1 = document.getElementById('mdH1');
    const intro = document.getElementById('mdIntro');
    const gallery = document.getElementById('mdGallery');
    if (!nameEl || !gallery) return;

    nameEl.textContent = m.name;
    h1.textContent = m.name;
    intro.innerHTML = `<strong>${m.region}.</strong> Logo gallery for this ministry. Below: each variant with a color preview. To download production files (PNG and JPG only), go to <a href="#downloads">Resources / Downloads</a> with your access password.`;

    // HCFM Foundation uses the parent HCFM logos directly (the wordmark is
    // 'Holy Cross Family Ministries' with no 'Foundation' suffix added).
    const isFoundation = m.code === FOUNDATION_CODE;
    if (isFoundation) {
      intro.innerHTML += `<p style="margin-top:12px;font-size:13px;color:var(--text-muted);"><em>The HCFM Foundation uses the parent Holy Cross Family Ministries logo as its identity. The wordmark does not include "Foundation".</em></p>`;
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

    gallery.innerHTML = `
      <div class="md-ministry-hero">
        <img src="assets/logos/hcfm-symbol-blue.png" alt="">
        <div>
          <h2>${m.name}</h2>
          <p>${m.region} · Code: ${m.code}</p>
        </div>
      </div>
      ${groups.map(g => {
        // Folder name is e.g. "HCFM_KE_Logotype1", "FamRosary_Logotype1", or
        // for Foundation override "HCFM_Logotype1" pointing at the parent.
        const ltLabel = g.folder.replace(/.*(Logotype\d)/, '$1').replace('Logotype', 'Logotype ');
        const groupBase = g.basePath ? `${g.basePath}/${encodeURIComponent(g.folder)}` : `${previewBase}/${encodeURIComponent(g.folder)}`;
        const variantsHtml = g.files.map(file => {
          const v = variantLabelFromFile(file);
          const path = `${groupBase}/${file}`;
          return `
            <div class="md-variant">
              <div class="md-variant-bg ${v.dark ? 'dark' : ''}">
                <img src="${path}" alt="${v.label}" loading="lazy">
              </div>
              <p class="md-variant-name">${v.label}</p>
            </div>
          `;
        }).join('');
        return `
          <h3 class="md-section-title">${ltLabel}</h3>
          <div class="md-variants-grid">${variantsHtml}</div>
        `;
      }).join('')}

      <div class="info-block">
        <h3>Download production files</h3>
        <p>PNG and JPG packs for ${m.name} are available on the <a href="#downloads">Downloads tab</a> after you enter the access password. Editable AI source files are restricted to brand owners.</p>
      </div>
    `;
  }

  /* ---------- Downloads: 3-tier hybrid gate ----------
     Tier 0 (public): Brand documents — always visible, no gate.
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

  function isTier1Unlocked() {
    return (window.HCFM_MEMBERSHIP && window.HCFM_MEMBERSHIP.hasMinistry)
        || sessionStorage.getItem(TIER1_STORAGE_KEY) === '1';
  }

  function renderTier1ContentIfNeeded() {
    // Only render once per page load — the underlying functions are also idempotent.
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
    const isTier1Tab = ['parent', 'ministries', 'fonts'].includes(target);
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

  /* ---------- Parent gallery (PNG/JPG only — no AI files publicly) ---------- */
  function renderParentGallery() {
    const el = document.getElementById('parentGallery');
    if (!el) return;

    const groups = [
      {
        title: 'HCFM Symbol',
        sub: 'The mark alone',
        zip: `${RELEASE_BASE}/parent/HCFM_Symbol_SOURCE.zip`,
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
        title: 'Logotype 1 — Horizontal',
        sub: 'Mark left, wordmark right (single line)',
        zip: `${RELEASE_BASE}/parent/HCFM_Logotype1_SOURCE.zip`,
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
        title: 'Logotype 2 — Stacked',
        sub: 'Mark on top, wordmark on two lines below',
        zip: `${RELEASE_BASE}/parent/HCFM_Logotype2_SOURCE.zip`,
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
        title: 'Logotype 3 — Compact stacked',
        sub: 'Mark on top with a smaller wordmark',
        zip: `${RELEASE_BASE}/parent/HCFM_Logotype3_SOURCE.zip`,
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
        title: 'Logotype 4 — Single line',
        sub: 'Mark with full wordmark on a single line',
        zip: `${RELEASE_BASE}/parent/HCFM_Logotype4_SOURCE.zip`,
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

    el.innerHTML = `
      <article class="dl-gallery-item dl-gallery-item-feature">
        <div class="dl-gallery-head">
          <div>
            <h3>HCFM Parent Pack</h3>
            <p>Everything: Symbol + all 4 Logotypes, all colors, PNG and JPG. 12 MB.</p>
          </div>
          <a href="${RELEASE_BASE}/parent/HCFM_Parent_SOURCE_Pack.zip" class="btn btn-primary">Download all <span class="btn-meta">12 MB</span></a>
        </div>
        <div class="dl-variants dl-variants-feature">
          ${featuredPreviews.map(v => `
            <div class="dl-variant ${v.dark ? 'dark' : ''}">
              <img src="assets/previews/parent/${v.folder}/${v.file}" alt="${v.label}" loading="lazy" onerror="this.style.opacity='0.3'">
              <span class="dl-variant-name">${v.label}</span>
            </div>
          `).join('')}
        </div>
        <div class="dl-gallery-foot">
          <span class="dl-link">A representative sample. Download to see every variant in every color across all 5 configurations.</span>
        </div>
      </article>
    ` + groups.map(g => `
      <article class="dl-gallery-item">
        <div class="dl-gallery-head">
          <div>
            <h3>${g.title}</h3>
            <p>${g.sub}</p>
          </div>
          <a href="${g.zip}" download class="btn btn-primary">Download <span class="btn-meta">${g.zipSize}</span></a>
        </div>
        <div class="dl-variants">
          ${g.variants.map(v => `
            <div class="dl-variant ${v.dark ? 'dark' : ''}">
              <img src="assets/previews/parent/${g.folder}/${v.file}" alt="${v.label}" loading="lazy" onerror="this.style.opacity='0.3'">
              <span class="dl-variant-name">${v.label}</span>
            </div>
          `).join('')}
        </div>
        <div class="dl-gallery-foot">
          <span class="dl-link">PNG and JPG variants included. Source files (AI / EPS) are brand-owner restricted.</span>
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
      setTimeout(() => chatInput && chatInput.focus(), 300);
      // First open this session: trigger the name-greeting flow if we haven't
      // already collected the user's name. Only fires when chat body is empty
      // (so we don't repeat the intro every time the panel is reopened).
      setTimeout(() => {
        if (chatBody && chatBody.children.length === 0 && chatSession.onboardStep === 0) {
          addChatMessage(
            `<p>Hi — I'm the HCFM brand-portal assistant. I can explain the 2026 system, the science behind the color changes, voice and tone, where to download assets, and how to handle specific ministry-center scenarios.</p><p>Before we start, <strong>what should I call you?</strong></p>`,
            false
          );
        }
      }, 350);
    }
  }
  function closeChat() {
    if (chatPanel) {
      chatPanel.classList.remove('open');
      chatPanel.setAttribute('aria-hidden', 'true');
    }
  }
  if (chatFab) chatFab.addEventListener('click', openChat);
  if (chatClose) chatClose.addEventListener('click', closeChat);

  // Knowledge base — pulled from the actual brand book and updated guidelines
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

  // Cheap stemmer — strip common suffixes so 'reels' matches 'reel' etc.
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
    // Drop anything the user already asked.
    return candidates.filter(c => !chatSession.askedKeys.has(c.toLowerCase())).slice(0, 4);
  }

  // -------- SESSION STATE --------
  // Tracks what the user has already asked, their name/role if collected,
  // and the topic thread. Persisted to sessionStorage so it survives reload.
  const chatSession = (function () {
    let saved = {};
    try { saved = JSON.parse(sessionStorage.getItem('hcfm-chat-session') || '{}'); } catch {}
    return {
      name: saved.name || null,
      role: saved.role || null,
      onboardStep: saved.onboardStep || 0,  // 0=ask name, 1=ask role, 2=done
      askedKeys: new Set(saved.askedKeys || []),
      askedKeysOrder: saved.askedKeysOrder || [],
      topics: saved.topics || [],  // ordered list of matched-entry primary keywords
    };
  })();

  function persistSession() {
    try {
      sessionStorage.setItem('hcfm-chat-session', JSON.stringify({
        name: chatSession.name,
        role: chatSession.role,
        onboardStep: chatSession.onboardStep,
        askedKeys: Array.from(chatSession.askedKeys),
        askedKeysOrder: chatSession.askedKeysOrder,
        topics: chatSession.topics,
      }));
    } catch {}
  }

  function rememberTopic(matchedKey) {
    if (!matchedKey) return;
    const k = matchedKey.toLowerCase();
    chatSession.askedKeys.add(k);
    chatSession.askedKeysOrder.push(k);
    chatSession.topics.push(matchedKey);
    if (chatSession.topics.length > 12) chatSession.topics.shift();
    persistSession();
  }

  // Build a "this connects to earlier" preface when the new topic relates
  // to an earlier one. Returns "" when no good connection.
  function buildPreface(matchedKey) {
    if (!matchedKey || chatSession.topics.length < 2) return '';
    const newTokens = tokenize(matchedKey);
    // Look for any earlier topic (other than current) that shares 2+ stems.
    for (let i = chatSession.topics.length - 2; i >= 0; i--) {
      const t = chatSession.topics[i];
      if (t.toLowerCase() === matchedKey.toLowerCase()) continue;
      const tTokens = tokenize(t);
      const overlap = newTokens.filter(x => tTokens.includes(x)).length;
      if (overlap >= 2) {
        const name = chatSession.name ? chatSession.name + ', ' : '';
        return `${name}this connects to what you asked earlier about <em>${t}</em>.`;
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
      // Comprehension check — gives the user a way to say "that didn't land" without
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
        <p class="chat-escalate-p">Send Victoria and Emmanuel a quick message — they reply within two business days.</p>
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

  // -------- NAME / ROLE GREETING FLOW --------
  // First time the chat is opened, run a 2-step intro: name → role → ready.
  // This makes the first 30 seconds feel personal instead of transactional.
  function handleOnboardStep(rawInput) {
    const trimmed = (rawInput || '').trim();
    if (chatSession.onboardStep === 0) {
      // Expect a name
      // Strip lead phrases like "my name is" / "i'm" / "i am"
      let name = trimmed.replace(/^(my name is|i am|i'm|im|this is|call me)\s+/i, '');
      // Take first capitalized word (or first word) — keep it simple
      name = name.split(/[,;.\n]/)[0].trim();
      // Capitalize first letter for display
      if (name.length > 0) name = name.charAt(0).toUpperCase() + name.slice(1);
      // Sanity cap
      if (name.length > 40) name = name.slice(0, 40);
      chatSession.name = name || 'friend';
      chatSession.onboardStep = 1;
      persistSession();
      addChatMessage(
        `<p>Good to meet you, <strong>${chatSession.name}</strong>. One more thing — what's your role with HCFM? (e.g. <em>marketing lead in the Philippines</em>, <em>designer at Easton</em>, <em>vendor</em>, <em>ministry-center director</em>). I'll tailor my answers to your context.</p>`,
        false
      );
      return;
    }
    if (chatSession.onboardStep === 1) {
      chatSession.role = trimmed.slice(0, 120);
      chatSession.onboardStep = 2;
      persistSession();
      const roleHint = chatSession.role && chatSession.role.length > 2 ? ` Got it — I'll keep "<em>${chatSession.role}</em>" in mind when I answer.` : '';
      addChatMessage(
        `<p>Thanks, ${chatSession.name}.${roleHint} Ask me anything about the HCFM brand — colors, fonts, logos, voice, the science behind why we made the 2026 changes, where to download assets, how to handle a specific ministry-center situation. I'm happy to go deep on any of it.</p>`,
        false,
        { followUps: [
            'why did we move from muted gold to yellow gold',
            'why is HCFM blue 0047BB',
            'how do I use Playlist Script',
            'where do I download logos',
          ],
          followUpsLabel: 'A good place to start:',
        }
      );
      return;
    }
  }

  function handleChatQuery(query) {
    if (!query || !query.trim()) return;
    addChatMessage(query, true);

    // First-touch flow: name + role
    if (chatSession.onboardStep < 2) {
      setTimeout(() => handleOnboardStep(query), 220);
      return;
    }

    const matches = rankMatches(query);

    setTimeout(() => {
      if (!matches.length) {
        const namePrefix = chatSession.name ? `${chatSession.name}, ` : '';
        addChatMessage(
          `${namePrefix}I don't have a confident answer for that yet. I cover <em>colors, fonts, logos, voice, photography, design elements, ministries, downloads, transition, password</em>, plus the <em>why</em> behind the 2026 changes. Try one of those topics — or send Victoria and Emmanuel a direct question below.`,
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

      // ---- Conversational detector — short, casual greeting responses ----
      const isConversational = renderedAnswer && renderedAnswer.length < 200
        && /^(glad|got it|hi —|anytime|i'm a brand|if you want a person|sure\.|fair\.|definitely|welcome\.|bookmark)/i.test(
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

  // Embedded escalation form — keeps the user inside the chat
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
        `From: ${fd.get('name')} <${fd.get('email')}>\n\n${fd.get('message')}\n\n— Sent from the brand portal chat`
      );
      window.location.href = `mailto:vhassan@hcfm.org,eepau@hcfm.org?subject=${subject}&body=${body}`;
      addChatMessage('Thanks. Your email client should be opening with the message pre-filled. Send it from there and we will reply within two business days.', false);
      f.querySelectorAll('input, textarea, button').forEach(el => el.disabled = true);
    });
    persistChat();
  }

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
