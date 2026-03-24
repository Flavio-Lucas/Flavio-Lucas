/* ─────────────────────────────────────────────
   Data — loaded from data/*.js scripts in index.html
   (window.SECTIONS_DATA, EXPERIENCE_DATA, CONTACTS_DATA, PROJECTS_DATA)
───────────────────────────────────────────── */
function loadData() {
  return {
    sections:     window.SECTIONS_DATA     || [],
    experience:   window.EXPERIENCE_DATA   || [],
    contacts:     window.CONTACTS_DATA     || [],
    projects:     window.PROJECTS_DATA     || [],
    technologies: window.TECHNOLOGIES_DATA || [],
  };
}

/* ─────────────────────────────────────────────
   Nav
───────────────────────────────────────────── */
function buildNav(activeSections) {
  const nav = document.getElementById('nav');
  nav.innerHTML = activeSections
    .map(s => `<a href="#${s.id}" class="nav-item">${s.label}</a>`)
    .join('');
}

/* ─────────────────────────────────────────────
   Experience
───────────────────────────────────────────── */
const EXPAND_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`;

function buildExpCard(exp) {
  const badge   = exp.current ? '<span class="exp-badge">Current</span>' : '';
  const bullets = exp.bullets.map(b => `<li>${b}</li>`).join('');
  const tags    = exp.tags.map(t => `<span>${t}</span>`).join('');

  return `
    <div class="exp-card">
      <div class="card-topbar">
        <button class="exp-expand" onclick="openModal(this)" aria-label="Expand">${EXPAND_SVG}</button>
      </div>
      <div class="exp-body">
        <div class="exp-header">
          <span class="exp-period">${exp.period}</span>
          ${badge}
        </div>
        <h1 class="exp-role">${exp.role} <span>· ${exp.level}</span></h1>
        <h2 class="exp-company">${exp.company}</h2>
        <span class="exp-location">${exp.location}</span>
        <ul class="exp-bullets">${bullets}</ul>
      </div>
      <div class="exp-tags">${tags}</div>
    </div>`;
}

function buildExperience(experiences) {
  document.getElementById('exp-track').innerHTML = experiences.map(buildExpCard).join('');
}

/* ─────────────────────────────────────────────
   Projects
───────────────────────────────────────────── */
function buildProjectCard(project) {
  const mainImage = project.images?.[0] ?? '';
  const tags      = (project.tags ?? []).map(t => `<span>${t}</span>`).join('');
  const link      = project.link
    ? `<a class="project-link" href="${project.link}" target="_blank">View project ↗</a>`
    : '';

  return `
    <div class="project-card">
      ${mainImage ? `<div class="project-image"><img src="${mainImage}" alt="${project.name}" loading="lazy"></div>` : ''}
      <div class="project-info">
        <h3 class="project-name">${project.name}</h3>
        <p class="project-description">${project.description}</p>
        <div class="project-tags">${tags}</div>
        ${link}
      </div>
    </div>`;
}

function buildProjects(projects) {
  const track = document.getElementById('proj-track');
  track.innerHTML = projects.length
    ? projects.map(buildProjectCard).join('')
    : '<p class="no-projects">No projects to display.</p>';
}

/* ─────────────────────────────────────────────
   Contact
───────────────────────────────────────────── */
function buildContactItem(contact) {
  const targetAttr = contact.newTab ? 'target="_blank"' : '';
  return `
    <a class="contact-element" ${targetAttr} href="${contact.href}">
      <img src="${contact.icon}" alt="${contact.label}">
      <div class="contact-info">
        <span class="contact-label">${contact.label}</span>
        <span class="contact-value">${contact.value}</span>
      </div>
    </a>`;
}

function buildContact(contacts) {
  document.getElementById('contact-section').innerHTML = contacts.map(buildContactItem).join('');
}

/* ─────────────────────────────────────────────
   Section arrows – always point to the next active section
───────────────────────────────────────────── */
function setupSectionArrows(activeSections) {
  const firstId = activeSections[0]?.id;

  activeSections.forEach((section, i) => {
    const el = document.getElementById(section.id);
    if (!el) return;

    const arrow = el.querySelector('.section-arrow');
    if (arrow) {
      const next = activeSections[i + 1];
      if (next) {
        arrow.onclick = () => document.getElementById(next.id).scrollIntoView({ behavior: 'smooth' });
        arrow.style.display = '';
      } else {
        arrow.style.display = 'none';
      }
    }

    const goTop = el.querySelector('.go-top-btn');
    if (goTop && firstId) {
      goTop.onclick = () => document.getElementById(firstId).scrollIntoView({ behavior: 'smooth' });
    }
  });
}

/* ─────────────────────────────────────────────
   Tech Stack modal
───────────────────────────────────────────── */
function buildTechModal(technologies) {
  const content = technologies.map(group => {
    const chips = group.items.map(t => `<span class="tech-chip">${t}</span>`).join('');
    return `
      <div class="tech-group">
        <span class="tech-group-label">${group.category}</span>
        <div class="tech-chips">${chips}</div>
      </div>`;
  }).join('');
  document.getElementById('tech-modal-content').innerHTML = content;
}

function openTechModal() {
  document.getElementById('tech-modal').classList.add('open');
}

function closeTechModal() {
  document.getElementById('tech-modal').classList.remove('open');
}

/* ─────────────────────────────────────────────
   Experience modal
───────────────────────────────────────────── */
function openModal(btn) {
  const card = btn.closest('.exp-card');
  const modal = document.getElementById('exp-modal');
  modal.querySelector('.modal-content').innerHTML =
    card.querySelector('.exp-body').outerHTML +
    card.querySelector('.exp-tags').outerHTML;
  modal.classList.add('open');
}

function closeModal() {
  document.getElementById('exp-modal').classList.remove('open');
}

/* ─────────────────────────────────────────────
   Experience track scroll
───────────────────────────────────────────── */
function scrollExp(dir) {
  const track = document.querySelector('.exp-track');
  const card  = track?.querySelector('.exp-card');
  if (!card) return;
  const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
  track.scrollBy({ left: dir * (card.offsetWidth + gap), behavior: 'smooth' });
}

function scrollProj(dir) {
  const track = document.querySelector('.proj-track');
  const card  = track?.querySelector('.project-card');
  if (!card) return;
  const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
  track.scrollBy({ left: dir * (card.offsetWidth + gap), behavior: 'smooth' });
}

/* ─────────────────────────────────────────────
   Home – typing effect
───────────────────────────────────────────── */
function initTypingEffect() {
  const words = ['scalable APIs', 'high-performance mobile apps', 'modern interfaces'];
  const el = document.getElementById('typing-text');
  if (!el) return;

  let wordIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function tick() {
    const current = words[wordIndex];
    charIndex += deleting ? -1 : 1;
    el.textContent = current.slice(0, charIndex);

    let delay = deleting ? 45 : 75;

    if (!deleting && charIndex === current.length) {
      delay = 2200;
      deleting = true;
    } else if (deleting && charIndex === 0) {
      deleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      delay = 350;
    }

    setTimeout(tick, delay);
  }

  setTimeout(tick, 800);
}

/* ─────────────────────────────────────────────
   Bootstrap
───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const { sections, experience, contacts, projects, technologies } = loadData();
  const activeSections = sections.filter(s => s.active);

  buildNav(activeSections);

  sections.forEach(section => {
    const el = document.getElementById(section.id);
    if (!el) return;
    el.style.display = section.active ? '' : 'none';
  });

  if (sections.find(s => s.id === 'experience' && s.active)) buildExperience(experience);

  const projectsActive = sections.find(s => s.id === 'projects' && s.active);
  if (projectsActive) buildProjects(projects);
  const viewProjectsBtn = document.querySelector('.cta-primary[href="#projects"]');
  if (viewProjectsBtn) {
    if (projectsActive) {
      viewProjectsBtn.href = '#projects';
      viewProjectsBtn.textContent = 'View Projects';
    } else {
      viewProjectsBtn.href = '#experience';
      viewProjectsBtn.textContent = 'View Experience';
    }
  }

  if (sections.find(s => s.id === 'contact'    && s.active)) buildContact(contacts);

  setupSectionArrows(activeSections);
  initTypingEffect();
  buildTechModal(technologies);

  /* Modal event listeners */
  const modal = document.getElementById('exp-modal');
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  const techModal = document.getElementById('tech-modal');
  techModal.addEventListener('click', e => { if (e.target === techModal) closeTechModal(); });

  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeTechModal(); } });
});
