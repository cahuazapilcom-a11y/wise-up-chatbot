const express = require('express');
const router = express.Router();
const { crmManager } = require('../crm/CRMManager');
 
const CRM_KEY = process.env.CRM_SECRET_KEY || 'wiseup2024';
 
// ── Middleware de autenticación simple ──
function auth(req, res, next) {
    const key = req.query.key || req.headers['x-crm-key'];
    if (key === CRM_KEY) return next();
 
    if (req.method === 'GET' && (req.path === '/' || req.path === '')) {
        return res.send(loginPage());
    }
    return res.status(401).json({ error: 'No autorizado. Usa ?key=TU_CLAVE' });
}
 
router.use(express.json());
router.use(auth);
 
// ── Dashboard HTML ──
router.get('/', (req, res) => {
    res.send(dashboardPage(req.query.key));
});
 
// ── API REST ──
router.get('/api/stats', (req, res) => {
    res.json(crmManager.obtenerEstadisticas());
});
 
router.get('/api/leads', (req, res) => {
    const { stage, classification, search } = req.query;
    const filtros = {};
    if (stage)          filtros.stage = stage;
    if (classification) filtros.classification = classification;
    if (search)         filtros.search = search;
    res.json(crmManager.obtenerTodos(filtros));
});
 
router.get('/api/leads/:phone', (req, res) => {
    const lead = crmManager.obtenerLead(req.params.phone);
    if (!lead) return res.status(404).json({ error: 'Lead no encontrado' });
    res.json(lead);
});
 
router.get('/api/leads/:phone/interactions', (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    res.json(crmManager.obtenerInteracciones(req.params.phone, limit));
});
 
router.put('/api/leads/:phone', (req, res) => {
    const { stage, classification, notes } = req.body;
    crmManager.actualizarLead(req.params.phone, { stage, classification, notes });
    res.json({ success: true });
});
 
router.get('/api/citas', (req, res) => {
    res.json(crmManager.obtenerCitas());
});
 
