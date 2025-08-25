const UI_TEXT = {
  carryOn: 'Carry-on',
  checked: 'Checked baggage',
  customs: 'Customs (destination import)',
};

const STATUS_TO_CLASS = {
  allowed: 'ok',
  restricted: 'warn',
  prohibited: 'danger',
  unknown: 'unknown',
};

async function loadRules() {
  const res = await fetch('./data/rules.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load rules');
  return res.json();
}

function getAllCountriesFromRoutes(routes) {
  const set = new Set();
  Object.keys(routes).forEach(key => {
    const [o, d] = key.split('->');
    if (o) set.add(o);
    if (d) set.add(d);
  });
  return Array.from(set).sort();
}

function populateSelect(selectEl, values) {
  selectEl.innerHTML = '';
  const frag = document.createDocumentFragment();
  values.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    frag.appendChild(opt);
  });
  selectEl.appendChild(frag);
}

function normalize(text) {
  return (text || '').toString().trim().toLowerCase();
}

function matchScore(item, q) {
  if (!q) return 0;
  const n = normalize(q);
  const hay = [item.name, ...(item.keywords || [])].map(normalize).join(' | ');
  if (hay.includes(n)) return 3;
  const parts = n.split(/\s+/).filter(Boolean);
  let score = 0;
  for (const p of parts) {
    if (hay.includes(p)) score += 1;
  }
  return score;
}

function statusBadge(text, status) {
  const span = document.createElement('span');
  span.className = `badge ${STATUS_TO_CLASS[status] || 'unknown'}`;
  span.textContent = `${text}: ${status.charAt(0).toUpperCase() + status.slice(1)}`;
  return span;
}

function renderItemCard(container, item) {
  const card = document.createElement('div');
  card.className = 'card';

  const title = document.createElement('h3');
  title.textContent = item.name;
  card.appendChild(title);

  const badgeRow = document.createElement('div');
  badgeRow.className = 'badge-row';
  badgeRow.appendChild(statusBadge(UI_TEXT.carryOn, item.carry_on?.status || 'unknown'));
  badgeRow.appendChild(statusBadge(UI_TEXT.checked, item.checked?.status || 'unknown'));
  badgeRow.appendChild(statusBadge(UI_TEXT.customs, item.customs?.status || 'unknown'));
  card.appendChild(badgeRow);

  const details = document.createElement('div');
  details.className = 'kv';
  details.innerHTML = `
    <div><strong>${UI_TEXT.carryOn}:</strong> ${item.carry_on?.conditions || '—'}</div>
    <div><strong>${UI_TEXT.checked}:</strong> ${item.checked?.conditions || '—'}</div>
    <div><strong>${UI_TEXT.customs}:</strong> ${item.customs?.conditions || '—'}</div>
    ${item.notes ? `<div><strong>Notes:</strong> ${item.notes}</div>` : ''}
    ${item.sources?.length ? `<div><strong>Refs:</strong> ${item.sources.map(s => `<a href="${s.url}" target="_blank" rel="noopener">${s.label}</a>`).join(' • ')}</div>` : ''}
  `;
  card.appendChild(details);

  container.appendChild(card);
}

function renderResults(container, items, query) {
  container.innerHTML = '';
  if (!items || items.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = query ? 'No matching items for this route. Try different keywords.' : 'Select origin and destination, then type an item to see rules.';
    container.appendChild(empty);
    return;
  }
  const limited = items.slice(0, 20);
  limited.forEach(item => renderItemCard(container, item));
}

function getRouteKey(origin, destination) {
  return `${origin}->${destination}`;
}

function searchItemsForRoute(route, query) {
  if (!route) return [];
  if (!query) return route.items || [];
  const scored = (route.items || []).map(it => ({ item: it, score: matchScore(it, query) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.map(x => x.item);
}

function pickDefaultCountry(countries, pref) {
  if (pref && countries.includes(pref)) return pref;
  if (countries.includes('CN')) return 'CN';
  if (countries.includes('US')) return 'US';
  return countries[0];
}

async function main() {
  const els = {
    origin: document.getElementById('origin'),
    destination: document.getElementById('destination'),
    query: document.getElementById('query'),
    results: document.getElementById('results'),
  };

  const data = await loadRules();
  const countries = getAllCountriesFromRoutes(data.routes);
  populateSelect(els.origin, countries);
  populateSelect(els.destination, countries);

  els.origin.value = pickDefaultCountry(countries, 'CN');
  els.destination.value = countries.includes('US') ? 'US' : countries[0];

  function handleSearch() {
    const origin = els.origin.value;
    const destination = els.destination.value;
    const q = els.query.value;
    const routeKey = getRouteKey(origin, destination);
    const route = data.routes[routeKey];
    const items = searchItemsForRoute(route, q);
    renderResults(els.results, items, q);
  }

  els.origin.addEventListener('change', handleSearch);
  els.destination.addEventListener('change', handleSearch);
  els.query.addEventListener('input', handleSearch);

  handleSearch();
}

main().catch(err => {
  const results = document.getElementById('results');
  results.innerHTML = '';
  const div = document.createElement('div');
  div.className = 'empty';
  div.textContent = 'Failed to initialize app: ' + err.message;
  results.appendChild(div);
  // eslint-disable-next-line no-console
  console.error(err);
});

