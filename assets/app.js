// Assets Application - Dynamic YAML loader and template renderer
(function() {
  // Canonical origin for this site. Verified live 2026-07-23. Change this ONE
  // line (and the <link rel="canonical"> / og:url tags in the HTML heads) if you
  // buy a domain or rename the repo to 4858hammad.github.io.
  const SITE_BASE = 'https://4858hammad.github.io/hammad-ali.github.io';

  // Everything below is interpolated into innerHTML. Escape it so an apostrophe
  // or ampersand in the YAML cannot break the markup.
  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Optional list fields (README documents modules/tags as optional, but the
  // renderers used to assume they were always present and threw without them).
  function list(v) {
    return Array.isArray(v) ? v : [];
  }

  // Load js-yaml CDN library dynamically if needed
  function initYAML(callback) {
    if (typeof jsyaml !== 'undefined') {
      callback();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/js-yaml/4.1.0/js-yaml.min.js';
    script.onload = callback;
    document.head.appendChild(script);
  }

  // Helper to fetch and parse yaml
  async function loadData() {
    try {
      const response = await fetch('portfolio_data.yaml');
      if (!response.ok) {
        throw new Error('Failed to load portfolio_data.yaml');
      }
      const yamlText = await response.text();
      return jsyaml.load(yamlText);
    } catch (e) {
      console.error('Error loading portfolio data:', e);
      return null;
    }
  }

  // Active page helpers
  function getActivePage() {
    const path = window.location.pathname;
    if (path.endsWith('/') || path === "") {
      return 'index.html';
    }
    return path.split('/').pop().toLowerCase();
  }

  // Set/replace a <meta> or <link> in <head> so JS-rendered pages still emit a
  // unique description and canonical per project (project.html is one template
  // serving 15 URLs; without this Google sees one page called "Project Details").
  function setMeta(selector, attr, value) {
    let el = document.head.querySelector(selector);
    if (!el) {
      el = document.createElement(selector.startsWith('link') ? 'link' : 'meta');
      const m = selector.match(/\[(\w+)="([^"]+)"\]/);
      if (m) el.setAttribute(m[1], m[2]);
      document.head.appendChild(el);
    }
    el.setAttribute(attr, value);
  }

  function getCategoryIcon(cat) {
    if (cat === 'odoo') return '⚙';
    if (cat === 'android') return '📱';
    return '🌐';
  }

  function getCategoryColorClass(cat) {
    if (cat === 'odoo') return 'blue';
    if (cat === 'android') return 'green';
    return 'purple';
  }

  // Render HTML Image element with auto placeholder fallback
  function renderProjectImage(project, isDetail = false) {
    const fallbackHtml = `
      <div class="img-placeholder ${project.category}">
        <span class="icon">${getCategoryIcon(project.category)}</span>
        <span class="category-badge">${project.category}</span>
      </div>
    `;
    
    if (!project.image) {
      return fallbackHtml;
    }
    
    return `
      <img src="${esc(project.image)}" alt="${esc(project.title)} — ${esc(project.category)} project screenshot" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
      <div class="img-placeholder ${project.category}" style="display:none; width:100%; height:100%;">
        <span class="icon">${getCategoryIcon(project.category)}</span>
        <span class="category-badge">${project.category}</span>
      </div>
    `;
  }

  function sortProjectsNewestFirst(projects) {
    return [...projects].sort((a, b) => {
      const yearDiff = Number(b.year || 0) - Number(a.year || 0);
      return yearDiff !== 0 ? yearDiff : 0;
    });
  }

  // App Initialization
  initYAML(async function() {
    const data = await loadData();
    if (!data) {
      // Do not wipe document.body — the hero, contact details and noscript
      // fallback are real content and should survive a failed data fetch
      // (e.g. cdnjs blocked by a corporate firewall). Prepend a notice instead.
      const banner = document.createElement('div');
      banner.setAttribute('role', 'alert');
      banner.style.cssText = 'background:#fdecec; color:#8a1c1c; text-align:center; padding:12px; font-size:13px;';
      banner.textContent = 'Some content could not be loaded. Email hammadali4858@gmail.com or call +92 320 248 5828.';
      document.body.prepend(banner);
      return;
    }

    // Titles: every static page now carries a hand-written, keyword-bearing
    // <title> in its own <head>. Do NOT overwrite those here — doing so replaced
    // them with short generic ones in the rendered DOM, which is what Google and
    // the LinkedIn preview bot actually read. Only project.html needs a runtime
    // title, because one template serves every project.
    const pageName = getActivePage();
    let pageTitle = null;
    if (pageName === 'project.html') {
      const urlParams = new URLSearchParams(window.location.search);
      const projId = urlParams.get('id');
      const proj = data.projects.find(p => p.id === projId);
      if (proj) {
        const versionPart = proj.odoo_version ? ` — ${proj.odoo_version}` : '';
        pageTitle = `${proj.title}${versionPart} Case Study | ${data.site.name}`;
        setMeta('meta[name="description"]', 'content', proj.short_desc || '');
        setMeta('link[rel="canonical"]', 'href', `${SITE_BASE}/project.html?id=${proj.id}`);
        setMeta('meta[property="og:title"]', 'content', pageTitle);
        setMeta('meta[property="og:description"]', 'content', proj.short_desc || '');
        setMeta('meta[property="og:url"]', 'content', `${SITE_BASE}/project.html?id=${proj.id}`);
        if (proj.image) {
          setMeta('meta[property="og:image"]', 'content', `${SITE_BASE}/${proj.image}`);
          setMeta('meta[name="twitter:image"]', 'content', `${SITE_BASE}/${proj.image}`);
        }
      }
    }

    if (pageTitle) document.title = pageTitle;

    // Render Shared Navigation & Header Shell
    renderNavigation(data);
    renderFooter(data);

    // Page-specific routing logic
    if (pageName === 'index.html') {
      renderHomePage(data);
    } else if (pageName === 'odoo.html') {
      renderOdooPage(data);
    } else if (pageName === 'android.html') {
      renderAndroidPage(data);
    } else if (pageName === 'web.html') {
      renderWebPage(data);
    } else if (pageName === 'experience.html') {
      renderExperiencePage(data);
    } else if (pageName === 'project.html') {
      renderProjectDetailPage(data);
    } else if (pageName === 'contact.html') {
      renderContactPage(data);
    }
  });

  // Render Header/Navbar
  function renderNavigation(data) {
    const navContainer = document.getElementById('nav-container');
    if (!navContainer) return;

    const page = getActivePage();
    const isAvail = data.site.available_for_work;
    
    navContainer.innerHTML = `
      <div class="nav">
        <a href="index.html" class="nav-logo">${data.site.name.split(' ')[0].toLowerCase()}<em>.dev</em></a>
        <div class="nav-links">
          <a href="index.html" class="${page === 'index.html' ? 'active' : ''}">Home</a>
          <a href="odoo.html" class="${page === 'odoo.html' ? 'active' : ''}">Odoo ERP</a>
          <a href="android.html" class="${page === 'android.html' ? 'active' : ''}">Android</a>
          <a href="web.html" class="${page === 'web.html' ? 'active' : ''}">Web</a>
          <a href="experience.html" class="${page === 'experience.html' ? 'active' : ''}">Experience</a>
          <a href="contact.html" class="${page === 'contact.html' ? 'active' : ''}">Contact</a>
        </div>
        <div class="pill ${isAvail ? '' : 'not-avail'}">${isAvail ? 'Open to work' : 'Unavailable'}</div>
      </div>
    `;
  }

  function renderExperiencePage(data) {
    const heroName = document.getElementById('exp-name');
    const heroSummary = document.getElementById('exp-summary');
    const heroStatus = document.getElementById('exp-status');
    const heroLocation = document.getElementById('exp-location');
    const heroAvatar = document.getElementById('exp-avatar');

    if (heroName) heroName.textContent = data.site.name;
    if (heroSummary) {
      const latestExp = data.experience[0];
      const latestLine = latestExp ? `${latestExp.role} at ${latestExp.company}` : data.site.tagline;
      heroSummary.textContent = `${data.site.tagline} · ${latestLine}`;
    }
    if (heroLocation) {
      heroLocation.textContent = `${data.contact.location} · ${data.contact.remote ? 'Remote OK' : 'On-site only'}`;
    }
    if (heroStatus) {
      heroStatus.textContent = data.site.available_for_work ? 'Open to remote contracts & full-time roles' : 'Currently unavailable';
    }
    if (heroAvatar) heroAvatar.textContent = data.site.name.split(' ').map(p => p[0]).join('').slice(0, 2);

    const expWrap = document.getElementById('experience-list');
    if (expWrap) {
      expWrap.innerHTML = data.experience.map(exp => `
        <div class="exp-item">
          <div class="exp-header">
            <div>
              <div class="exp-title">${exp.role}</div>
              <div class="exp-company">${exp.company}</div>
            </div>
            <div class="exp-period">${exp.period}</div>
          </div>
          ${exp.meta ? `<div class="exp-meta">${exp.meta}</div>` : ''}
          ${exp.summary ? `<div class="exp-summary-text">${exp.summary}</div>` : ''}
          <ul class="exp-highlights">
            ${(exp.highlights || []).map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
      `).join('');
    }

    const skillWrap = document.getElementById('skill-sections');
    if (skillWrap) {
      skillWrap.innerHTML = data.skills.map(group => `
        <div class="skill-cat">
          <div class="skill-cat-title">${group.category}</div>
          <div class="skill-list">
            ${group.items.map(item => `<span class="skill-pill">${item}</span>`).join('')}
          </div>
        </div>
      `).join('');
    }

    const projectsWrap = document.getElementById('experience-projects');
    if (projectsWrap) {
      const selectedProjectIds = [
        'clearpath-orthodontics',
        'mastercard-payment',
        'tazah-sale-flow',
        'sage-integration',
        'ringfree-integration'
      ];
      const selectedProjects = selectedProjectIds
        .map(id => data.projects.find(project => project.id === id))
        .filter(Boolean);

      projectsWrap.innerHTML = selectedProjects.map(project => `
        <div class="exp-project-card" onclick="window.location.href='project.html?id=${project.id}'">
          <div class="exp-project-head">
            <div>
              <div class="exp-project-title">${project.title}</div>
              <div class="exp-project-meta">${project.client} · ${project.year} · ${project.odoo_version || 'Odoo'}</div>
            </div>
            <div class="exp-project-link">View project →</div>
          </div>
          <div class="exp-project-desc">${project.full_desc || project.short_desc}</div>
          <div class="exp-project-tags">
            ${list(project.tags).slice(0, 4).map(tag => `<span class="skill-pill">${tag}</span>`).join('')}
          </div>
        </div>
      `).join('');
    }

    const contactBlock = document.getElementById('exp-contact');
    if (contactBlock) {
      contactBlock.innerHTML = `
        <div class="info-block">
          <div class="info-label">Email</div>
          <div class="info-val"><a href="mailto:${data.contact.email}">${data.contact.email}</a></div>
        </div>
        <div class="info-block">
          <div class="info-label">Phone</div>
          <div class="info-val">${data.contact.phone}</div>
        </div>
        <div class="info-block">
          <div class="info-label">LinkedIn</div>
          <div class="info-val"><a href="${data.contact.linkedin}" target="_blank" rel="noreferrer">Profile</a></div>
        </div>
        <div class="info-block">
          <div class="info-label">GitHub</div>
          <div class="info-val"><a href="${data.contact.github}" target="_blank" rel="noreferrer">Repository</a></div>
        </div>
      `;
    }
  }

  // Render Footer
  function renderFooter(data) {
    const footerContainer = document.getElementById('footer-container');
    if (!footerContainer) return;

    const year = new Date().getFullYear();
    const shortDomain = data.site.name.split(' ')[0].toLowerCase() + '.dev';
    
    footerContainer.innerHTML = `
      <span>${shortDomain} · GitHub Pages</span>
      <span>© ${year} ${data.site.name}</span>
    `;
  }

  // Render Home Page Details
  function renderHomePage(data) {
    // 1. Tagline/Descs
    const heroTag = document.getElementById('hero-tag');
    const heroTitle = document.getElementById('hero-title');
    const heroDesc = document.getElementById('hero-desc');
    const btnRow = document.getElementById('btn-row');

    // Hero copy now lives in index.html so that crawlers and no-JS clients see
    // it. Do not overwrite it here — that would duplicate the same string in two
    // places and let them drift apart.
    void heroTag; void heroTitle; void heroDesc; void btnRow;

    // 2. Stats
    const statsContainer = document.getElementById('stats-container');
    if (statsContainer) {
      statsContainer.innerHTML = data.stats.map(stat => `
        <div class="stat">
          <div class="stat-n">${stat.value}</div>
          <div class="stat-l">${stat.label}</div>
        </div>
      `).join('');
    }

    // 3. Category projects counts
    const odooCount = data.projects.filter(p => p.category === 'odoo').length;
    const androidCount = data.projects.filter(p => p.category === 'android').length;
    const webCount = data.projects.filter(p => p.category === 'web').length;

    const catStrip = document.getElementById('category-strip');
    if (catStrip) {
      catStrip.innerHTML = `
        <div class="cat-card" onclick="window.location.href='odoo.html'">
          <div class="cat-icon b">⚙</div>
          <div class="cat-info"><p>Odoo ERP</p><span>${odooCount} projects</span></div>
        </div>
        <div class="cat-card" onclick="window.location.href='android.html'">
          <div class="cat-icon g">📱</div>
          <div class="cat-info"><p>Android</p><span>${androidCount} projects</span></div>
        </div>
        <div class="cat-card" onclick="window.location.href='web.html'">
          <div class="cat-icon p">🌐</div>
          <div class="cat-info"><p>Web</p><span>${webCount} projects</span></div>
        </div>
      `;
    }

    // 4. Featured Projects list
    const featuredGrid = document.getElementById('featured-grid');
    if (featuredGrid) {
      const featuredProjects = sortProjectsNewestFirst(
        data.projects.filter(p => p.featured === true)
      ).slice(0, 3);
      featuredGrid.innerHTML = featuredProjects.map(proj => {
        const colorClass = getCategoryColorClass(proj.category);
        return `
          <div class="proj-card" onclick="window.location.href='project.html?id=${proj.id}'">
            <div class="proj-img">
              ${renderProjectImage(proj)}
            </div>
            <div class="proj-body">
              <div class="proj-name">${proj.title}</div>
              <div class="proj-desc">${proj.short_desc}</div>
              <div class="proj-tags">
                <span class="tag ${colorClass}">${proj.category === 'odoo' ? 'Odoo' : proj.category === 'android' ? 'Android' : 'Web'}</span>
                ${list(proj.tags).slice(0, 2).map(tag => `<span class="tag ${colorClass}">${tag}</span>`).join('')}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    // 5. About info
    const aboutText = document.getElementById('about-text-container');
    if (aboutText) {
      // Find latest experience title
      const latestExp = data.experience[0];
      const jobLine = latestExp ? `${latestExp.role} at ${latestExp.company}` : `${data.site.tagline}`;
      
      aboutText.innerHTML = `
        <p>${data.site.name} — ${jobLine}</p>
        <span>${data.contact.location} · ${data.contact.email} · ${data.contact.phone}</span>
      `;
    }
  }

  // Render Odoo List Page
  function renderOdooPage(data) {
    const listContainer = document.getElementById('odoo-list-container');
    if (!listContainer) return;

    const odooProjects = sortProjectsNewestFirst(
      data.projects.filter(p => p.category === 'odoo')
    );
    
    // Collect all unique tags for filter subnav
    const tagsSet = new Set();
    odooProjects.forEach(p => list(p.tags).forEach(t => tagsSet.add(t)));
    const uniqueTags = Array.from(tagsSet);

    // Render filter bar buttons
    const filterBar = document.getElementById('filter-bar');
    if (filterBar) {
      filterBar.innerHTML = `
        <button class="filter on" data-tag="all">All</button>
        ${uniqueTags.map(tag => `<button class="filter" data-tag="${tag}">${tag}</button>`).join('')}
      `;

      // Set up click listeners for tag filtering
      const filterButtons = filterBar.querySelectorAll('.filter');
      filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
          filterButtons.forEach(b => b.classList.remove('on'));
          this.classList.add('on');
          const selectedTag = this.getAttribute('data-tag');
          renderList(selectedTag);
        });
      });
    }

    function renderList(tagFilter) {
      let filtered = odooProjects;
      if (tagFilter !== 'all') {
        filtered = sortProjectsNewestFirst(
          odooProjects.filter(p => list(p.tags).includes(tagFilter))
        );
      }

      if (filtered.length === 0) {
        listContainer.innerHTML = '<div style="color:var(--color-text-secondary); text-align:center; padding:30px;">No matching projects found.</div>';
        return;
      }

      listContainer.innerHTML = filtered.map(proj => {
        const modulesStr = list(proj.modules).length > 0
          ? `<strong>Modules:</strong> ${esc(list(proj.modules).join(' · '))}`
          : `<strong>Tech:</strong> ${esc(list(proj.tech_stack).join(' · '))}`;

        return `
          <div class="pcard" onclick="window.location.href='project.html?id=${proj.id}'">
            <div class="pcard-img">
              ${renderProjectImage(proj)}
            </div>
            <div class="pcard-body">
              <div class="pcard-top">
                <div class="pcard-name">${proj.title}</div>
                <div class="pcard-date">${proj.client} · ${proj.year}</div>
              </div>
              <div class="pcard-desc">${proj.full_desc || proj.short_desc}</div>
              <div class="pcard-tags">
                ${list(proj.tags).map(t => `<span class="tg">${esc(t)}</span>`).join('')}
              </div>
              <div class="pcard-modules">${modulesStr}</div>
              <div class="view-btn">View details →</div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Initial render of all
    renderList('all');
  }

  // Render Android Page
  function renderAndroidPage(data) {
    const listContainer = document.getElementById('android-list-container');
    if (!listContainer) return;

    const androidProjects = sortProjectsNewestFirst(
      data.projects.filter(p => p.category === 'android')
    );

    // Collect tags
    const tagsSet = new Set();
    androidProjects.forEach(p => list(p.tags).forEach(t => tagsSet.add(t)));
    const uniqueTags = Array.from(tagsSet);

    const filterBar = document.getElementById('filter-bar');
    if (filterBar) {
      filterBar.innerHTML = `
        <button class="filter on" data-tag="all">All</button>
        ${uniqueTags.map(tag => `<button class="filter" data-tag="${tag}">${tag}</button>`).join('')}
      `;

      const filterButtons = filterBar.querySelectorAll('.filter');
      filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
          filterButtons.forEach(b => b.classList.remove('on'));
          this.classList.add('on');
          const selectedTag = this.getAttribute('data-tag');
          renderList(selectedTag);
        });
      });
    }

    function renderList(tagFilter) {
      let filtered = androidProjects;
      if (tagFilter !== 'all') {
        filtered = sortProjectsNewestFirst(
          androidProjects.filter(p => list(p.tags).includes(tagFilter))
        );
      }

      if (filtered.length === 0) {
        listContainer.innerHTML = '<div style="color:var(--color-text-secondary); text-align:center; padding:30px;">No matching projects found.</div>';
        return;
      }

      listContainer.innerHTML = filtered.map(proj => `
        <div class="acard" onclick="window.location.href='project.html?id=${proj.id}'">
          <div class="aimg">
            ${renderProjectImage(proj)}
          </div>
          <div class="abody">
            <div class="aname">${proj.title}</div>
            <div class="adesc">${proj.short_desc}</div>
            <div class="atgs">
              ${list(proj.tags).map(t => `<span class="atg">${esc(t)}</span>`).join('')}
            </div>
            <span class="view4">View details →</span>
          </div>
        </div>
      `).join('');
    }

    // Initial render
    renderList('all');
  }

  // Render Web Page
  function renderWebPage(data) {
    const listContainer = document.getElementById('web-list-container');
    if (!listContainer) return;

    const webProjects = sortProjectsNewestFirst(
      data.projects.filter(p => p.category === 'web')
    );

    // Collect tags
    const tagsSet = new Set();
    webProjects.forEach(p => list(p.tags).forEach(t => tagsSet.add(t)));
    const uniqueTags = Array.from(tagsSet);

    const filterBar = document.getElementById('filter-bar');
    if (filterBar) {
      filterBar.innerHTML = `
        <button class="filter on" data-tag="all">All</button>
        ${uniqueTags.map(tag => `<button class="filter" data-tag="${tag}">${tag}</button>`).join('')}
      `;

      const filterButtons = filterBar.querySelectorAll('.filter');
      filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
          filterButtons.forEach(b => b.classList.remove('on'));
          this.classList.add('on');
          const selectedTag = this.getAttribute('data-tag');
          renderList(selectedTag);
        });
      });
    }

    function renderList(tagFilter) {
      let filtered = webProjects;
      if (tagFilter !== 'all') {
        filtered = sortProjectsNewestFirst(
          webProjects.filter(p => list(p.tags).includes(tagFilter))
        );
      }

      if (filtered.length === 0) {
        listContainer.innerHTML = '<div style="color:var(--color-text-secondary); text-align:center; padding:30px;">No matching projects found.</div>';
        return;
      }

      // We can use same acard styles as Android, but tags color will match Purple
      listContainer.innerHTML = filtered.map(proj => `
        <div class="acard" onclick="window.location.href='project.html?id=${proj.id}'">
          <div class="aimg" style="background:#EEEDFE;">
            ${renderProjectImage(proj)}
          </div>
          <div class="abody">
            <div class="aname">${proj.title}</div>
            <div class="adesc">${proj.short_desc}</div>
            <div class="atgs">
              ${proj.tags.map(t => `<span class="atg" style="background:#EEEDFE; color:#3C3489;">${t}</span>`).join('')}
            </div>
            <span class="view4" style="color:#534AB7;">View details →</span>
          </div>
        </div>
      `).join('');
    }

    // Initial render
    renderList('all');
  }

  // Render Project Detail Page
  function renderProjectDetailPage(data) {
    const urlParams = new URLSearchParams(window.location.search);
    const projId = urlParams.get('id');

    if (!projId) {
      window.location.href = 'index.html';
      return;
    }

    // Find project. Navigate within the current category only — previously this
    // sorted across every category, so "Next" from an Odoo project could land on
    // an Android app while the "Back to Odoo ERP Projects" link stayed put.
    const projectRecord = data.projects.find(p => p.id === projId);
    const sortedProjects = sortProjectsNewestFirst(
      projectRecord ? data.projects.filter(p => p.category === projectRecord.category)
                    : data.projects
    );
    const projectIndex = sortedProjects.findIndex(p => p.id === projId);
    if (projectIndex === -1) {
      window.location.href = 'index.html';
      return;
    }

    const project = sortedProjects[projectIndex];

    // Banner & Label
    const bannerContainer = document.getElementById('banner-container');
    if (bannerContainer) {
      bannerContainer.innerHTML = renderProjectImage(project, true);
    }

    // Back button
    const backBtn = document.getElementById('back-link');
    if (backBtn) {
      let categoryName = "Web / Other";
      let categoryUrl = "web.html";
      
      if (project.category === 'odoo') {
        categoryName = "Odoo ERP Projects";
        categoryUrl = "odoo.html";
      } else if (project.category === 'android') {
        categoryName = "Android Projects";
        categoryUrl = "android.html";
      }
      
      backBtn.innerHTML = `← Back to <em>${categoryName}</em>`;
      backBtn.onclick = () => window.location.href = categoryUrl;
    }

    // Metadata
    const detailTitle = document.getElementById('detail-title');
    const detailSub = document.getElementById('detail-sub');
    const detailTags = document.getElementById('detail-tags');
    const aboutText = document.getElementById('about-text');
    const highlightsList = document.getElementById('highlights-list');

    if (detailTitle) detailTitle.innerText = project.title;
    if (detailSub) {
      const displayCategory = project.category === 'odoo' ? 'Odoo ERP' : project.category === 'android' ? 'Android Mobile' : 'Web Application';
      detailSub.innerText = `${project.client} · ${project.year} · ${displayCategory}`;
    }
    if (detailTags) {
      detailTags.innerHTML = list(project.tags).map(t => `<span class="dtg">${esc(t)}</span>`).join('');
    }
    if (aboutText) {
      aboutText.innerText = project.full_desc || project.short_desc;
    }
    if (highlightsList) {
      if (project.highlights && project.highlights.length > 0) {
        highlightsList.innerHTML = project.highlights.map(h => `<li>${h}</li>`).join('');
      } else {
        // Fallback label if highlights missing
        highlightsList.innerHTML = `<li>Successfully completed all requirements of the project.</li><li>Maintained high quality of service and standards.</li>`;
      }
    }

    // Sidebar Blocks
    const clientVal = document.getElementById('client-val');
    const yearVal = document.getElementById('year-val');
    const versionBlock = document.getElementById('version-block');
    const versionVal = document.getElementById('version-val');
    const roleVal = document.getElementById('role-val');
    const modulesBlock = document.getElementById('modules-block');
    const modulesList = document.getElementById('modules-list');
    const techList = document.getElementById('tech-list');

    if (clientVal) clientVal.innerText = project.client;
    if (yearVal) yearVal.innerText = project.year;
    
    if (project.category === 'odoo' && project.odoo_version) {
      if (versionBlock) versionBlock.style.display = 'block';
      if (versionVal) versionVal.innerText = project.odoo_version;
    } else {
      if (versionBlock) versionBlock.style.display = 'none';
    }

    if (roleVal) roleVal.innerText = project.role || 'Developer';
    
    if (project.modules && project.modules.length > 0) {
      if (modulesBlock) modulesBlock.style.display = 'block';
      if (modulesList) {
        modulesList.innerHTML = project.modules.map(m => `<span class="mod-tag">${m}</span>`).join('');
      }
    } else {
      if (modulesBlock) modulesBlock.style.display = 'none';
    }

    if (techList && project.tech_stack) {
      techList.innerHTML = project.tech_stack.map(t => `<span class="mod-tag">${t}</span>`).join('');
    }

    // Navigation footer (Prev/Next)
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    if (prevBtn) {
      if (projectIndex > 0) {
        const prevProj = sortedProjects[projectIndex - 1];
        prevBtn.innerHTML = `← Previous: ${prevProj.title}`;
        prevBtn.classList.remove('disabled');
        prevBtn.onclick = () => window.location.href = `project.html?id=${prevProj.id}`;
      } else {
        prevBtn.innerHTML = `← First Project`;
        prevBtn.classList.add('disabled');
        prevBtn.onclick = null;
      }
    }

    if (nextBtn) {
      if (projectIndex < sortedProjects.length - 1) {
        const nextProj = sortedProjects[projectIndex + 1];
        nextBtn.innerHTML = `Next: ${nextProj.title} →`;
        nextBtn.classList.remove('disabled');
        nextBtn.onclick = () => window.location.href = `project.html?id=${nextProj.id}`;
      } else {
        nextBtn.innerHTML = `Last Project →`;
        nextBtn.classList.add('disabled');
        nextBtn.onclick = null;
      }
    }
  }

  // Render Contact Page
  function renderContactPage(data) {
    // 1. Fill contact metadata
    const phoneVal = document.getElementById('phone-val');
    const emailVal = document.getElementById('email-val');
    const linkedinVal = document.getElementById('linkedin-val');
    const githubVal = document.getElementById('github-val');
    const locationVal = document.getElementById('location-val');
    const availText = document.getElementById('avail-text');
    const availDot = document.getElementById('avail-dot');

    if (phoneVal) phoneVal.innerText = data.contact.phone;
    if (emailVal) {
      emailVal.innerHTML = `<a href="mailto:${data.contact.email}">${data.contact.email}</a>`;
    }
    if (linkedinVal) {
      const username = data.contact.linkedin.split('/').pop();
      linkedinVal.innerHTML = `<a href="${esc(data.contact.linkedin)}" target="_blank" rel="noopener">linkedin.com/in/${esc(username)}</a>`;
    }
    if (githubVal) {
      const username = data.contact.github.split('/').pop();
      githubVal.innerHTML = `<a href="${esc(data.contact.github)}" target="_blank" rel="noopener">github.com/${esc(username)}</a>`;
    }
    if (locationVal) {
      locationVal.innerText = `${data.contact.location}${data.contact.remote ? ' (Remote OK)' : ''}`;
    }

    if (data.site.available_for_work) {
      if (availText) availText.innerText = "Available for new projects";
      if (availDot) {
        availDot.style.background = "#639922";
        availDot.style.boxShadow = "0 0 8px #639922";
      }
    } else {
      if (availText) availText.innerText = "Not available at this moment";
      if (availDot) {
        availDot.style.background = "var(--color-text-tertiary)";
        availDot.style.boxShadow = "none";
      }
    }

    // 2. Submit Action Form (AJAX via Formspree)
    const contactForm = document.getElementById('contact-form');
    const statusMsg = document.getElementById('form-status-msg');
    
    if (contactForm) {
      contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = contactForm.querySelector('.send-btn');
        const originalText = submitBtn.innerText;
        submitBtn.disabled = true;
        submitBtn.innerText = "Sending message...";

        if (statusMsg) {
          statusMsg.style.display = 'none';
          statusMsg.className = 'form-status';
        }

        const dataPayload = new FormData(contactForm);
        const actionUrl = contactForm.getAttribute('action');

        try {
          const response = await fetch(actionUrl, {
            method: 'POST',
            body: dataPayload,
            headers: {
              'Accept': 'application/json'
            }
          });

          if (response.ok) {
            if (statusMsg) {
              statusMsg.innerText = "Thank you! Your message has been sent successfully.";
              statusMsg.className = "form-status success";
            }
            contactForm.reset();
          } else {
            const errData = await response.json();
            throw new Error(errData.errors ? errData.errors.map(err => err.message).join(', ') : 'Form submission failed');
          }
        } catch (err) {
          if (statusMsg) {
            statusMsg.innerText = `Oops! There was a problem: ${err.message}`;
            statusMsg.className = "form-status error";
          }
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerText = originalText;
        }
      });
    }
  }
})();