// ── Exportar CSV ──
router.get('/export/csv', (req, res) => {
    const leads = crmManager.obtenerTodos();
    const headers = [
        'ID','Teléfono','Nombre','Email','Edad','Programa','Horario Preferido',
        'Etapa','Clasificación','Interacciones','Primer Contacto','Último Contacto','Notas'
    ];
    const rows = leads.map(l =>
        [l.id, l.phone, l.name, l.email, l.age, l.program_interest, l.schedule_pref,
         l.stage, l.classification, l.total_interactions, l.created_at, l.last_contact, l.notes]
        .map(v => `"${(v ?? '').toString().replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition',
        `attachment; filename="leads-wiseup-${new Date().toISOString().slice(0,10)}.csv"`);
    res.send('\uFEFF' + csv);
});
 
// ================================================================
// PÁGINAS HTML
// ================================================================
function loginPage() {
    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Wise Up CRM - Acceso</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Arial,sans-serif;background:#1a1a2e;min-height:100vh;display:flex;align-items:center;justify-content:center}
  .card{background:#fff;border-radius:16px;padding:40px;width:360px;box-shadow:0 20px 60px rgba(0,0,0,.4);text-align:center}
  .logo{font-size:2.5rem;font-weight:900;color:#c41e3a;letter-spacing:-1px}
  .sub{color:#666;margin:8px 0 28px;font-size:.9rem}
  label{display:block;text-align:left;font-size:.8rem;font-weight:600;color:#555;margin-bottom:6px}
  input{width:100%;padding:12px 14px;border:2px solid #e0e0e0;border-radius:8px;font-size:1rem;outline:none;transition:.2s}
  input:focus{border-color:#c41e3a}
  button{width:100%;padding:13px;background:#c41e3a;color:#fff;border:none;border-radius:8px;font-size:1rem;font-weight:700;cursor:pointer;margin-top:16px;transition:.2s}
  button:hover{background:#a01830}
  .err{color:#c41e3a;font-size:.85rem;margin-top:10px;display:none}
</style>
</head>
<body>
<div class="card">
  <div class="logo">WISE UP</div>
  <div class="sub">CRM Dashboard — Acceso restringido</div>
  <label>Clave de acceso</label>
  <input type="password" id="k" placeholder="Ingresa tu clave" onkeydown="if(event.key==='Enter')login()">
  <button onclick="login()">Ingresar al CRM</button>
  <div class="err" id="err">Clave incorrecta. Intenta de nuevo.</div>
</div>
<script>
function login(){
  const k=document.getElementById('k').value.trim();
  if(!k)return;
  window.location.href='/crm?key='+encodeURIComponent(k);
}
</script>
</body>
</html>`;
}
 
function dashboardPage(key) {
    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Wise Up CRM</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;background:#f0f2f5;color:#333;min-height:100vh}
 
/* HEADER */
header{background:#c41e3a;color:#fff;padding:0 24px;height:60px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;box-shadow:0 2px 8px rgba(0,0,0,.2)}
header .brand{font-size:1.3rem;font-weight:900;letter-spacing:-0.5px}
header .brand span{opacity:.7;font-weight:400;font-size:.9rem;margin-left:8px}
header .actions{display:flex;gap:10px;align-items:center}
header button{padding:7px 14px;border:2px solid rgba(255,255,255,.5);background:transparent;color:#fff;border-radius:6px;cursor:pointer;font-size:.82rem;font-weight:600;transition:.2s}
header button:hover{background:rgba(255,255,255,.15)}
header button.primary{background:#fff;color:#c41e3a;border-color:#fff}
#refreshTime{font-size:.75rem;opacity:.6;margin-right:4px}
 
/* MAIN */
main{padding:24px;max-width:1400px;margin:0 auto}
 
/* STATS */
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:24px}
.stat-card{background:#fff;border-radius:12px;padding:20px;box-shadow:0 1px 4px rgba(0,0,0,.08);border-left:4px solid #ccc}
.stat-card.red{border-color:#c41e3a}.stat-card.green{border-color:#28a745}
.stat-card.orange{border-color:#fd7e14}.stat-card.blue{border-color:#007bff}
.stat-card.purple{border-color:#6f42c1}
.stat-card .label{font-size:.75rem;text-transform:uppercase;letter-spacing:.5px;color:#888;font-weight:600}
.stat-card .value{font-size:2rem;font-weight:900;margin:4px 0 0;color:#1a1a2e}
 
/* PIPELINE */
.section-title{font-size:.85rem;text-transform:uppercase;letter-spacing:.5px;color:#888;font-weight:700;margin-bottom:12px}
.pipeline{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:24px}
.pipe-col{background:#fff;border-radius:12px;padding:16px;box-shadow:0 1px 4px rgba(0,0,0,.08);text-align:center}
.pipe-col .pipe-label{font-size:.7rem;text-transform:uppercase;letter-spacing:.5px;font-weight:700;margin-bottom:8px}
.pipe-col .pipe-count{font-size:2rem;font-weight:900}
.pipe-col.nuevo{border-top:4px solid #007bff}.pipe-col.nuevo .pipe-count{color:#007bff}
.pipe-col.interesado{border-top:4px solid #fd7e14}.pipe-col.interesado .pipe-count{color:#fd7e14}
.pipe-col.cita{border-top:4px solid #28a745}.pipe-col.cita .pipe-count{color:#28a745}
.pipe-col.cliente{border-top:4px solid #6f42c1}.pipe-col.cliente .pipe-count{color:#6f42c1}
.pipe-col.inactivo{border-top:4px solid #aaa}.pipe-col.inactivo .pipe-count{color:#aaa}
 
/* TOOLBAR */
.toolbar{display:flex;gap:10px;align-items:center;margin-bottom:16px;flex-wrap:wrap}
.toolbar input,.toolbar select{padding:9px 12px;border:1.5px solid #ddd;border-radius:8px;font-size:.88rem;outline:none;background:#fff}
.toolbar input:focus,.toolbar select:focus{border-color:#c41e3a}
.toolbar input{flex:1;min-width:200px}
.btn-export{padding:9px 16px;background:#28a745;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:.85rem;font-weight:700;white-space:nowrap}
.btn-export:hover{background:#1e7e34}
 
/* TABLE */
.table-wrap{background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.08);overflow:hidden}
table{width:100%;border-collapse:collapse;font-size:.85rem}
thead{background:#1a1a2e;color:#fff}
th{padding:12px 14px;text-align:left;font-weight:600;white-space:nowrap}
td{padding:11px 14px;border-bottom:1px solid #f0f2f5;vertical-align:middle}
tr:last-child td{border-bottom:none}
tr.data-row:hover{background:#fafbff;cursor:pointer}
.no-data{text-align:center;padding:40px;color:#aaa}
 
/* BADGES */
.badge{display:inline-block;padding:3px 9px;border-radius:20px;font-size:.72rem;font-weight:700;white-space:nowrap}
.badge-nuevo{background:#e3f2fd;color:#1565c0}
.badge-interesado{background:#fff3e0;color:#e65100}
.badge-cita{background:#e8f5e9;color:#2e7d32}
.badge-cliente{background:#f3e5f5;color:#6a1b9a}
.badge-inactivo{background:#f5f5f5;color:#757575}
.badge-frio{background:#e3f2fd;color:#1976d2}
.badge-tibio{background:#fff8e1;color:#f57f17}
.badge-caliente{background:#ffebee;color:#c62828}
 
/* MODAL */
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:200;padding:16px}
.overlay.hidden{display:none}
.modal{background:#fff;border-radius:16px;width:100%;max-width:700px;max-height:90vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.3)}
.modal-header{background:#1a1a2e;color:#fff;padding:20px 24px;display:flex;align-items:center;justify-content:space-between}
.modal-header h2{font-size:1.1rem}
.modal-close{background:none;border:none;color:#fff;font-size:1.4rem;cursor:pointer;opacity:.7;line-height:1}
.modal-close:hover{opacity:1}
.modal-body{padding:24px;overflow-y:auto;flex:1}
.modal-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 20px;margin-bottom:20px}
.field{display:flex;flex-direction:column;gap:3px}
.field .flabel{font-size:.72rem;text-transform:uppercase;letter-spacing:.5px;color:#888;font-weight:700}
.field .fval{font-size:.92rem;color:#1a1a2e;font-weight:500}
.field .fval.empty{color:#ccc;font-style:italic}
.modal-actions{display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap}
.modal-actions select{padding:7px 10px;border:1.5px solid #ddd;border-radius:6px;font-size:.83rem;flex:1}
.modal-actions button{padding:7px 14px;border:none;border-radius:6px;font-size:.83rem;font-weight:700;cursor:pointer;white-space:nowrap}
.btn-save{background:#c41e3a;color:#fff}.btn-save:hover{background:#a01830}
.interactions-title{font-size:.8rem;text-transform:uppercase;letter-spacing:.5px;color:#888;font-weight:700;margin-bottom:10px}
.chat-log{display:flex;flex-direction:column;gap:6px;max-height:260px;overflow-y:auto;padding:4px 0}
.msg{max-width:80%;padding:8px 12px;border-radius:10px;font-size:.82rem;line-height:1.4}
.msg-in{background:#f0f2f5;color:#333;align-self:flex-start;border-bottom-left-radius:2px}
.msg-out{background:#c41e3a;color:#fff;align-self:flex-end;border-bottom-right-radius:2px}
.msg-time{font-size:.65rem;opacity:.6;margin-top:3px}
.notes-area{width:100%;padding:10px;border:1.5px solid #ddd;border-radius:8px;font-size:.85rem;resize:vertical;min-height:70px;outline:none;margin-top:8px}
.notes-area:focus{border-color:#c41e3a}
@media(max-width:600px){
  .pipeline{grid-template-columns:repeat(3,1fr)}
  .modal-grid{grid-template-columns:1fr}
  .stats-grid{grid-template-columns:repeat(2,1fr)}
}
</style>
</head>
<body>
 
<header>
  <div class="brand">WISE UP <span>CRM Dashboard</span></div>
  <div class="actions">
    <span id="refreshTime"></span>
    <button onclick="loadData()">↻ Actualizar</button>
    <button class="primary" onclick="exportCSV()">⬇ CSV</button>
  </div>
</header>
 
<main>
  <!-- Stats -->
  <div class="stats-grid" id="stats-grid">
    <div class="stat-card red"><div class="label">Total Leads</div><div class="value" id="s-total">–</div></div>
    <div class="stat-card orange"><div class="label">Leads Calientes</div><div class="value" id="s-caliente">–</div></div>
    <div class="stat-card green"><div class="label">Citas Agendadas</div><div class="value" id="s-citas">–</div></div>
    <div class="stat-card blue"><div class="label">Interacciones</div><div class="value" id="s-interac">–</div></div>
    <div class="stat-card purple"><div class="label">Clientes</div><div class="value" id="s-clientes">–</div></div>
  </div>
 
  <!-- Pipeline -->
  <div class="section-title">Pipeline de Ventas</div>
  <div class="pipeline">
    <div class="pipe-col nuevo"><div class="pipe-label">Nuevo</div><div class="pipe-count" id="p-nuevo">–</div></div>
    <div class="pipe-col interesado"><div class="pipe-label">Interesado</div><div class="pipe-count" id="p-interesado">–</div></div>
    <div class="pipe-col cita"><div class="pipe-label">Cita Agendada</div><div class="pipe-count" id="p-cita">–</div></div>
    <div class="pipe-col cliente"><div class="pipe-label">Cliente</div><div class="pipe-count" id="p-cliente">–</div></div>
    <div class="pipe-col inactivo"><div class="pipe-label">Inactivo</div><div class="pipe-count" id="p-inactivo">–</div></div>
  </div>
 
  <!-- Toolbar -->
  <div class="toolbar">
    <input type="search" id="searchInput" placeholder="🔍 Buscar por nombre, teléfono o email..." oninput="filterTable()">
    <select id="filterStage" onchange="filterTable()">
      <option value="">Todas las etapas</option>
      <option>NUEVO</option><option>INTERESADO</option><option>CITA_AGENDADA</option>
      <option>CLIENTE</option><option>INACTIVO</option>
    </select>
    <select id="filterClass" onchange="filterTable()">
      <option value="">Todas las clasificaciones</option>
      <option>FRIO</option><option>TIBIO</option><option>CALIENTE</option>
    </select>
    <button class="btn-export" onclick="exportCSV()">⬇ Exportar CSV</button>
  </div>
 
  <!-- Table -->
  <div class="section-title" id="leads-count-label">Leads</div>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>#</th><th>Nombre</th><th>Teléfono</th><th>Email</th>
          <th>Programa</th><th>Etapa</th><th>Clasificación</th>
          <th>Contactos</th><th>Último contacto</th>
        </tr>
      </thead>
      <tbody id="leads-tbody"></tbody>
    </table>
  </div>
</main>
 
<!-- Modal de detalle de lead -->
<div class="overlay hidden" id="modal-overlay" onclick="closeModal(event)">
  <div class="modal" onclick="event.stopPropagation()">
    <div class="modal-header">
      <h2 id="modal-title">Detalle del Lead</h2>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <div class="modal-grid" id="modal-grid"></div>
      <div class="modal-actions">
        <select id="modal-stage">
          <option value="">— Cambiar etapa —</option>
          <option>NUEVO</option><option>INTERESADO</option><option>CITA_AGENDADA</option>
          <option>CLIENTE</option><option>INACTIVO</option>
        </select>
        <select id="modal-class">
          <option value="">— Cambiar clasificación —</option>
          <option>FRIO</option><option>TIBIO</option><option>CALIENTE</option>
        </select>
        <button class="btn-save" onclick="saveLead()">Guardar cambios</button>
      </div>
      <div>
        <div class="interactions-title">Notas internas</div>
        <textarea id="modal-notes" class="notes-area" placeholder="Escribe notas sobre este lead..."></textarea>
      </div>
      <br>
      <div class="interactions-title">Historial de conversación</div>
      <div class="chat-log" id="modal-chat"></div>
    </div>
  </div>
</div>
 
<script>
const KEY = ${JSON.stringify(key)};
const BASE = '/crm';
let allLeads = [];
let currentPhone = null;
 
async function api(path) {
  const r = await fetch(BASE + path + (path.includes('?') ? '&' : '?') + 'key=' + KEY);
  return r.json();
}
 
async function loadData() {
  try {
    const [stats, leads] = await Promise.all([api('/api/stats'), api('/api/leads')]);
    renderStats(stats);
    renderPipeline(stats);
    allLeads = leads;
    filterTable();
    document.getElementById('refreshTime').textContent = 'Act: ' + new Date().toLocaleTimeString('es-PE');
  } catch(e) { console.error(e); }
}
 
function renderStats(s) {
  document.getElementById('s-total').textContent   = s.totalLeads;
  document.getElementById('s-caliente').textContent = s.clasificacion.caliente;
  document.getElementById('s-citas').textContent   = s.totalCitas;
  document.getElementById('s-interac').textContent = s.totalInteracciones;
  document.getElementById('s-clientes').textContent = s.pipeline.cliente;
}
 
function renderPipeline(s) {
  document.getElementById('p-nuevo').textContent     = s.pipeline.nuevo;
  document.getElementById('p-interesado').textContent = s.pipeline.interesado;
  document.getElementById('p-cita').textContent      = s.pipeline.citaAgendada;
  document.getElementById('p-cliente').textContent   = s.pipeline.cliente;
  document.getElementById('p-inactivo').textContent  = s.pipeline.inactivo;
}
 
function stageBadge(s) {
  const map = {NUEVO:'nuevo',INTERESADO:'interesado',CITA_AGENDADA:'cita',CLIENTE:'cliente',INACTIVO:'inactivo'};
  const lbl = {CITA_AGENDADA:'CITA AGENDADA'};
  return '<span class="badge badge-' + (map[s]||'nuevo') + '">' + (lbl[s]||s) + '</span>';
}
 
function classBadge(c) {
  return '<span class="badge badge-' + (c||'frio').toLowerCase() + '">' + (c||'FRIO') + '</span>';
}
 
function filterTable() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const stage  = document.getElementById('filterStage').value;
  const cls    = document.getElementById('filterClass').value;
 
  const filtered = allLeads.filter(l => {
    const matchSearch = !search || [l.name,l.phone,l.email].join(' ').toLowerCase().includes(search);
    const matchStage  = !stage || l.stage === stage;
    const matchCls    = !cls   || l.classification === cls;
    return matchSearch && matchStage && matchCls;
  });
 
  document.getElementById('leads-count-label').textContent = 'Leads (' + filtered.length + ')';
  renderTable(filtered);
}
 
function renderTable(leads) {
  const tbody = document.getElementById('leads-tbody');
  if (!leads.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="no-data">No se encontraron leads con esos filtros.</td></tr>';
    return;
  }
  tbody.innerHTML = leads.map((l,i) => \`
    <tr class="data-row" onclick="openModal('\${l.phone}')">
      <td>\${i+1}</td>
      <td><strong>\${l.name || '<em style=color:#ccc>Sin nombre</em>'}</strong></td>
      <td>\${l.phone}</td>
      <td>\${l.email || '—'}</td>
      <td>\${l.program_interest || '—'}</td>
      <td>\${stageBadge(l.stage)}</td>
      <td>\${classBadge(l.classification)}</td>
      <td style="text-align:center">\${l.total_interactions}</td>
      <td style="font-size:.8rem;color:#888">\${l.last_contact}</td>
    </tr>
  \`).join('');
}
 
async function openModal(phone) {
  currentPhone = phone;
  const [lead, interactions] = await Promise.all([
    api('/api/leads/' + phone),
    api('/api/leads/' + phone + '/interactions')
  ]);
 
  document.getElementById('modal-title').textContent = lead.name || lead.phone;
  document.getElementById('modal-overlay').classList.remove('hidden');
 
  document.getElementById('modal-stage').value = lead.stage || '';
  document.getElementById('modal-class').value = lead.classification || '';
  document.getElementById('modal-notes').value = lead.notes || '';
 
  const fields = [
    ['Teléfono', lead.phone],['Nombre', lead.name],['Email', lead.email],
    ['Edad', lead.age],['Programa', lead.program_interest],['Horario', lead.schedule_pref],
    ['Primer contacto', lead.created_at],['Último contacto', lead.last_contact],
    ['Total interacciones', lead.total_interactions]
  ];
 
  document.getElementById('modal-grid').innerHTML = fields.map(([l,v]) => \`
    <div class="field">
      <div class="flabel">\${l}</div>
      <div class="fval \${!v ? 'empty':''}">\${v || 'Sin dato'}</div>
    </div>
  \`).join('');
 
  const reversed = [...interactions].reverse();
  document.getElementById('modal-chat').innerHTML = reversed.length
    ? reversed.map(m => \`
        <div>
          <div class="msg \${m.direction==='IN'?'msg-in':'msg-out'}">\${escHtml(m.message)}</div>
          <div class="msg-time" style="text-align:\${m.direction==='IN'?'left':'right'}">\${m.created_at}</div>
        </div>
      \`).join('')
    : '<div style="color:#ccc;font-size:.85rem">Sin interacciones registradas.</div>';
 
  // Scroll al final del chat
  setTimeout(() => {
    const chat = document.getElementById('modal-chat');
    chat.scrollTop = chat.scrollHeight;
  }, 50);
}
 
function escHtml(s) {
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
 
async function saveLead() {
  if (!currentPhone) return;
  const stage          = document.getElementById('modal-stage').value;
  const classification = document.getElementById('modal-class').value;
  const notes          = document.getElementById('modal-notes').value;
 
  await fetch(BASE + '/api/leads/' + currentPhone + '?key=' + KEY, {
    method: 'PUT',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ stage: stage||undefined, classification: classification||undefined, notes })
  });
 
  await loadData();
  closeModal();
}
 
function closeModal(e) {
  if (e && e.target !== document.getElementById('modal-overlay')) return;
  document.getElementById('modal-overlay').classList.add('hidden');
  currentPhone = null;
}
 
function exportCSV() {
  window.location.href = BASE + '/export/csv?key=' + KEY;
}
 
// Auto-refresh cada 30 segundos
loadData();
setInterval(loadData, 30000);
</script>
</body>
</html>`;
}
 
module.exports = router;