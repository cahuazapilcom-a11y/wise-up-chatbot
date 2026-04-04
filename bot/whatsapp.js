const axios = require('axios');
 
const WHATSAPP_TOKEN  = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
 
async function sendWhatsAppText(to, body) {
    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
        throw new Error('Faltan WHATSAPP_TOKEN o PHONE_NUMBER_ID en las variables de entorno');
    }
 
    await axios.post(
        `https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`,
        {
            messaging_product: 'whatsapp',
            to,
            text: { body }
        },
        {
            headers: {
                Authorization: `Bearer ${WHATSAPP_TOKEN}`,
                'Content-Type': 'application/json'
            }
        }
    );
}
 
module.exports = { sendWhatsAppText };