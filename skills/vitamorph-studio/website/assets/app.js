/* VitaMorph Studio — no third-party dependencies or tracking. */
(() => {
  'use strict';
  const data = window.VITAMORPH_PROFILE;
  if (!data) { document.getElementById('person-about').textContent = 'Profile data unavailable. Rebuild assets/profile.js from profile.json.'; return; }
  const $ = (id) => document.getElementById(id);
  const str = (v) => v == null ? '' : String(v);
  const txt = (id, value, fallback = '') => { const node = $(id); if (node) node.textContent = str(value).trim() || fallback; };
  const el = (tag, className, content) => { const n = document.createElement(tag); if (className) n.className = className; if (content != null) n.textContent = str(content); return n; };
  const append = (parent, ...children) => children.forEach((child) => parent.appendChild(child));
  const safeLink = (value, local = false) => {
    const link = str(value).trim();
    if (!link) return null;
    if (local && !/^(?:\/|\.\/|[a-zA-Z0-9_-])[a-zA-Z0-9_./-]*$/.test(link)) return null;
    if (local && (link.includes('..') || link.startsWith('//'))) return null;
    if (local && !/^[a-z][a-z0-9+.-]*:/i.test(link)) return link;
    try { const u = new URL(link); return ['https:', 'http:'].includes(u.protocol) ? u.href : null; } catch { return null; }
  };
  const makeLink = (name, url) => {
    const a = el('a', '', `${name} ↗`);
    a.href = url;
    if (/^https?:/i.test(url)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    return a;
  };

  // Profile / search metadata.
  txt('person-name', data.name, 'Your Name');
  txt('person-role', data.role, 'Professional title');
  txt('person-institution', data.institution, 'Institution / Organization');
  txt('person-about', data.summary, 'A curated account of your professional journey.');
  txt('snapshot-date', data.snapshot ? `SNAPSHOT ${data.snapshot}` : 'CURRENT EDITION');
  txt('location-label', data.location ? str(data.location).toUpperCase() : 'GLOBAL PORTFOLIO');
  txt('footer-owner', `© ${str(data.name || 'Profile owner')}`);
  const title = `${str(data.name || 'Interactive CV')} — Interactive CV`;
  document.title = title;
  $('meta-description').setAttribute('content', str(data.summary || 'Verified professional curriculum vitae.').slice(0, 160));
  $('meta-og-title').setAttribute('content', title);
  $('meta-og-description').setAttribute('content', str(data.summary || 'Explore the interactive professional profile.').slice(0, 200));
  const initials = str(data.name || 'CV').split(/\s+/).filter(Boolean).slice(0, 2).map((t) => t[0].toUpperCase()).join('');
  txt('portrait-initials', initials || 'CV');
  const portraitUrl = safeLink(data.portrait, true);
  if (portraitUrl) {
    const img = el('img'); img.src = portraitUrl; img.alt = `Portrait of ${str(data.name)}`; img.loading = 'lazy';
    img.addEventListener('error', () => img.remove());
    $('portrait-frame').prepend(img);
  }
  const pdf = safeLink(data.links?.cv_pdf, true);
  if (pdf) { const a = $('cv-download'); a.href = pdf; a.hidden = false; }

  // Impact and focus.
  const metricList = $('metrics-list');
  (data.metrics || []).forEach((m) => {
    if (m.value === '' || m.value === null || m.value === undefined) return;
    const card = el('article', 'metric');
    append(card, el('div', 'metric-value', m.value), el('div', 'metric-label', m.label || ''), el('div', 'metric-source', [m.source, m.as_of].filter(Boolean).join(' · ')));
    if (metricList.querySelector('.empty-inline')) metricList.replaceChildren();
    metricList.appendChild(card);
  });
  const focus = $('focus-tags');
  if ((data.research_areas || []).length) {
    focus.replaceChildren();
    (data.research_areas || []).forEach((area) => focus.appendChild(el('span', 'focus-tag', area)));
  }

  // Publication archive. Full list is searchable and paginated, but print shows all matching entries.
  let show = 12;
  const publications = Array.isArray(data.publications) ? data.publications.map((p, i) => ({ ...p, _source_index: i + 1 })) : [];
  const typeSelect = $('publication-type');
  [...new Set(publications.map((p) => str(p.type).trim()).filter(Boolean))].sort().forEach((type) => {
    const option = el('option', '', type); option.value = type; typeSelect.appendChild(option);
  });
  const fmtCount = (n) => `${n.toLocaleString('en-US')} publication${n === 1 ? '' : 's'}`;
  function getPublications() {
    const q = $('publication-search').value.trim().toLowerCase();
    const type = typeSelect.value;
    const matches = publications.filter((p) => {
      if (type !== 'all' && str(p.type) !== type) return false;
      const haystack = [p.title, p.venue, p.year, p.authors, p.indexing, p.type].map(str).join(' ').toLowerCase();
      return !q || haystack.includes(q);
    });
    const mode = $('publication-sort').value;
    matches.sort((a, b) => mode === 'title' ? str(a.title).localeCompare(str(b.title)) :
      mode === 'oldest' ? Number(a.year || 0) - Number(b.year || 0) : Number(b.year || 0) - Number(a.year || 0));
    return matches;
  }
  function renderPublications(printAll = false) {
    const matches = printAll ? publications.slice().sort((a, b) => Number(b.year || 0) - Number(a.year || 0)) : getPublications();
    const list = $('publication-list'); list.replaceChildren();
    $('publication-count').textContent = `${fmtCount(matches.length)} shown from ${fmtCount(publications.length)} in this portfolio${data.publication_scope === 'selected' ? ' (selected archive)' : ''}`;
    if (!matches.length) {
      list.appendChild(el('p', 'empty-inline', publications.length ? 'No publications match your search. Try changing your filters.' : 'The verified publication index will appear here.'));
    }
    (printAll ? matches : matches.slice(0, show)).forEach((p, i) => {
      const article = el('article', 'publication');
      const number = el('span', 'pub-number', String(p.serial_number || p._source_index).padStart(2, '0'));
      const body = el('div', 'pub-body');
      append(body, el('h3', 'pub-title', p.title || 'Untitled publication'), el('p', 'pub-venue', [p.authors, p.venue].filter(Boolean).join(' · ')), el('div', 'pub-meta', [p.type, p.year, p.indexing].filter(Boolean).join(' / ')));
      append(article, number, body);
      const doi = safeLink(p.doi_url);
      if (doi) article.appendChild(makeLink('View DOI', doi));
      list.appendChild(article);
    });
    $('load-more').hidden = printAll || show >= matches.length;
  }
  ['publication-search', 'publication-type', 'publication-sort'].forEach((id) => {
    $(id).addEventListener(id === 'publication-search' ? 'input' : 'change', () => { show = 12; renderPublications(); });
  });
  $('load-more').addEventListener('click', () => { show += 12; renderPublications(); });
  renderPublications();
  window.addEventListener('beforeprint', () => renderPublications(true));
  window.addEventListener('afterprint', () => renderPublications(false));

  // Career and education timelines.
  const timelines = [[data.career, 'career-list'], [data.education, 'education-list']];
  timelines.forEach(([items, id]) => {
    const parent = $(id);
    if (!Array.isArray(items) || !items.length) return;
    parent.replaceChildren();
    items.forEach((item) => {
      const article = el('article', 'timeline-item'); const body = el('div');
      append(body, el('div', 'timeline-title', item.title), el('div', 'timeline-place', item.organization || item.institution || ''), el('p', 'timeline-description', item.description || ''));
      append(article, el('div', 'timeline-date', item.period || ''), body);
      parent.appendChild(article);
    });
  });

  // Selected projects, patents and awards.
  const work = $('work-grid');
  let workCount = 0;
  [['Research project', data.projects], ['Patent', data.patents], ['Recognition', data.awards]].forEach(([kind, entries]) => {
    (entries || []).forEach((entry) => {
      if (!workCount++) work.replaceChildren();
      const card = el('article', 'work-card');
      append(card, el('div', 'work-kind', kind), el('h3', 'work-title', entry.title), el('p', 'work-description', [entry.period, entry.role, entry.description].filter(Boolean).join(' · ')));
      const url = safeLink(entry.url);
      if (url) { const link = makeLink('Details', url); link.className = 'work-link'; card.appendChild(link); }
      work.appendChild(card);
    });
  });

  // Contact: only explicitly entered public links appear.
  const links = data.links || {};
  const contact = $('contact-links');
  const email = str(links.email).trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) contact.appendChild(makeLink('Email', `mailto:${email}`));
  [['ORCID', links.orcid], ['Google Scholar', links.google_scholar], ['Scopus', links.scopus], ['LinkedIn', links.linkedin], ['Website', links.website]].forEach(([label, raw]) => {
    const url = safeLink(raw); if (url) contact.appendChild(makeLink(label, url));
  });
  if (!contact.children.length) contact.appendChild(el('span', '', 'Public contact links are not yet configured.'));

  const status = $('live-status'); let statusTimeout;
  function flash(message) { status.textContent = message; status.classList.add('visible'); clearTimeout(statusTimeout); statusTimeout = setTimeout(() => status.classList.remove('visible'), 2600); }
  $('print-btn').addEventListener('click', () => window.print());
  $('share-btn').addEventListener('click', async () => {
    if (navigator.clipboard && window.isSecureContext) {
      try { await navigator.clipboard.writeText(window.location.href); flash('Profile link copied.'); return; } catch (_) { /* fall back */ }
    }
    const input = document.createElement('textarea'); input.value = window.location.href; input.style.position = 'fixed'; input.style.opacity = '0'; document.body.appendChild(input); input.select();
    const worked = document.execCommand && document.execCommand('copy'); input.remove();
    flash(worked ? 'Profile link copied.' : 'Copy the link from your browser’s address bar.');
  });

  if ('IntersectionObserver' in window) {
    const sections = Array.from(document.querySelectorAll('main section[id]'));
    const navMap = Object.fromEntries(Array.from(document.querySelectorAll('.nav-link')).map((a) => [a.getAttribute('href')?.slice(1), a]));
    const observer = new IntersectionObserver((entries) => {
      entries.filter((e) => e.isIntersecting).forEach((e) => {
        Object.values(navMap).forEach((a) => { a.classList.remove('active'); a.removeAttribute('aria-current'); });
        const active = navMap[e.target.id]; if (active) { active.classList.add('active'); active.setAttribute('aria-current', 'location'); }
      });
    }, { rootMargin: '-12% 0px -68% 0px', threshold: 0 });
    sections.forEach((section) => observer.observe(section));
  }
})();

