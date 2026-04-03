require('dotenv').config();
const express = require('express');
const axios = require('axios');
const SheetsManager = require('./config/sheets');

const app = express();
const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'nodemon';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sheetsManager = new SheetsManager();
const userStates = {};

// ===============================
// INFORMACIÓN WISE UP
// ===============================
const INFO_WISE_UP = {
    programas: {
        adultos: `👔 *PROGRAMA PARA ADULTOS/EJECUTIVOS*

🎯 *Curso para Ejecutivos*
- Método intensivo de 18 meses
- Enfocado a resultados concretos
- Aplicabilidad inmediata en entorno corporativo
- Clases adaptadas a tu horario profesional

📚 *Desarrollo Personal Profesional incluye:*
✓ Coaching y oratoria
✓ Gestión del tiempo y negociación
✓ Trabajo en equipo y liderazgo
✓ Planificación estratégica y emprendimiento

💼 *Ideal para profesionales que buscan:*
- Ascenso laboral
- Oportunidades internacionales
- Mejorar presentaciones en inglés`,

        adolescentes: `🎒 *PROGRAMA PARA ADOLESCENTES*

🌟 *Características principales:*
- Programa de 42 meses
- Prepara a los jóvenes para el futuro con fluidez
- Confianza en sí mismos y visión global
- Clases dinámicas, interactivas y conectadas
- Inmersión en el universo juvenil

🎯 *Beneficios:*
✓ Desarrollo de habilidades del siglo XXI
✓ Preparación para exámenes internacionales
✓ Contenido adaptado a sus intereses
✓ Ambiente de aprendizaje motivador`,

        presencial: `🏫 *CURSO PRESENCIAL*

El curso que entrena tu inglés para la vida real:

✓ *Conversación fluida*: Clases enfocadas en pronunciación y fluidez verbal
✓ *Material único*: Crea tu propio diccionario de palabras
✓ *Enseñanza personalizada*: Contenidos adaptados a tu nivel de conocimientos
✓ *Aula invertida*: Aprendizaje activo donde practicas más y comprendes mejor
✓ *Modo cine*: Videos inmersivos, 100% exclusivos y grabados en EE.UU.
✓ *Clases multinivel*: Estudiantes de diferentes niveles interactúan y aprenden juntos
✓ *Inglés práctico*: Inmersión en la vida cotidiana y la cultura de los países de habla inglesa
✓ *Networking real*: Intercambios y conexiones enriquecedoras dentro del aula

📍 *Ubicación:* Av. José Larco #101, Miraflores`
    },

    metodologia: `🎯 *NUESTRA METODOLOGÍA*

*Aprendizaje Práctico y Directo*
📖 Aprenderás el idioma aplicado en la práctica en situaciones reales según el tema de tu interés.

*Inmersión Cultural Verdadera*
🌍 Practica mediante una verdadera inmersión cultural. Pensarás en inglés, lo que facilitará mucho tu curso tanto para situaciones personales como profesionales.

*Características destacadas:*
✓ Método directo sin complicaciones
✓ Enfoque en resultados rápidos
✓ Contenido filmado en calidad de cine (USA)
✓ Conversación desde el día 1`,

    ubicacion: `📍 *NUESTRA UBICACIÓN*

🏢 *Sede Miraflores*
Av. José Larco #101
Centro Comercial Caracol
Miraflores - Lima - Perú

📞 *Contacto Directo*
Teléfono: 900118664
👤 Jefe Comercial

🕐 *Horarios de Atención*
Lunes a Viernes: 9:00 AM - 8:00 PM
Sábados: 9:00 AM - 2:00 PM`,

    testimonios: `⭐ *TESTIMONIOS DE NUESTROS ESTUDIANTES*

💬 *Marcelo Damasio*
"La metodología me ha sorprendido cada vez más. Videoclases de alta calidad, ejercicios prácticos y objetivos."

💬 *Henrique Carvalho de Araújo*
"Lo recomiendo por la calidad de las clases y el contenido enriquecedor."

💬 *Estefanía Queiroz*
"Recomiendo el curso por su vocabulario práctico y contacto permanente con el idioma."

💬 *Paulo Geovani Batista*
"El enfoque del curso es dinámico y fácil de entender."

⭐⭐⭐⭐⭐ *Miles de estudiantes satisfechos*`
};

