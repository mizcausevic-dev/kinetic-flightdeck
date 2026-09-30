const $ = (id) => document.getElementById(id);
const el = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = String(text);
  if (className) node.className = className;
  return node;
};
const badge = (label, kind) => el('span', label, `badge ${kind}`);
const metric = (label, value, detail) => {
  const node = el('div', undefined, 'metric');
  node.append(el('span', label), el('strong', value), el('small', detail));
  return node;
};
const getJson = async (path) => {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok || response.headers.get('X-Data-Mode') !== 'synthetic-demo') {
    throw new Error(`Unexpected API response for ${path}`);
  }
  return response.json();
};

async function load() {
  try {
    const [summary, matrix, incidents, owners] = await Promise.all([
      getJson('/api/flightdeck/summary'),
      getJson('/api/flightdeck/risk-matrix'),
      getJson('/api/flightdeck/incidents'),
      getJson('/api/flightdeck/owners'),
    ]);
    if (summary.dataMode !== 'synthetic-demo') throw new Error('Expected synthetic demo mode');
    $('generated-at').textContent = 'May 2026 fixture · Local API response';
    $('metrics').replaceChildren(
      metric('Entities', summary.headline.totalEntities, 'Fixture entities'),
      metric('Average score', summary.headline.averageComposite, 'Illustrative composite'),
      metric('Production at risk', summary.headline.productionAtRisk, 'Fixture classification'),
      metric('Open incidents', summary.headline.openIncidents, 'Sample history'),
      metric('Critical incidents', summary.headline.criticalIncidents, 'Sample history'),
      metric('Teams flagged', summary.headline.teamsNeedingAttention, 'Fixture teams'),
    );
    $('risks').replaceChildren(...summary.topRiskEntities.map((risk) => {
      const node = el('article', undefined, 'risk');
      const head = el('div', undefined, 'risk-head');
      head.append(el('h3', risk.name), badge(risk.status, risk.status));
      node.append(head, el('div', risk.composite.overall, 'score'), el('p', `${risk.ownerTeam} · ${risk.environment} · ${risk.entityType.replace('_', ' ')}`), el('p', risk.recommendedNextAction));
      return node;
    }));
    $('matrix-count').textContent = `${matrix.entities.length} entities × ${matrix.dimensions.length} dimensions`;
    const table = $('matrix');
    const header = el('tr');
    for (const label of ['Entity', ...matrix.dimensions]) {
      const heading = el('th', label);
      heading.scope = 'col';
      header.append(heading);
    }
    const thead = el('thead');
    thead.append(header);
    const tbody = el('tbody');
    for (const entityId of matrix.entities) {
      const row = el('tr');
      const rowHeading = el('th', entityId);
      rowHeading.scope = 'row';
      row.append(rowHeading);
      for (const dimension of matrix.dimensions) {
        const cell = matrix.cells.find((item) => item.entityId === entityId && item.dimension === dimension);
        const td = el('td');
        const level = el('span', cell.level, `level ${cell.level}`);
        level.title = cell.rationale;
        td.append(level);
        row.append(td);
      }
      tbody.append(row);
    }
    const caption = table.caption;
    if (!caption) throw new Error('Risk matrix caption missing');
    table.replaceChildren(caption, thead, tbody);
    $('owners').replaceChildren(...owners.teams.map((team) => {
      const node = el('article', undefined, 'owner');
      const head = el('div', undefined, 'owner-head');
      head.append(el('h3', team.ownerTeam), badge(team.status, team.status === 'attention-needed' ? 'critical' : 'healthy'));
      node.append(head, el('p', `${team.ownedEntities} entities · ${team.openIncidents} open incidents · $${team.monthlyCostUsd} monthly fixture cost`));
      return node;
    }));
    $('incidents').replaceChildren(...[...incidents.incidents].sort((a, b) => b.detectedAt.localeCompare(a.detectedAt)).map((incident) => {
      const item = el('li');
      const time = el('time', `${incident.detectedAt.slice(0, 10)} ${incident.detectedAt.slice(11, 16)}Z`);
      time.dateTime = incident.detectedAt;
      item.append(time, el('span', incident.source, 'source'), el('span', incident.severity, `severity ${incident.severity}`), el('span', incident.message, 'message'));
      return item;
    }));
    $('dashboard').hidden = false;
    $('load-status').textContent = 'Loaded from local synthetic API';
  } catch (error) {
    $('load-status').textContent = 'Could not load the local API. Start the Flightdeck server, then reload this preview.';
    console.error(error);
  }
}

load();
