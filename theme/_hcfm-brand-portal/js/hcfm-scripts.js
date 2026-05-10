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
      // If the downloads page is unlocked and showing the ministry tab, refresh that too
      if (sessionStorage.getItem('hcfm-dl-unlocked') === '1') {
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

  /* ---------- Downloads: dual-gate (ministry + admin) ---------- */
  const dlGate = document.getElementById('dlGate');
  const dlContent = document.getElementById('dlContent');
  const dlForm = document.getElementById('dlGateForm');
  const dlPassword = document.getElementById('dlPassword');
  const sourceTab = document.getElementById('sourceTab');

  const STORAGE_KEY = 'hcfm-dl-unlocked';
  const ADMIN_KEY = 'hcfm-dl-admin';

  // Two passwords: ministry-tier vs admin-tier
  const MINISTRY_PASSWORDS = ['hcfm2026', 'eastoncreatives', 'familyrosary'];
  const ADMIN_PASSWORDS = ['emmyvictoria', 'brandowners', 'eastonadmin'];

  // Release base for heavy ZIPs hosted on GitHub Releases — declared early so
  // the auto-unlock path below can use it (avoids temporal dead zone).
  const RELEASE_BASE = 'https://275132.fs1.hubspotusercontent-na1.net/hubfs/275132/_hcfm-brand/downloads/source-files';

  function unlockDownloads() {
    if (dlGate) dlGate.hidden = true;
    if (dlContent) dlContent.hidden = false;
    sessionStorage.setItem(STORAGE_KEY, '1');
    renderParentGallery();
    renderDlMinistryGrid();
    renderSourceMinistryList();
  }

  function unlockAdmin() {
    if (sourceTab) sourceTab.hidden = false;
    sessionStorage.setItem(ADMIN_KEY, '1');
    document.body.classList.add('admin-active');
  }

  if (dlForm) {
    dlForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = (dlPassword.value || '').trim().toLowerCase();
      if (ADMIN_PASSWORDS.includes(value)) {
        unlockDownloads();
        unlockAdmin();
        showToast('Brand-owner access granted. Source Files tab unlocked.');
      } else if (MINISTRY_PASSWORDS.includes(value)) {
        unlockDownloads();
        showToast('Access granted');
      } else {
        showToast('Wrong password. Email victoria@ or eepau@ to request access.');
        dlPassword.value = '';
      }
    });
  }

  // Tabs inside Downloads
  document.querySelectorAll('.dl-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.dlTab;
      document.querySelectorAll('.dl-tab').forEach(t => t.classList.toggle('active', t === tab));
      document.querySelectorAll('.dl-pane').forEach(p => p.classList.toggle('active', p.dataset.dlPane === target));
    });
  });

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

  /* ---------- Auto-unlock on page load if sessionStorage has the keys ----------
     This MUST run AFTER renderParentGallery / renderDlMinistryGrid / renderSourceMinistryList
     are defined, because unlockDownloads() calls all three. Placed here to guarantee
     hoisting/temporal-dead-zone safety for any const dependencies. */
  if (sessionStorage.getItem(STORAGE_KEY) === '1') {
    unlockDownloads();
    if (sessionStorage.getItem(ADMIN_KEY) === '1') unlockAdmin();
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

  function answerQuestion(q) {
    if (!q || !q.trim()) return null;
    const userTokens = tokenize(q);
    if (!userTokens.length) return null;
    let best = null;
    let bestScore = 0;
    for (const k of knowledge) {
      let score = 0;
      for (const term of k.q) {
        const termTokens = tokenize(term);
        // Substring match on the full term (existing behavior, scaled by length)
        if ((' ' + userTokens.join(' ') + ' ').includes(' ' + termTokens.join(' ') + ' ')) {
          score += term.length * 2;
        }
        // Token-level overlap — every shared stem adds points
        for (const t of termTokens) {
          if (t.length < 2) continue;
          if (userTokens.includes(t)) score += t.length;
        }
      }
      if (score > bestScore) { bestScore = score; best = k; }
    }
    // Threshold: require a minimum confidence to avoid false matches.
    if (best && bestScore >= 6) return { answer: best.a, key: best.q[0] };
    return null;
  }

  // Suggested follow-up questions per topic — surfaces RELATED entries
  // by matching the matched-entry's keywords against neighbour entries.
  function suggestFollowUps(matchedKey) {
    if (!matchedKey) return [];
    const matchedTokens = tokenize(matchedKey);
    const scored = knowledge.map(k => {
      const kTokens = tokenize(k.q[0]);
      let s = 0;
      for (const t of kTokens) if (matchedTokens.includes(t)) s++;
      return { k, s };
    }).filter(x => x.s > 0 && x.k.q[0] !== matchedKey)
      .sort((a, b) => b.s - a.s)
      .slice(0, 3);
    return scored.map(x => x.k.q[0]);
  }

  function addChatMessage(text, isUser, opts = {}) {
    if (!chatBody) return;
    const div = document.createElement('div');
    div.className = `chat-msg chat-msg-${isUser ? 'user' : 'bot'}`;
    let html = `<p>${text}</p>`;
    if (opts.followUps && opts.followUps.length) {
      html += `<div class="chat-followups">`;
      for (const f of opts.followUps) {
        const label = f.charAt(0).toUpperCase() + f.slice(1);
        html += `<button class="chat-pill" data-q="${f.replace(/"/g, '&quot;')}">${label}</button>`;
      }
      html += `</div>`;
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

  function handleChatQuery(query) {
    if (!query || !query.trim()) return;
    addChatMessage(query, true);
    const result = answerQuestion(query);
    setTimeout(() => {
      if (result) {
        const followUps = suggestFollowUps(result.key);
        addChatMessage(result.answer, false, { followUps });
      } else {
        addChatMessage(
          `I don't have a confident answer for that. The brand book covers <em>colors, fonts, logos, voice, photography, design elements, ministries, downloads, transition, password</em>. Try one of those topics — or send Victoria and Emmanuel a direct question below.`,
          false,
          { escalate: true }
        );
      }
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