// ===============================
// HELPERS
// ===============================
function menuPrincipal(nombre) {
    return `¡Hola *${nombre}*! 👋

Bienvenido(a) a *WISE UP* - Aprende inglés en 18 meses 🎓

¿En qué puedo ayudarte hoy?

1️⃣ 📚 Conocer nuestros programas
2️⃣ 🎯 Información sobre metodología
3️⃣ 📍 Ubicación y contacto
4️⃣ ⭐ Ver testimonios
5️⃣ 📅 *AGENDAR CITA*
6️⃣ 💬 Hablar con un asesor

_Escribe el número de tu opción_ 👇`;
}

const menuProgramas = `📚 *NUESTROS PROGRAMAS DE INGLÉS*

Elige el programa que más se adapte a ti:

1️⃣ 👔 Programa para Adultos/Ejecutivos
2️⃣ 🎒 Programa para Adolescentes
3️⃣ 🏫 Curso Presencial
4️⃣ ⬅️ Volver al menú principal

_Escribe el número de tu opción_ 👇`;

async function sendWhatsAppText(to, body) {
    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
        throw new Error('Faltan WHATSAPP_TOKEN o PHONE_NUMBER_ID en variables de entorno');
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

function getUserState(chatId) {
    if (!userStates[chatId]) {
        userStates[chatId] = { step: 'inicio' };
    }
    return userStates[chatId];
}

async function responderConMenu(to, nombre) {
    await sendWhatsAppText(to, menuPrincipal(nombre));
}

// ===============================
// LÓGICA DEL BOT
// ===============================
async function procesarMensaje({ from, nombreUsuario, textoOriginal }) {
    const userMessage = (textoOriginal || '').toLowerCase().trim();
    const userState = getUserState(from);

    console.log(`📨 Mensaje de ${nombreUsuario} (${from}): ${userMessage}`);

    if (!userMessage) return;

    // ===============================
    // FLUJO REGISTRO CITA
    // ===============================
    if (userState.step === 'registro_nombre') {
        userState.datos.nombre = textoOriginal;
        userState.step = 'registro_telefono';
        await sendWhatsAppText(from, `Perfecto *${textoOriginal}* 👍\n\n📱 ¿Cuál es tu número de teléfono?`);
        return;
    }

    if (userState.step === 'registro_telefono') {
        userState.datos.telefono = textoOriginal;
        userState.step = 'registro_email';
        await sendWhatsAppText(from, '📧 ¿Cuál es tu correo electrónico?');
        return;
    }

    if (userState.step === 'registro_email') {
        userState.datos.email = textoOriginal;
        userState.step = 'registro_edad';
        await sendWhatsAppText(from, '🎂 ¿Cuál es tu edad?');
        return;
    }

    if (userState.step === 'registro_edad') {
        userState.datos.edad = textoOriginal;
        userState.step = 'registro_programa';
        await sendWhatsAppText(from, `📚 ¿Qué programa te interesa?\n\n1️⃣ Adultos/Ejecutivos (18 meses)\n2️⃣ Adolescentes (42 meses)\n\n_Escribe 1 o 2_:`);
        return;
    }

    if (userState.step === 'registro_programa') {
        userState.datos.programa = userMessage === '1' ? 'Adultos/Ejecutivos' : 'Adolescentes';
        userState.step = 'registro_horario';
        await sendWhatsAppText(from, '⏰ ¿Qué horario prefieres?\n\n1️⃣ Mañana (8am-12pm)\n2️⃣ Tarde (2pm-6pm)\n3️⃣ Noche (6pm-9pm)\n\n_Escribe 1, 2 o 3_:');
        return;
    }

    if (userState.step === 'registro_horario') {
        const horarios = {
            '1': 'Mañana (8am-12pm)',
            '2': 'Tarde (2pm-6pm)',
            '3': 'Noche (6pm-9pm)'
        };

        userState.datos.horario = horarios[userMessage] || textoOriginal;
        userState.step = 'registro_observaciones';
        await sendWhatsAppText(from, '💬 ¿Alguna observación adicional?\n\n_(Escribe "ninguna" si no tienes)_');
        return;
    }

    if (userState.step === 'registro_observaciones') {
    console.log('🔥 Entró al paso final de observaciones');
    console.log('🔥 Texto recibido en observaciones:', textoOriginal);
    console.log('🔥 Estado antes de guardar:', userState);

    userState.datos.observaciones = userMessage === 'ninguna' ? '' : textoOriginal;

    console.log('🔥 Datos listos para guardar:', userState.datos);

    const resultado = await sheetsManager.guardarRegistro(userState.datos);

    console.log('🔥 Resultado guardarRegistro:', resultado);

    if (resultado.success) {
        await sendWhatsAppText(
            from,
            `✅ *¡REGISTRO COMPLETADO CON ÉXITO!*\n\n📋 *Resumen de tu cita:*\n\n👤 *Nombre:* ${userState.datos.nombre}\n📱 *Teléfono:* ${userState.datos.telefono}\n📧 *Email:* ${userState.datos.email}\n🎂 *Edad:* ${userState.datos.edad}\n📚 *Programa:* ${userState.datos.programa}\n⏰ *Horario:* ${userState.datos.horario}\n${userState.datos.observaciones ? `💬 *Observaciones:* ${userState.datos.observaciones}\n` : ''}\n🎉 *Nuestro equipo se pondrá en contacto contigo pronto.*`
        );
    } else {
        await sendWhatsAppText(
            from,
            `❌ Hubo un error al guardar tu información.\n\nPor favor contacta directamente al:\n📱 *900118664*\n\nO escribe *"6"* para hablar con un asesor.`
        );
    }

    userState.step = 'inicio';
    delete userState.datos;
    await responderConMenu(from, nombreUsuario);
    return;
}


















        userState.datos.observaciones = userMessage === 'ninguna' ? '' : textoOriginal;

        const resultado = await sheetsManager.guardarRegistro(userState.datos);

        if (resultado.success) {
            await sendWhatsAppText(
                from,
                `✅ *¡REGISTRO COMPLETADO CON ÉXITO!*\n\n📋 *Resumen de tu cita:*\n\n👤 *Nombre:* ${userState.datos.nombre}\n📱 *Teléfono:* ${userState.datos.telefono}\n📧 *Email:* ${userState.datos.email}\n🎂 *Edad:* ${userState.datos.edad}\n📚 *Programa:* ${userState.datos.programa}\n⏰ *Horario:* ${userState.datos.horario}\n${userState.datos.observaciones ? `💬 *Observaciones:* ${userState.datos.observaciones}\n` : ''}\n🎉 *Nuestro equipo se pondrá en contacto contigo pronto.*`
            );
        } else {
            await sendWhatsAppText(
                from,
                `❌ Hubo un error al guardar tu información.\n\nPor favor contacta directamente al:\n📱 *900118664*\n\nO escribe *"6"* para hablar con un asesor.`
            );
        }

        userState.step = 'inicio';
        delete userState.datos;
        await responderConMenu(from, nombreUsuario);
        return;
    }

    // ===============================
    // FLUJO PRINCIPAL
    // ===============================
    if (userMessage === 'hola' || userMessage === 'menu' || userMessage === 'inicio' || userState.step === 'inicio') {
        userState.step = 'menu_principal';
        await responderConMenu(from, nombreUsuario);
        return;
    }

    if (userMessage === '1' && userState.step === 'menu_principal') {
        userState.step = 'programas';
        await sendWhatsAppText(from, menuProgramas);
        return;
    }

    if (userState.step === 'programas') {
        if (userMessage === '1') {
            await sendWhatsAppText(from, INFO_WISE_UP.programas.adultos);
            await sendWhatsAppText(from, `\n¿Quieres ver otro programa o volver al menú?\n\n${menuProgramas}`);
            return;
        }

        if (userMessage === '2') {
            await sendWhatsAppText(from, INFO_WISE_UP.programas.adolescentes);
            await sendWhatsAppText(from, `\n¿Quieres ver otro programa o volver al menú?\n\n${menuProgramas}`);
            return;
        }

        if (userMessage === '3') {
            await sendWhatsAppText(from, INFO_WISE_UP.programas.presencial);
            await sendWhatsAppText(from, `\n¿Quieres ver otro programa o volver al menú?\n\n${menuProgramas}`);
            return;
        }

        if (userMessage === '4') {
            userState.step = 'menu_principal';
            await responderConMenu(from, nombreUsuario);
            return;
        }

        await sendWhatsAppText(from, `Por favor elige una opción válida.\n\n${menuProgramas}`);
        return;
    }

    if (userMessage === '2' && userState.step === 'menu_principal') {
        await sendWhatsAppText(from, INFO_WISE_UP.metodologia);
        await responderConMenu(from, nombreUsuario);
        return;
    }

    if (userMessage === '3' && userState.step === 'menu_principal') {
        await sendWhatsAppText(from, INFO_WISE_UP.ubicacion);
        await responderConMenu(from, nombreUsuario);
        return;
    }

    if (userMessage === '4' && userState.step === 'menu_principal') {
        await sendWhatsAppText(from, INFO_WISE_UP.testimonios);
        await responderConMenu(from, nombreUsuario);
        return;
    }

    if (userMessage === '5' && userState.step === 'menu_principal') {
        userState.step = 'registro_nombre';
        userState.datos = {};
        await sendWhatsAppText(from, `📅 *AGENDAR CITA EN WISE UP*\n\n¡Perfecto *${nombreUsuario}*! Vamos a registrar tu información para agendar una cita.\n\n👤 Para comenzar, ¿cuál es tu *nombre completo*?`);
        return;
    }

    if (userMessage === '6' && userState.step === 'menu_principal') {
        await sendWhatsAppText(from, `💬 *CONTACTO DIRECTO CON ASESOR*\n\nPuedes contactar directamente con nuestro Jefe Comercial:\n\n📱 *900118664*\n\n🕐 *Horario de atención:*\nLunes a Viernes: 9:00 AM - 8:00 PM\nSábados: 9:00 AM - 2:00 PM\n\n¡Estamos disponibles para atenderte! 😊`);
        await responderConMenu(from, nombreUsuario);
        return;
    }

    await sendWhatsAppText(from, `Lo siento, no entendí tu mensaje. 😅\n\n${menuPrincipal(nombreUsuario)}`);
}

