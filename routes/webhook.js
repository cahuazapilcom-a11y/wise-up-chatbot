const express = require('express');
const router = express.Router();
const { procesarMensaje } = require('../bot/processor');
const { sendWhatsAppText } = require('../bot/whatsapp');
 
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'nodemon';
 
// ── Verificación de webhook con Meta ──
router.get('/', (req, res) => {
    const mode      = req.query['hub.mode'];
    const token     = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
 
    console.log('📥 Verificación webhook recibida:', req.query);
 
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ Webhook verificado correctamente con Meta');
        return res.status(200).send(challenge);
    }
 
    console.log('❌ Error de verificación webhook');
    return res.sendStatus(403);
});
 
// ── Recepción de mensajes desde Meta ──
router.post('/', async (req, res) => {
    try {
        console.log('📩 Evento recibido en /webhook');
 
        const change  = req.body?.entry?.[0]?.changes?.[0];
        const value   = change?.value;
        const message = value?.messages?.[0];
 
        // Responder inmediatamente a Meta
        res.sendStatus(200);
 
        if (!message) return;
 
        if (message.type !== 'text') {
            await sendWhatsAppText(message.from, 'Por ahora solo puedo procesar mensajes de texto 😊');
            return;
        }
 
        const from          = message.from;
        const textoOriginal = message?.text?.body || '';
        const nombreUsuario = value?.contacts?.[0]?.profile?.name || 'amigo(a)';
 
        await procesarMensaje({ from, nombreUsuario, textoOriginal });
 
    } catch (error) {
        console.error('❌ Error en webhook:', error.response?.data || error.message);
        if (!res.headersSent) res.sendStatus(500);
    }
});
 
module.exports = router;