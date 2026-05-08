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
  const ministries = [
    { code: '02_HCFM_Foundation',     name: 'HCFM Foundation',                      region: 'Easton, MA' },
    { code: '03_FamRosary',           name: 'Family Rosary',                        region: 'Easton, MA' },
    { code: '03A_CatholicMom',        name: 'Catholic Mom',                         region: 'Easton, MA' },
    { code: '03B_MusFamPrayer',       name: 'Museum of Family Prayer',              region: 'Easton, MA' },
    { code: '04_FamThtrProdns',       name: 'Family Theater Productions',           region: 'Hollywood, CA' },
    { code: '05_PeytonInstDCL',       name: 'Peyton Institute · Domestic Church',   region: 'Easton, MA' },
    { code: '06_FP_PrayerGuild',      name: 'Father Peyton Prayer Guild',           region: 'Easton, MA' },
    { code: '07_FamRosaryCrusade_PH', name: 'Family Rosary Crusade',                region: 'Philippines' },
    { code: '08_FP_Centre_IE',        name: 'Father Peyton Centre',                 region: 'Ireland' },
    { code: '09_FP_FamiIyInst',       name: 'Father Peyton Family Institute',       region: 'Easton, MA' },
    { code: '10_HCFM_BD',             name: 'HCFM Bangladesh',                      region: 'Bangladesh' },
    { code: '11_HCFM_CA',             name: 'HCFM Canada',                          region: 'Canada' },
    { code: '12_HCFM_FR',             name: 'HCFM France',                          region: 'France' },
    { code: '13_HCFM_GH',             name: 'HCFM Ghana',                           region: 'Ghana' },
    { code: '14_HCFM_IN',             name: 'HCFM India',                           region: 'India' },
    { code: '15_HCFM_KE',             name: 'HCFM Kenya',                           region: 'Kenya' },
    { code: '16_HCFM_TZ',             name: 'HCFM Tanzania',                        region: 'Tanzania' },
    { code: '17_HCFM_UG',             name: 'HCFM Uganda',                          region: 'Uganda' },
    { code: '18_HCFM_UY',             name: 'HCFM Uruguay',                         region: 'Uruguay' },
    { code: '19_INFAM_PE',            name: 'INFAM Perú',                           region: 'Peru' },
    { code: '20_RosarioFam_BR',       name: 'Rosário em Família',                   region: 'Brasil' },
    { code: '21_RosarioFam_CL',       name: 'Rosario en Familia',                   region: 'Chile' },
    { code: '22_RosarioFam_MX',       name: 'Rosario en Familia',                   region: 'México' },
    { code: '23_RosarioFam_PE',       name: 'Rosario en Familia',                   region: 'Perú' }
  ];

  // Manifest of actual file paths per ministry — loaded from JSON
  let ministryManifest = {};

  fetch('assets/ministry-manifest.json')
    .then(r => r.json())
    .then(data => {
      ministryManifest = data;
      // If we are already on a ministry detail route, re-render now that manifest is loaded
      if (location.hash.startsWith('#ministry/')) {
        const code = location.hash.split('/')[1];
        const m = ministries.find(x => x.code === code);
        if (m) renderMinistryDetail(m);
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
  const grid = document.getElementById('ministryGrid');
  if (grid) {
    grid.innerHTML = ministries.map(m => `
      <a class="ministry-card" href="#ministry/${m.code}">
        <img src="assets/logos/hcfm-symbol-blue.png" alt="" class="ministry-mark">
        <p class="ministry-name">${m.name}</p>
        <p class="ministry-region">${m.region.toUpperCase()}</p>
        <span class="ministry-cta">View logos →</span>
      </a>
    `).join('');
  }

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

    const groups = ministryManifest[m.code] || [];
    const previewBase = `assets/previews/ministries/${encodeURIComponent(m.code)}`;

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
        // Folder name is e.g. "HCFM_KE_Logotype1", "FamRosary_Logotype1"
        const ltLabel = g.folder.replace(/.*_(Logotype\d)/, '$1').replace('Logotype', 'Logotype ');
        const variantsHtml = g.files.map(file => {
          const v = variantLabelFromFile(file);
          const path = `${previewBase}/${encodeURIComponent(g.folder)}/${file}`;
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
  }

  if (sessionStorage.getItem(STORAGE_KEY) === '1') {
    unlockDownloads();
    if (sessionStorage.getItem(ADMIN_KEY) === '1') unlockAdmin();
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
  const RELEASE_BASE = 'https://github.com/EmmanuelEpau/hcfm-brand/releases/download/v1.0-assets';

  function renderParentGallery() {
    const el = document.getElementById('parentGallery');
    if (!el) return;

    const groups = [
      {
        title: 'HCFM Symbol',
        sub: 'The mark alone',
        zip: `${RELEASE_BASE}/HCFM_Symbol.zip`,
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
        zip: `${RELEASE_BASE}/HCFM_Logotype1.zip`,
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
        zip: `${RELEASE_BASE}/HCFM_Logotype2.zip`,
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
        zip: `${RELEASE_BASE}/HCFM_Logotype3.zip`,
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
        zip: `${RELEASE_BASE}/HCFM_Logotype4.zip`,
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

    el.innerHTML = `
      <article class="dl-gallery-item dl-gallery-item-feature">
        <div class="dl-gallery-head">
          <div>
            <h3>HCFM Parent Pack</h3>
            <p>Everything: Symbol + all 4 Logotypes, all colors, PNG and JPG. 12 MB.</p>
          </div>
          <a href="${RELEASE_BASE}/HCFM_Parent_Pack.zip" class="btn btn-primary">Download all <span class="btn-meta">12 MB</span></a>
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
        <img src="assets/logos/hcfm-symbol-blue.png" alt="">
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
      <li><a href="${RELEASE_BASE}/${m.code}_SOURCE.zip"><strong>${m.name}</strong><span>${m.region} · ZIP · AI / JPG / PNG</span></a></li>
    `).join('');
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
    setTimeout(() => { if (lightboxImg) lightboxImg.src = ''; }, 200);
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
  const knowledge = [
    // ---------- Colors ----------
    { q: ['primary color', 'primary palette', 'primary'], a: '<strong>Three primary colors:</strong> Black (#000000) is the foundation, HCFM Blue (#0047BB / Pantone 2728C) is the identifier, Yellow Gold (#FFB500 / Pantone 7549C) is the energy.' },
    { q: ['secondary color', 'accent', 'accent palette'], a: '<strong>Three secondary colors:</strong> Marian Blue (#00A9E0 / 2995C) pairs with Playlist Script. Muted Gold (#89764B / 871C) is for print and donor materials. White is for text on dark backgrounds.' },
    { q: ['liturgical', 'lent', 'advent', 'pentecost', 'ordinary time', 'extended'], a: '<strong>Extended palette:</strong> Purple (#5F259F) for Lent, Advent, and penitential themes. Red (#CF3339) for Pentecost, martyrs, Sacred Heart. Green (#3A913F) for Ordinary Time, growth, creation care.' },
    { q: ['hcfm blue', 'pantone 2728', 'brand blue', 'identifier blue'], a: '<strong>HCFM Blue.</strong> Hex #0047BB · RGB 0/71/187 · Pantone 2728C. The brand identifier — the logo, the mark, formal letterhead, official documents, website headers. Use sparingly outside those moments so it stays meaningful.' },
    { q: ['yellow gold', 'pantone 7549', 'gold hex', 'ffb500'], a: '<strong>Yellow Gold.</strong> Hex #FFB500 · RGB 255/181/0 · Pantone 7549C. The energy color. Headlines on dark backgrounds, call-to-action buttons, accent borders, Playlist Script, icons that need to pop. Never for body text on white.' },
    { q: ['marian blue', 'pantone 2995', 'sky blue', 'light blue'], a: '<strong>Marian Blue.</strong> Hex #00A9E0 · RGB 0/169/224 · Pantone 2995C. Pairs with Playlist Script. Closely associated with Mary — gentleness, presence, guidance. The brand book sometimes calls this "Light Blue" — same color.' },
    { q: ['muted gold', 'pantone 871', 'old gold', '89764b'], a: '<strong>Muted Gold.</strong> Hex #89764B · RGB 137/118/75 · Pantone 871C. The reverent gold. Print, formal, donor materials, certificates. Symbolizes sacredness in traditional, devotional contexts.' },
    { q: ['black', 'foundation color', '000000'], a: '<strong>Black (#000000).</strong> Process Black. Your workhorse. The primary background that lets every other brand color shine. Use it for social graphics, video thumbnails, and as a 40 to 70 percent overlay on photos.' },
    { q: ['white', 'ffffff', 'breathing space'], a: '<strong>White (#FFFFFF).</strong> Visual rest and balance. The space between things. Use white as text on dark, and as negative space to let content breathe.' },
    { q: ['yellow gold vs muted gold', 'when use muted gold', 'two golds', 'gold difference'], a: '<strong>Simple rule:</strong> If it is on a screen, use Yellow Gold. If it is for donors, on a certificate, or in formal print, consider Muted Gold. Yellow Gold is digital and energetic. Muted Gold is traditional and reverent. The two golds are not interchangeable.' },
    { q: ['yellow gold body text', 'gold on white', 'accessibility', 'contrast'], a: 'Never use Yellow Gold for body text on white. Yellow Gold on white is 1.9:1 contrast — fails WCAG AA. Use Yellow Gold for headlines and accents only on dark backgrounds.' },
    { q: ['contrast', 'wcag', 'readable', 'accessibility ratio'], a: '<strong>WCAG AA</strong> requires 4.5:1 for body text, 3:1 for large text. <strong>HCFM Blue on White:</strong> 8.6:1 (AAA). <strong>White on HCFM Blue:</strong> 8.6:1 (AAA). <strong>Yellow Gold on Black:</strong> 11.7:1 (AAA). <strong>Yellow Gold on White:</strong> 1.9:1 (FAILS).' },
    { q: ['light blue', 'why marian'], a: '"Light Blue" in the 2026 brand book and "Marian Blue" in the Visual Identity deck refer to the same color (#00A9E0). Going forward, we standardize on "Marian Blue" because it carries the Marian meaning explicitly.' },
    { q: ['extended palette', 'do not use', 'old colors'], a: 'The old SharePoint extended palette (red, orange, dark green, magenta, light pink, sage, etc. — 14 colors total) is deprecated. The 2026 system is six colors only: 4 primary, 2 accent, plus three liturgical (Purple, Red, Green) for seasonal use.' },

    // ---------- Logos ----------
    { q: ['mark vs logo', 'mark or logo', 'difference mark logo', 'symbol vs logo'], a: '<strong>The Mark</strong> is the symbol alone. Use when space is small or the audience already knows HCFM (favicons, profile pictures, watermarks). <strong>The Logo</strong> is the symbol with "Holy Cross Family Ministries." Use when introducing HCFM, or for official documents.' },
    { q: ['logotype 1', 'horizontal', 'wide layout'], a: '<strong>Logotype 1 — Horizontal.</strong> Mark left, wordmark right on a single horizontal line. Best for wide layouts: web headers, document headers, email signatures.' },
    { q: ['logotype 2', 'stacked'], a: '<strong>Logotype 2 — Stacked.</strong> Mark on top, wordmark on two lines below. The default formal version. Use on letterhead, certificates, official documents.' },
    { q: ['logotype 3', 'compact stacked'], a: '<strong>Logotype 3 — Compact stacked.</strong> Mark on top with a smaller wordmark. For tight spaces where the stacked version is too tall but you still need full identification.' },
    { q: ['logotype 4', 'single line', 'narrow'], a: '<strong>Logotype 4 — Single line.</strong> Mark with the full wordmark on a single line. Use in narrow horizontal contexts: footers, banners, sign-off blocks.' },
    { q: ['logo download', 'where logo', 'download logo', 'get logo'], a: 'Logo files are gated on the <a href="#downloads">Downloads tab</a>. Public packs include PNG and JPG only. Editable AI source files are restricted to brand owners (Victoria and Emmanuel). Email vhassan@hcfm.org or eepau@hcfm.org for access.' },
    { q: ['ai file', 'editable', 'illustrator', 'source file', 'eps'], a: 'AI / EPS / editable source files are restricted to the brand owners (Victoria and Emmanuel). This is intentional: a single canonical source keeps every ministry-center logo identical. If you need a custom edit, request it through the Help tab.' },
    { q: ['minimum size', 'logo size', 'how small'], a: 'Mark alone: 5/16 inch (7.94 mm) print, 150 px web. Wordmark "FAMILY MINISTRIES" cap height: 1/16 inch (1.59 mm). Below these sizes, legibility breaks.' },
    { q: ['clear space', 'free space', 'margin around logo'], a: 'Clear space around the mark equals the height of one prayer-person bead in the mark itself. Keep that minimum margin on all four sides — never let other elements crowd inside it.' },
    { q: ['logo do not', 'misuse', 'never do', 'logo rule'], a: '<strong>Never:</strong> stretch or distort the logo · use colors outside the approved palette · substitute fonts on the wordmark · add drop shadows, glows, or 3D · add strokes or outlines · crop in a way that obscures the form · rotate the mark · place on busy backgrounds without an overlay.' },
    { q: ['file format', 'svg', 'png', 'jpg'], a: 'Public logo packs include <strong>PNG and JPG</strong> only. SVG, EPS, and AI are brand-owner restricted. If you need a specific format we have not packaged (vector outlines, white-only PDF, etc.), request through the Help page.' },
    { q: ['favicon', 'profile picture', 'small'], a: 'For favicons and social profile pictures, use the <strong>Mark alone</strong> (just the symbol, no wordmark). Render at 800px+ and export down to platform sizes. Approved colors: HCFM Blue or Yellow Gold on white, or White on HCFM Blue.' },

    // ---------- Symbol meaning ----------
    { q: ['symbol meaning', 'what does symbol', 'meaning of mark', 'mark layers'], a: 'The HCFM symbol carries five layers of meaning: <br>1. <strong>10 Beads of the Rosary</strong> — totality and unity.<br>2. <strong>A Family of Prayer</strong> — each shape is a person in prayer.<br>3. <strong>Floral Character</strong> — Rose, Lily, Iris (symbolic of Mary).<br>4. <strong>Moon and Light</strong> — center white space emits light.<br>5. <strong>Welcome and Invitation</strong> — radiates outward.' },
    { q: ['10 beads', 'ten beads', 'rosary beads', 'why ten'], a: 'The mark is composed of 10 interconnected shapes — a reference to the 10 beads of a Rosary decade. The design represents <em>totality</em> and <em>unity</em>: family members of every kind brought together in prayer, and the continuous rhythm of prayer lived daily, not occasionally.' },
    { q: ['family of prayer', 'person', 'figure'], a: 'Each shape in the mark represents a person in prayer — hands raised or folded. The ten shapes together form a united family. No single shape stands alone; each depends on the others. Family prayer strengthens relationships and faith.' },
    { q: ['floral', 'rose', 'lily', 'iris', 'mary connection'], a: 'The mark expresses a floral character — Rose, Lily, Iris, all flowers symbolic of the Virgin Mary. The petal-like shape of each unit is intentional. When you let your eye soften, the mark reads less like ten beads and more like a flower in full bloom.' },
    { q: ['moon', 'light center', 'white space mark'], a: 'The white space at the heart of the mark creates an optical effect that seems to emit light — a reference to the moon. In Catholic iconography, Mary is often shown standing on the moon, clothed in light. The mark carries that imagery without ever drawing it literally.' },
    { q: ['welcome', 'invitation', 'mission', 'outward'], a: 'The symbol radiates outward by design. HCFM is not inward-facing — we are mission-driven, actively reaching out to families across cultures and communities. The careful delineation of form also suggests the sense of mystery associated with the work of the Holy Spirit.' },

    // ---------- Typography ----------
    { q: ['font', 'typography', 'fonts list'], a: 'HCFM uses three fonts. <strong>Whitney</strong> for headlines (sans-serif, 6 weights). <strong>Calluna</strong> for body text (serif, 4 weights). <strong>Playlist Script</strong> for decorative single words (Yellow Gold, White, or Marian Blue only).' },
    { q: ['body text', 'body font', 'paragraph font'], a: 'Use <strong>Calluna</strong> for body text. A serif font that reflects tradition, depth, and reflection. Calluna is for paragraphs, prayer text, reflections, and formal documents. Available weights: Regular, Italic, Semibold, Bold.' },
    { q: ['headline', 'header', 'display font'], a: 'Use <strong>Whitney</strong> for headlines, subheadings, and short text. Six weights are available: Light, Book, Medium, Semibold, Bold, Black. Whitney is clean, modern, and highly readable.' },
    { q: ['playlist script', 'script font', 'decorative font'], a: '<strong>Playlist Script rules:</strong> Single words or short phrases only (3–4 words max). One element per design. Yellow Gold, White, or Marian Blue only. Never at small sizes (under 18px screen / 14pt print). Never for body text.' },
    { q: ['whitney', 'sans serif'], a: '<strong>Whitney</strong> is HCFM\'s display sans-serif. Designed by Hoefler & Frere-Jones. Six weights: Light, Book, Medium, Semibold, Bold, Black. Use for headlines, navigation, buttons, callouts, captions, labels — anywhere clarity at a glance matters.' },
    { q: ['calluna', 'serif font'], a: '<strong>Calluna</strong> is HCFM\'s body serif. Designed by Jos Buivenga. Four weights: Regular, Italic, Semibold, Bold. Use for paragraphs, prayer text, reflections, letterhead body, donor letters, and anywhere a serif\'s warmth is appropriate.' },
    { q: ['times roman', 'times new roman'], a: 'Avoid Times Roman / Times New Roman. The older SharePoint guidance suggesting Times Roman for letter body is superseded — use Calluna instead. Calluna carries the warmth Times Roman lacks.' },
    { q: ['font download', 'where font', 'get fonts'], a: 'Font files are on the <a href="#downloads">Downloads tab</a> under the Fonts pane. Whitney pack (368 KB), Calluna pack (252 KB), Playlist Script (52 KB), or all three in one HCFM Font Pack (660 KB).' },
    { q: ['font pairing', 'combination', 'mix fonts'], a: 'Default pairing: <strong>Whitney + Calluna</strong> (headline + body). For hero moments, campaign covers, donor letters, and feast-day communications, add Playlist Script for one decorative word: <strong>Whitney + Playlist Script + Calluna</strong>.' },

    // ---------- Voice ----------
    { q: ['voice', 'tone', 'how to write'], a: 'HCFM has two registers. <strong>For the faithful:</strong> reverent, warm, family-first, narrative, named-not-abstract. <strong>For vendors:</strong> specific, direct, practical, documented. The family is the hero, prayer is the language, we are the support.' },
    { q: ['we say', 'preferred phrase', 'always say'], a: '<strong>We say:</strong> "The family that prays together stays together." (Father Peyton\'s actual phrase.) "Holy Cross Family Ministries" spelled out on first reference, "HCFM" after. "Venerable Patrick Peyton, C.S.C." with title and order on first reference. "Father Peyton" on second reference. Country names by name.' },
    { q: ['we avoid', 'never say', 'do not say'], a: '<strong>We avoid:</strong> theological jargon where plain English works. "Intercessory familial communion" when we mean family prayer. "Stakeholders" or "audience segments" for the people we serve. Hyperbole — we do not "transform lives." Generic mission language. Acronyms before they are spelled out.' },
    { q: ['donor letter', 'how donor letter'], a: 'Donor letters: warm, grateful, named. Open with "Dear friends in Christ," or "Dear [Name]," and reference something specific the donor has supported. Calluna for body. Sign with full name and title.' },
    { q: ['social caption', 'caption tone'], a: 'Social captions: plain, devotional, short. "Today, we honor the Holy Name of Jesus…" works better than "Join us as we celebrate…" Aim for 1–2 sentences plus a closing prayer or question.' },

    // ---------- Imagery ----------
    { q: ['imagery', 'photography', 'photo categories'], a: 'Five sample categories of photography: Father Patrick Peyton, ministry-center culture, Marian imagery, family prayer, Rosary imagery. Use high-quality images only. Apply dark overlays when text goes over a photo. Choose real over staged.' },
    { q: ['rule of thirds'], a: '<strong>Rule of thirds:</strong> divide the image into nine equal parts with two vertical and two horizontal lines. Place the main subject at the intersections or along the lines to create a balanced scene.' },
    { q: ['leading lines'], a: '<strong>Leading lines:</strong> use natural elements (rivers, roads, pathways) or man-made elements (fences, walls, staircases) to create a visual path that guides the viewer\'s eye to the subject.' },
    { q: ['frame within frame'], a: '<strong>Frame within a frame:</strong> use natural elements like trees or rocks, or man-made objects like windows and doorways, to draw attention to the subject. Adds depth and visual interest.' },
    { q: ['filling the frame'], a: '<strong>Filling the frame:</strong> move closer to the subject. The focus falls on facial expression and details that would otherwise be missed. Bonus: distracting backgrounds disappear.' },
    { q: ['shot list', 'event photography'], a: 'For HCFM events: shoot details (signs, programs, branded items), venue (before and during), attendees (candid emotional shots — both close-up and wide), speakers and special guests. A shot list separates a recap from a memory.' },
    { q: ['stock photography', 'staged photo'], a: 'Avoid stock photography. Choose real over staged: real families, real prayer, real local context. The image must reflect HCFM\'s actual mission, not a generic "international" aesthetic.' },

    // ---------- Design Elements ----------
    { q: ['design element', 'border', 'fade', 'curve'], a: 'Four approved design elements: <strong>Thin Border</strong> (3-4 px max), <strong>Color Fade Effect</strong> (brand colors only), <strong>Curved Shapes</strong>, <strong>Dark Overlays</strong>. Use only one or two per design.' },
    { q: ['thin border'], a: '<strong>Thin Border:</strong> a 3–4 pixel frame in a brand color. Most often Muted Gold for traditional, reverent contexts. Yellow Gold for digital and energetic applications. Where it works: certificate edges, donor cards, prayer-card edges, formal invitations.' },
    { q: ['color fade', 'gradient'], a: '<strong>Color Fade Effect:</strong> a gradient using only brand-palette colors. Yellow Gold to Black is the digital default. HCFM Blue to White works for formal moments. Never introduce outside colors into a brand fade.' },
    { q: ['dark overlay', 'photo overlay opacity'], a: '<strong>Dark Overlays:</strong> black transparent layer on photos to make text readable. Adjust opacity by eye — light images with sparse text need 40 to 50 percent, busy images with longer copy need 60 to 70 percent. The rule is readability, not a number.' },
    { q: ['60-30-10', 'sixty thirty ten', 'color ratio'], a: 'The 60-30-10 rule: 60% dominant color (background), 30% secondary (supporting), 10% accent (highlights). Sometimes 70-20-10 or 80-10-10 is better. The point is intentional hierarchy: one color leading, the others playing their part.' },

    // ---------- Stationery ----------
    { q: ['stationery', 'letterhead', 'business card', 'envelope'], a: 'Print specs: Letterhead 8.5×11 in on Strathmore 24# Bright White Wove with Pantone 871U + 2728U inks. Business card 3.5×2 in on Strathmore 130# DTC Cover. #10 envelope 9.5×4.125 in on the same letterhead stock. Mailing label 5.625×4 in on Crack-n-Peel.' },
    { q: ['letterhead template', 'word template'], a: 'Editable Word letterhead templates exist for the parent ministry and six sub-ministries (Catholic Mom, Family Rosary, Family Theater Productions, Father Peyton Prayer Guild, Museum of Family Prayer, plus the parent HCFM letterhead). Available on the <a href="#downloads">Downloads tab</a>.' },
    { q: ['easton address', 'mailing address'], a: 'HCFM Easton headquarters: <strong>508 Washington Street, North Easton, MA 02356, USA.</strong>' },

    // ---------- Platform / dimensions ----------
    { q: ['instagram size', 'instagram post', 'instagram dimensions'], a: '<strong>Instagram:</strong> static portrait 1080×1350 px · Reel/Story 1080×1920 px. Use exactly these dimensions — designs that fall short get cropped, designs that overshoot get downsized awkwardly.' },
    { q: ['facebook size', 'facebook dimensions'], a: '<strong>Facebook:</strong> static portrait 1080×1350 px · video (feed) 1280×720 px · Reels 1080×1920 px.' },
    { q: ['linkedin size', 'linkedin dimensions'], a: '<strong>LinkedIn:</strong> static image 1200×627 px · portrait image 1080×1350 px.' },
    { q: ['twitter', 'x size', 'x dimensions'], a: '<strong>X (Twitter):</strong> static image 1200×675 px.' },
    { q: ['youtube thumbnail', 'youtube size'], a: '<strong>YouTube:</strong> thumbnail 1280×720 px (16:9 ratio).' },

    // ---------- Ministry centers ----------
    { q: ['ministry center', 'sub ministry', 'ministries list'], a: 'HCFM has 24 ministry centers across 18 countries on 6 continents. The <a href="#ministries">Ministry Centers tab</a> lists every one with its logo gallery. Each click opens that ministry\'s logo pack.' },
    { q: ['family rosary'], a: 'Family Rosary is the founding ministry of HCFM, based in Easton, MA. Father Peyton\'s original Rosary Crusade has grown into a global ministry through Family Rosary Crusade chapters in the Philippines, Latin America, Ireland, and beyond.' },
    { q: ['father peyton', 'venerable patrick peyton', 'founder'], a: 'Venerable Patrick Peyton, C.S.C. (1909–1992) founded Holy Cross Family Ministries. His phrase "The family that prays together stays together" anchors HCFM\'s mission. "Father Peyton" on second reference, never just "Patrick."' },
    { q: ['catholic mom'], a: 'Catholic Mom is one of HCFM\'s digital ministries based in Easton, MA. Logo pack is available in the <a href="#ministries">Ministry Centers</a> directory.' },
    { q: ['museum of family prayer'], a: 'The Museum of Family Prayer in Easton, MA preserves and celebrates the heritage of Father Peyton\'s mission and the broader history of Catholic family prayer.' },
    { q: ['family theater productions'], a: 'Family Theater Productions, based in Hollywood, CA, is HCFM\'s media arm. Founded by Father Peyton and led today by Father David Guffey, C.S.C.' },

    // ---------- Pre-flight / process ----------
    { q: ['preflight', 'pre-flight', 'checklist', 'before publish'], a: 'Run through the <a href="#checklist">Pre-flight Checklist</a> before you publish. Four sections: Colors, Fonts, Design Elements, Platform. Most common ship-blockers: Yellow Gold body text on white (fails contrast), too many design elements (clutter), wrong platform dimensions (cropping).' },
    { q: ['review my work', 'who reviews', 'check my design'], a: 'Email <a href="mailto:vhassan@hcfm.org">vhassan@hcfm.org</a> or <a href="mailto:eepau@hcfm.org">eepau@hcfm.org</a> before you ship anything you are unsure about. No charge, no formal request process. Turnaround is typically two business days.' },
    { q: ['co-branding', 'partner logo', 'two logos'], a: 'Email Victoria or Emmanuel before producing any co-branded materials. There are specific rules for partner logos relative to the HCFM mark, lock-up patterns, and approval requirements.' },
    { q: ['report misuse', 'wrong use'], a: 'Email Victoria or Emmanuel with a screenshot or link. We follow up directly. If the misuse is from outside HCFM (vendors, third parties), we handle it through the standard cease-and-desist process.' },

    // ---------- Resources / process ----------
    { q: ['contact', 'email', 'help'], a: 'Email <a href="mailto:vhassan@hcfm.org">vhassan@hcfm.org</a> (Victoria Hassan) or <a href="mailto:eepau@hcfm.org">eepau@hcfm.org</a> (Emmanuel Epau). Either inbox is fine — both forms on the Help page go to both of us.' },
    { q: ['password', 'access', 'unlock'], a: 'Brand asset downloads are gated. Email Victoria or Emmanuel to request the access password. Source files (AI) are restricted to brand owners.' },
    { q: ['transition', 'deadline', '2026 system'], a: 'All ministry centers are expected to transition to the 2026 system. No hard deadline. New materials use the new system. Existing materials phase out over 6–12 months.' },
    { q: ['translation', 'french', 'spanish', 'portuguese', 'swahili'], a: 'French, Spanish, Portuguese, and Swahili translations are in progress. Until they are published, ministry centers should use the English version and ask Easton for clarification.' },
    { q: ['who maintains', 'who owns brand', 'easton creatives'], a: 'The HCFM brand system is maintained by Easton Creatives — Victoria Hassan and Emmanuel Epau. We are based at the parent ministry headquarters in North Easton, MA. Any update to the brand book or this brand portal flows through us.' },
    { q: ['why changed', 'why update', 'why new system'], a: 'The 2026 system simplified the palette from 20 colors to 6, elevated Yellow Gold to primary (over Muted Gold) for digital, and added Playlist Script as a decorative third typeface. The changes responded to ministry-center feedback and produced measurably stronger engagement on social platforms.' },

    // ---------- WHY: color theory & psychology ----------
    { q: ['complementary colors', 'opposite colors', 'why blue and yellow work', 'color wheel'], a: 'Blue and Yellow Gold are <strong>complementary colors</strong> — they sit on opposite sides of the color wheel. The brain processes complementary pairs faster than any other combination because each color makes the other appear more vibrant. That neurological speed is exactly what you want when you have two seconds to stop a scroll.' },
    { q: ['why blue yellow', 'ikea best buy walmart', 'industry blue yellow'], a: 'Blue + Yellow appears in IKEA, Best Buy, and Walmart for a reason: <strong>Blue signals trust, reliability, stability. Yellow signals energy, warmth, optimism.</strong> Together they communicate "dependable and exciting at the same time." That exact signal is also what a faith-based ministry needs — trustworthy enough to support, alive enough to engage.' },
    { q: ['gestalt', 'figure ground', 'how brain processes color'], a: '<strong>Figure-ground perception</strong> (a Gestalt principle) is how the brain separates foreground from background. The higher the contrast, the faster the separation. On social media — fractions of a second to decide — high contrast lets the brain do its job in the smallest possible time. A dark background with high-contrast Yellow Gold is the easiest job a scrolling brain can be given.' },
    { q: ['why yellow on black', 'gold on black', 'high contrast'], a: 'Yellow Gold on Black gives a <strong>contrast ratio of 11.7:1</strong> — passes WCAG AAA standards. The same Yellow Gold on HCFM Blue is only 4.5:1 — passes AA but is roughly 2.5x less visible. Black gives Yellow Gold maximum punch. That punch matters in a feed.' },
    { q: ['why dark', 'why black background', 'dark mode'], a: '<strong>More than 80% of users browse with dark mode on.</strong> Black backgrounds are not just an aesthetic choice — they are how most families actually experience content on their phones. Designing for dark backgrounds means designing for how people are already consuming content. There is also an accessibility win: every HCFM brand color (Yellow Gold, White, Marian Blue) passes AAA contrast on Black.' },
    { q: ['attention vs affinity', 'stop scroll vs trust', 'engagement quality'], a: 'There are two kinds of color performance. <strong>Attention metrics</strong> (does it stop the scroll?) and <strong>affinity metrics</strong> (does it earn trust and a share?). High-contrast colors stop the scroll. But a color that grabs attention without inspiring trust hurts mission engagement. The HCFM system threads the needle: dark backgrounds for scroll-stop, Marian Blue and warm Calluna prose for the trust that follows.' },

    // ---------- WHY: 60-30-10 ----------
    { q: ['why 60-30-10', 'color hierarchy why', 'why one color leads'], a: '60-30-10 works because <strong>when every color fights for equal attention, the eye doesn\'t know where to land.</strong> The whole composition feels busy and you can\'t put your finger on why. Letting one color dominate (60%), one support (30%), and one accent (10%) gives the eye a clear path. Sometimes 70-20-10 or 80-10-10 is better — the principle is intentional hierarchy, not exact percentages.' },
    { q: ['where does 60-30-10 come from', 'origin of rule'], a: 'The 60-30-10 rule is a classic principle that shows up across design fields — interior decorating, fashion, graphic design. It is not an HCFM invention. We adopted it because it makes color decisions reproducible: any HCFM creative can audit a design by asking "is one color clearly leading?" If the answer is yes and the leader is a brand color, the design is on track.' },

    // ---------- WHY: Yellow Gold over Muted Gold (digital) ----------
    { q: ['why yellow gold primary', 'why elevated yellow gold', 'gold change 2026'], a: 'In 2026 we elevated Yellow Gold (#FFB500 / Pantone 7549C) to primary for digital. <strong>Why:</strong> Muted Gold (#89764B) is reverent and traditional but lacks scroll-stopping power on small screens. Yellow Gold has the brightness and saturation digital feeds reward. Muted Gold remains the right choice for print, donor materials, and certificates — the two golds serve different registers.' },
    { q: ['muted gold problem', 'why not muted gold digital'], a: 'Muted Gold (#89764B) is beautiful in print, but on social feeds it reads as olive or brown — too muted to register at a glance. Plus its contrast on white is only 3.4:1 (fails WCAG AA for body text). Yellow Gold solves both problems while keeping the gold metaphor that anchors HCFM\'s brand to liturgical glory.' },

    // ---------- WHY: Marian Blue & HCFM Blue ----------
    { q: ['why blue mary', 'mary blue tradition', 'why marian blue'], a: 'The association of Blue with the Virgin Mary dates to the <strong>12th century</strong>, when blue pigment (lapis lazuli) was the most expensive available — reserved for the most sacred subjects. The convention spread across Europe and remains universal in Catholic iconography. Marian Blue (#00A9E0) carries that history without needing to draw it.' },
    { q: ['why blue support not lead', 'blue 10 percent digital', 'blue accent'], a: 'In digital, Blue is calm — it signals trust and reliability. <strong>But calm doesn\'t stop a scroll.</strong> Yellow Gold on Black grabs first. Once attention is captured, Blue keeps the viewer engaged. That\'s why Blue plays a 10% accent role digitally — links, secondary buttons, dividers — and a much larger role in print where attention is already given. The roles flip by medium.' },
    { q: ['why hcfm blue 0047bb', 'pantone 2728 reason'], a: 'HCFM Blue (#0047BB / Pantone 2728C) was selected because it is <strong>a saturated, confident blue</strong> — strong enough to anchor formal materials but not so dark it loses warmth. It tests well across cultures, has no negative national associations, and pairs naturally with both Yellow Gold (energetic) and White (formal).' },

    // ---------- WHY: cross-cultural color ----------
    { q: ['black culture mourning', 'east africa black', 'death color'], a: 'In <strong>East Africa</strong>, black clothing outside formal settings can trigger bereavement associations. Black-bordered or desaturated images are a recognized social-media death-announcement convention. We design knowing this: dark backgrounds with bright HCFM colors on top read as energetic, not somber. The presence of Yellow Gold and White prevents the misread.' },
    { q: ['philippines black', 'asia color culture'], a: 'In the <strong>Philippines</strong>, Black carries traditional mourning weight but is moderated by Western media influence. Urban audiences read black as fashion or elegance. Older and rural audiences keep stronger funeral associations. The dark-with-Yellow-Gold combination reads as modern and confident, not mournful — but ministry centers should match imagery to local reading.' },
    { q: ['uganda yellow', 'east africa yellow gold', 'political color'], a: 'In <strong>Uganda</strong>, Yellow is the color of the NRM party that has held power 35+ years. For Ugandans, yellow can read as political before brand. East Africa ministry centers should be aware. We don\'t change the brand for it — we use Yellow Gold sparingly in those contexts and lean on Black + White + HCFM Blue when the political read is a risk.' },
    { q: ['ireland color', 'europe culture'], a: 'In <strong>Ireland</strong>, black is normalized everyday dress — the mourning association is present but doesn\'t dominate. Marian Blue carries strong devotional weight given Ireland\'s Catholic heritage. The full HCFM palette translates cleanly there.' },
    { q: ['why same brand globally', 'brand consistency vs culture', 'fragmentation'], a: 'Research from Bottomley and Doyle (2006) found that <strong>brand consistency with appropriate connotations matters more than locale-specific palette switching.</strong> If we let every market pick its own colors, we fragment back to the state we started from. The right answer is one global system applied with cultural awareness — adjusting how we use the palette, not what is in the palette.' },

    // ---------- WHY: WCAG / contrast ----------
    { q: ['wcag aa', 'contrast ratio explanation'], a: 'WCAG AA is the global accessibility standard. <strong>Body text needs 4.5:1 contrast.</strong> Large text (18px+ or 14px+ bold) needs 3:1. AAA is the higher tier — 7:1 for body. HCFM Blue on White is 8.6:1 (AAA). Yellow Gold on White is 1.9:1 (fails AA). White on HCFM Blue is 8.6:1 (AAA). Yellow Gold on Black is 11.7:1 (AAA).' },
    { q: ['why never gold body text', 'gold readability'], a: 'Yellow Gold body text on white is <strong>1.9:1 contrast — far below the 4.5:1 WCAG AA minimum for body text.</strong> The text technically appears, but a quarter of readers cannot read it confidently — including older eyes, mild colorblindness, low-light viewing, and any photo-overlay context. Yellow Gold is for headlines and accents only. On dark backgrounds, it sings.' },
    { q: ['blue on blue', 'marian blue on hcfm blue'], a: 'Marian Blue on HCFM Blue scores <strong>2.96:1</strong> — fails WCAG AA entirely. The two blues live in the same family and lose distinction when stacked. Use White or Yellow Gold on HCFM Blue instead. Reserve Marian Blue for accents on Black or White.' },

    // ---------- WHY: Playlist Script rules ----------
    { q: ['why playlist script rules', 'why strict colors script'], a: 'Playlist Script\'s elegance comes from <strong>specific letterform thicknesses and curves</strong> that only render legibly in a narrow band of colors. Yellow Gold, White, and Marian Blue all have enough lightness contrast against dark backgrounds to preserve those curves. Other colors flatten the strokes and make the script look messy. We tested others — they don\'t hold up.' },
    { q: ['why script single words', 'short phrases playlist'], a: 'Script fonts <strong>lose readability quickly the longer they get.</strong> A single word in Playlist Script reads as elegant. A full sentence reads as decorative noise. Think of Playlist Script as seasoning — just the right amount elevates a dish, too much overwhelms it. Three to four words maximum, one element per design.' },

    // ---------- WHY: Whitney & Calluna ----------
    { q: ['why whitney', 'whitney choice reason'], a: '<strong>Whitney</strong> (Hoefler & Frere-Jones) was chosen because it is humanist sans-serif — clean and modern but warm, not cold like Helvetica or geometric like Futura. It scales from a 12px label to an 84px display headline without losing character. Six weights give us range from a quiet caption to a confident hero. Whitney does brand work that pure-geometric sans cannot do.' },
    { q: ['why calluna', 'calluna body text choice'], a: '<strong>Calluna</strong> (Jos Buivenga) is a serif designed for long-form reading. Its serifs reflect tradition, depth, and reflection — exactly the register a faith ministry needs for prayer text, donor letters, and reflections. Calluna is also remarkably readable at small sizes, which matters because most HCFM body text appears on phones.' },
    { q: ['why three fonts', 'why not one font'], a: 'Three fonts give three registers. <strong>Whitney</strong> is the workhorse for clarity — labels, headlines, navigation. <strong>Calluna</strong> is the body voice — reflections, letters, longer prose. <strong>Playlist Script</strong> is the warm accent for one decorative word. One font would feel monotone. Four would feel scattered. Three matches how HCFM actually communicates.' },
    { q: ['humanist sans', 'sans serif character'], a: 'Whitney is a <strong>humanist sans-serif</strong> — built on calligraphic skeletons rather than geometric ones. The lowercase \'g\' has an open lower bowl, the \'y\' has a curved descender, the \'V\' is wider than Helvetica\'s. These small differences add up to a font that reads more human than Helvetica or Arial — important for a ministry where warmth matters.' },

    // ---------- WHY: design element rules ----------
    { q: ['why one or two elements', 'restraint design'], a: 'Combining too many design elements <strong>creates visual clutter</strong> that fights the message. A clean, focused design always outperforms a busy one. Restraint isn\'t about being boring — it\'s about every element doing one job, none competing. The four approved elements (Thin Border, Color Fade, Curved Shapes, Dark Overlays) are tools, not requirements.' },
    { q: ['why dark overlay opacity range', 'overlay 40 to 70'], a: 'Overlay opacity isn\'t one fixed number because <strong>images vary.</strong> A light, sparse image with one short headline only needs 40% to make text readable. A busy, photo-rich image with longer copy needs 70% or more. The rule is readability — adjust until the text passes. There is no "correct" opacity divorced from the image underneath.' },
    { q: ['why thin border 3 4 pixels', 'border thickness rule'], a: 'Borders 3-4px maximum because <strong>any thicker reads as a frame around the content rather than an accent on it.</strong> A heavy border draws the eye to the edge instead of the content. A thin border catches just enough to suggest formality without competing. Keep it 3-4px and lean Muted Gold for traditional contexts, Yellow Gold for digital.' },

    // ---------- WHY: dark mode & social ----------
    { q: ['why dark mode matters', 'dark mode percentage'], a: 'Over 80% of users browse with <strong>dark mode enabled</strong> on their phones. When you design with a black background, your design fits naturally into how the audience already views their feed. Light backgrounds in a dark feed become visual noise — dark backgrounds become continuous space.' },
    { q: ['why social fast', 'two seconds scroll', 'attention span'], a: 'On social, you have <strong>maybe two seconds, maybe less</strong> before someone scrolls past. That window does not allow for anything subtle. Dark background plus high-contrast Yellow Gold gives the brain its easiest possible read — figure-ground separation in milliseconds. Slow elegance happens after the scroll has stopped.' },
    { q: ['why ikea blue but not blue background', 'industry brand vs social'], a: 'IKEA and Walmart use Blue + Yellow as their <strong>brand identity</strong> — but on social media they use product photos, lifestyle images, and dark overlays. Their everyday social posts don\'t use blue backgrounds either. Brand identity (logo, store, packaging) is one thing. Social media application is another. The HCFM system honors both.' },

    // ---------- WHY: print vs digital ----------
    { q: ['why print different', 'digital vs print colors'], a: 'In <strong>print</strong>, white is the canvas and brand colors step into supporting roles. Letterheads, certificates, and donor materials lean on White with HCFM Blue and Muted Gold. In <strong>digital</strong>, Black is the canvas and Yellow Gold and Marian Blue do the supporting work. The medium dictates the role. Same brand, two registers.' },
    { q: ['why pantone 871 muted', 'muted gold reason'], a: 'Muted Gold (Pantone 871C / #89764B) reads as <strong>traditional, reverent, devotional</strong> — the gold of liturgical glory and Catholic heritage. It belongs on certificates, donor acknowledgements, formal print where its quiet warmth is right. On a backlit screen it loses life; in print under reflected light it glows.' },

    // ---------- WHY: typography pairings ----------
    { q: ['why whitney calluna pair', 'sans serif body pairing'], a: '<strong>Whitney + Calluna</strong> works because the contrast is functional, not decorative. Whitney\'s sans-serif clarity for headlines tells you "this matters." Calluna\'s serif warmth for body text tells you "now sit and read." The pairing mirrors the cadence of how HCFM communicates — declarative headers, reflective prose.' },
    { q: ['why not just one font', 'monotype'], a: 'Using a single font for everything flattens hierarchy. Without contrast between headline and body, the reader can\'t tell what matters most at a glance. Three fonts give three jobs. Whitney announces. Calluna reflects. Playlist Script accents. Each font earns its place by doing what the others can\'t.' },

    // ---------- WHY: brand changes / audit results ----------
    { q: ['why simplified palette', '20 colors to 6'], a: 'The old palette had 20 colors (3 primary + 8 extended + 9 light). <strong>Too many.</strong> Every ministry-center designer made different choices, and the brand fragmented across regions. The 2026 system simplifies to 4 primary + 2 accent + 3 liturgical = 9 colors total, with clear rules on when each is used. Fewer choices, sharper brand.' },
    { q: ['why playlist script added', 'why script font 2026'], a: 'Playlist Script was added in 2026 to <strong>introduce warmth and humanity</strong> the system was missing. Whitney is clean and modern. Calluna is reverent and serious. Neither can do "the family that prays together stays together" with the right emotional weight. Playlist Script — used sparingly — adds the warmth a global family ministry brand needs.' },
    { q: ['research backing', 'evidence for choices', 'why trust this system'], a: 'Brand decisions are anchored in research: <strong>WCAG accessibility standards</strong> for contrast ratios, <strong>Labrecque & Milne (2012)</strong> on color and brand personality (Blue → competence), <strong>Madden et al. (2000)</strong> on cross-cultural color meaning, <strong>Bottomley & Doyle (2006)</strong> on brand consistency vs locale-switching, and <strong>Gestalt figure-ground</strong> principles for scroll-stop performance. The choices have a paper trail.' },

    // ---------- WHY: specific symbol design choices ----------
    { q: ['why ten beads', 'why not five or seven', 'rosary decade reason'], a: 'Ten beads because <strong>a Rosary decade has ten beads.</strong> Each Hail Mary is a bead, and ten Hail Marys form a decade — the basic unit of Marian prayer. The mark didn\'t pick ten arbitrarily; it picked the smallest unit of the prayer that founds HCFM. Anything fewer would be incomplete; anything more would lose the reference.' },
    { q: ['why circular mark', 'why round logo'], a: 'The circular shape is intentional. <strong>Circles communicate unity, continuity, and gathering</strong> — families coming together in prayer, the continuous rhythm of daily devotion, the unbroken cycle of the Rosary. A square or angular shape would carry different meanings. The circle is doing theological work, not just aesthetic work.' },
    { q: ['why each shape person', 'why ten people'], a: 'Each of the ten shapes represents <strong>a person in prayer</strong> — hands raised or folded. No single shape stands alone. Each depends on the others. The mark visualizes Father Peyton\'s vision: families linked together through prayer, forming something greater than themselves. The form is the message.' },

    // ---------- WHY: practical ministry questions ----------
    { q: ['why central not local', 'why one canonical'], a: 'A single canonical brand keeps every ministry center recognizable as one family. <strong>If every center designs its own variant</strong>, the brand fragments — donors and partners can\'t tell which ministry is which. Centralizing the editable source means there is exactly one right version, and any change goes through one team. Predictability over flexibility.' },
    { q: ['why ai files restricted', 'why not give source files'], a: 'AI files are restricted because <strong>once a ministry has the editable source, edits start happening.</strong> Slightly different spacing, slightly different gold, slightly different wordmark — and over a year you have 24 different versions of the logo across 24 ministries. Restricting AI to brand owners (Victoria and Emmanuel) means there is one canonical logo, always.' },
    { q: ['why password gate', 'why gated downloads'], a: 'Brand assets are gated to keep them <strong>inside the HCFM creative network</strong> — ministry centers, vendors with active work, partners. Open downloads invite misuse: a vendor takes the file for an unrelated project, a third party builds something off-brand, the mark shows up where it shouldn\'t. The password is friction by design.' },

    // ---------- WHY: voice & writing ----------
    { q: ['why two voice registers', 'voice why two'], a: 'HCFM speaks to <strong>two very different audiences</strong>. The faithful — families and parishes — need warmth, narrative, reverence. Vendors and partners — designers and printers — need specifics, dimensions, file formats. One voice can\'t serve both. Two registers acknowledge the truth that different audiences need different language, while staying recognizably HCFM in both.' },
    { q: ['why family the family that prays', 'why peyton phrase'], a: 'Father Peyton\'s phrase is <strong>real, original, and his.</strong> "The family that prays together stays together" came from his ministry directly. Using his actual words — instead of paraphrasing or modernizing — keeps HCFM connected to its founder. The phrase is also why the brand voice is family-first: he meant household prayer, not abstract piety.' },
    { q: ['why named not abstract', 'why specific countries'], a: 'We say "France, Philippines, Chile, Bangladesh, the United States" instead of "globally distributed" because <strong>names carry weight that abstractions lose.</strong> A reader who hears "globally" thinks "everywhere and nowhere." A reader who hears specific country names sees the mission as real and located. Specificity is mission language.' },

    // ---------- WHY: photography ----------
    { q: ['why real not stock', 'authentic photography'], a: 'Stock photography <strong>looks like stock photography</strong> — and audiences know. A staged "diverse family praying" photo from a stock library carries less weight than an actual photo of an actual ministry-center event. Real images, even when imperfect, carry credibility stock cannot match. Especially for a ministry where authenticity is half the message.' },
    { q: ['why photography rules', 'visual standards photo'], a: 'Photography rules exist because <strong>the wrong image can undo a hundred right design decisions.</strong> A grainy or off-brand photo on a perfect layout still reads as off-brand. A great photo on a mediocre layout reads as authentic. The image carries more weight than the design around it, so the bar for image quality is high.' },

    // ---------- WHY: brand portal & this page ----------
    { q: ['why this brand page', 'purpose of brand portal'], a: 'This brand page exists because <strong>SharePoint blocks external consultants, vendors, and ministry centers</strong> from accessing brand materials. The team was repeatedly fielding the same brand questions over email. Ministry centers in 18 countries couldn\'t find a clean reference. A single canonical destination — public-facing for documents, gated for production files — solves all three problems.' },
    { q: ['why public', 'why visible to everyone'], a: 'Most of the brand page is intentionally public because <strong>the brand wants to be seen and used correctly.</strong> Ministry-center designers, vendors, and curious partners shouldn\'t have to email anyone to learn what HCFM Blue\'s hex is. Production files are gated. Reference is open. That\'s the right division.' }
  ];

  function answerQuestion(q) {
    q = q.toLowerCase();
    let bestScore = 0;
    let bestAnswer = null;
    for (const k of knowledge) {
      let score = 0;
      for (const term of k.q) {
        if (q.includes(term.toLowerCase())) score += term.length;
      }
      if (score > bestScore) {
        bestScore = score;
        bestAnswer = k.a;
      }
    }
    if (bestAnswer) return bestAnswer;
    return `I don't have a confident answer for that yet. Try one of these topics: <em>colors, fonts, logos, voice, photography, ministries, downloads, transition, password</em>. Or email <a href="mailto:vhassan@hcfm.org">vhassan@hcfm.org</a> or <a href="mailto:eepau@hcfm.org">eepau@hcfm.org</a>.`;
  }

  function addChatMessage(text, isUser) {
    if (!chatBody) return;
    const div = document.createElement('div');
    div.className = `chat-msg chat-msg-${isUser ? 'user' : 'bot'}`;
    div.innerHTML = `<p>${text}</p>`;
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function handleChatQuery(query) {
    if (!query || !query.trim()) return;
    addChatMessage(query, true);
    setTimeout(() => addChatMessage(answerQuestion(query), false), 320);
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
    if (pill) handleChatQuery(pill.dataset.q);
  });

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
