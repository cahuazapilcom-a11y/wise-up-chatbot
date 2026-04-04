require('dotenv').config();
const express = require('express');
 
// ── Inicializar base de datos antes que todo ──
require('./config/database');
 
const { getActiveChats } = require('./bot/processor');
const webhookRouter = require('./routes/webhook');
const crmRouter     = require('./routes/crm');

 
const app  = express();
const PORT = process.env.PORT || 3000;
 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
 
// ── Rutas ──
app.use('/webhook', webhookRouter);
app.use('/crm',     crmRouter);
 
// ── Estado del servidor ──
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Wise Up ChatBot</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;background:#f0f2f5;min-height:100vh;display:flex;align-items:center;justify-content:center}
.card{background:#fff;border-radius:16px;padding:40px;max-width:480px;width:90%;box-shadow:0 4px 20px rgba(0,0,0,.1);text-align:center}
h1{color:#c41e3a;font-size:1.8rem;margin-bottom:4px}
.sub{color:#888;font-size:.9rem;margin-bottom:24px}
.badge{display:inline-block;background:#e8f5e9;color:#2e7d32;padding:8px 20px;border-radius:20px;font-weight:700;font-size:.95rem;margin-bottom:24px}
.info{background:#f8f9fa;border-radius:10px;padding:16px;text-align:left;font-size:.85rem;line-height:1.8}
.info span{color:#888;width:140px;display:inline-block}
a{color:#c41e3a;text-decoration:none;font-weight:600}
a:hover{text-decoration:underline}
.links{margin-top:20px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.links a{padding:9px 18px;background:#c41e3a;color:#fff;border-radius:8px;font-size:.85rem}
.links a.sec{background:#1a1a2e}
</style>
</head>
<body>
<div class="card">
  <h1>🎓 WISE UP</h1>
  <div class="sub">WhatsApp ChatBot + CRM</div>
  <div class="badge">✅ Bot activo</div>
  <div class="info">
    <div><span>Fecha:</span> ${new Date().toLocaleString('es-PE')}</div>
    <div><span>Webhook:</span> /webhook</div>
    <div><span>CRM:</span> /crm</div>
    <div><span>Chats activos:</span> ${getActiveChats()}</div>
    <div><span>Node.js:</span> ${process.version}</div>
    <div><span>Entorno:</span> ${process.env.NODE_ENV || 'development'}</div>
  </div>
  <div class="links">
    <a href="/crm">Abrir CRM</a>
    <a class="sec" href="/health">Health Check</a>
  </div>
</div>
</body>
</html>`);
});
 
app.get('/health', (req, res) => {
    res.json({
        status:      'OK',
        timestamp:   new Date().toISOString(),
        uptime:      process.uptime(),
        activeChats: getActiveChats()
    });
});
 
// ── Inicio del servidor ──
app.listen(PORT, () => {
    console.log('\n🚀 ========================================');
    console.log(`   WISE UP BOT + CRM — PUERTO ${PORT}`);
    console.log('========================================');
    console.log(`\n🌐 URL local:    http://localhost:${PORT}`);
    console.log(`📊 CRM:          http://localhost:${PORT}/crm`);
    console.log(`🔑 CRM clave:    ${process.env.CRM_SECRET_KEY || 'wiseup2024'}`);
    console.log(`📡 Webhook:      http://localhost:${PORT}/webhook\n`);
});
 
process.on('unhandledRejection', (err) => console.error('❌ unhandledRejection:', err));
process.on('uncaughtException',  (err) => console.error('❌ uncaughtException:',  err));