// ===============================
// RUTAS EXPRESS
// ===============================
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Wise Up ChatBot</title>
            <style>
                body { font-family: Arial; max-width: 800px; margin: 50px auto; padding: 20px; }
                h1 { color: #c41e3a; }
                .status { padding: 10px; background: #d4edda; border-radius: 5px; margin: 20px 0; }
                .info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; }
                code { background: #eee; padding: 2px 6px; border-radius: 4px; }
            </style>
        </head>
        <body>
            <h1>🎓 Wise Up WhatsApp ChatBot</h1>
            <div class="status">
                <h2>✅ Bot funcionando correctamente</h2>
                <p><strong>Estado:</strong> Activo</p>
                <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-PE')}</p>
            </div>
            <div class="info">
                <h3>📊 Información del Sistema</h3>
                <p><strong>Webhook:</strong> <code>/webhook</code></p>
                <p><strong>Node.js:</strong> ${process.version}</p>
                <p><strong>Plataforma:</strong> ${process.platform}</p>
            </div>
        </body>
        </html>
    `);
});

app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

app.get('/status', (req, res) => {
    res.json({
        bot: 'Wise Up ChatBot',
        status: 'running',
        activeChats: Object.keys(userStates).length,
        timestamp: new Date().toLocaleString('es-PE')
    });
});

// Verificación webhook Meta
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('📥 Verificación webhook recibida:', req.query);

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ Webhook verificado correctamente con Meta');
        return res.status(200).send(challenge);
    }

    console.log('❌ Error de verificación webhook');
    return res.sendStatus(403);
});

// Recepción de mensajes y estados desde Meta
app.post('/webhook', async (req, res) => {
    try {
        console.log('📩 Evento recibido en /webhook:');
        console.log(JSON.stringify(req.body, null, 2));

        const change = req.body?.entry?.[0]?.changes?.[0];
        const value = change?.value;
        const message = value?.messages?.[0];

        // responder rápido a Meta
        res.sendStatus(200);

        // ignorar eventos que no sean mensajes
        if (!message) return;

        // ignorar mensajes que no sean texto
        if (message.type !== 'text') {
            await sendWhatsAppText(message.from, 'Por ahora solo puedo procesar mensajes de texto 😊');
            return;
        }

        const from = message.from;
        const texto = message?.text?.body || '';
        const nombreUsuario = value?.contacts?.[0]?.profile?.name || 'amigo(a)';

        await procesarMensaje({
            from,
            nombreUsuario,
            textoOriginal: texto
        });

    } catch (error) {
        console.error('❌ Error en webhook:', error.response?.data || error.message);
        if (!res.headersSent) {
            return res.sendStatus(500);
        }
    }
});

// ===============================
// INICIO SERVIDOR
// ===============================
app.listen(PORT, async () => {
    console.log('\n🚀 ========================================');
    console.log(`   SERVIDOR EXPRESS EN PUERTO ${PORT}`);
    console.log('========================================\n');

    try {
        await sheetsManager.initialize();
        console.log('✅ Google Sheets API inicializada correctamente');
    } catch (error) {
        console.error('❌ Error al inicializar Google Sheets:', error.message);
    }
});

process.on('unhandledRejection', (error) => {
    console.error('❌ Error no capturado:', error);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Excepción no capturada:', error);
});