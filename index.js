require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const SheetsManager = require('./config/sheets');

const app = express();
const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'nodemon';

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inicializar Google Sheets Manager
const sheetsManager = new SheetsManager();

// Cliente de WhatsApp
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './.wwebjs_auth'
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

// Estado de conversación por usuario
const userStates = {};

// Información de Wise Up
const INFO_WISE_UP = {
    presentacion: `🎓 *WISE UP - Aprende Inglés en 18 Meses*

¡Bienvenido(a) a Wise Up! 🌟

Somos el curso de inglés que te prepara para nuevas oportunidades con un método práctico y directo, diseñado para quienes quieren crecer en su carrera.

✅ *Método directo al grano*
✅ *Resultados rápidos en 18 meses*  
✅ *Material exclusivo filmado en USA*`,

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
Sábados: 9:00 AM - 2:00 PM

🚇 *Cómo llegar:*
- Cerca al Parque Kennedy
- Frente a Wong de Óvalo Gutiérrez
- Fácil acceso en transporte público`,

    testimonios: `⭐ *TESTIMONIOS DE NUESTROS ESTUDIANTES*

💬 *Marcelo Damasio*
"La metodología me ha sorprendido cada vez más. Videoclases de alta calidad, ejercicios prácticos y objetivos. El inglés de Wise Up me permite proyectarme y competir en el mercado laboral internacional."

💬 *Henrique Carvalho de Araújo*
"Lo recomiendo por la calidad de las clases y el contenido enriquecedor que facilita el aprendizaje. Siempre me ha costado aprender el idioma, pero con este curso estoy mejorando."

💬 *Estefanía Queiroz*
"Soy profesor de inglés. Recomiendo el curso en línea de Wise Up, especialmente a mis compañeros, para que podamos aprender vocabulario practicando y mantenernos en contacto con el idioma."

💬 *Paulo Geovani Batista*
"El enfoque del curso es dinámico y fácil de entender. El curso en línea de Wise Up abarca situaciones cotidianas, lo que facilita su comprensión."

⭐⭐⭐⭐⭐ *Miles de estudiantes satisfechos*`
};

// Función para obtener nombre del contacto
async function obtenerNombreContacto(message) {
    try {
        const contact = await message.getContact();
        return contact.pushname || contact.name || 'amigo(a)';
    } catch (error) {
        console.error('Error al obtener nombre:', error);
        return 'amigo(a)';
    }
}

// Menú principal
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

// Menú de programas
const menuProgramas = `📚 *NUESTROS PROGRAMAS DE INGLÉS*

Elige el programa que más se adapte a ti:

1️⃣ 👔 Programa para Adultos/Ejecutivos
2️⃣ 🎒 Programa para Adolescentes
3️⃣ 🏫 Curso Presencial
4️⃣ ⬅️ Volver al menú principal

_Escribe el número de tu opción_ 👇`;

// Generar código QR
client.on('qr', (qr) => {
    console.log('\n📱 ========================================');
    console.log('   ESCANEA ESTE CÓDIGO QR CON WHATSAPP');
    console.log('========================================\n');
    qrcode.generate(qr, { small: true });
    console.log('\n========================================\n');
});

// Cliente listo
client.on('ready', async () => {
    console.log('\n✅ ========================================');
    console.log('   BOT DE WISE UP CONECTADO Y LISTO');
    console.log('========================================');
    console.log(`📱 Número: ${client.info?.wid?.user || 'No disponible'}`);
    console.log(`👤 Nombre: ${client.info?.pushname || 'No disponible'}`);
    console.log('========================================\n');

    // Verificar conexión con Google Sheets
    try {
        await sheetsManager.verificarConexion();
    } catch (error) {
        console.error('❌ Error verificando Google Sheets:', error.message);
    }
});

// Error handler
client.on('auth_failure', (msg) => {
    console.error('❌ Error de autenticación:', msg);
});

client.on('disconnected', (reason) => {
    console.log('⚠️ Cliente desconectado:', reason);
});

// Manejo de mensajes
client.on('message', async (message) => {
    try {
        const chatId = message.from;
        const userMessage = (message.body || '').toLowerCase().trim();

        // Ignorar mensajes vacíos
        if (!message.body) return;

        // Ignorar mensajes de grupos
        if (message.from.includes('@g.us')) {
            return;
        }

        // Obtener nombre del usuario
        const nombreUsuario = await obtenerNombreContacto(message);

        // Inicializar estado si no existe
        if (!userStates[chatId]) {
            userStates[chatId] = { step: 'inicio' };
        }

        const userState = userStates[chatId];

        console.log(`📨 Mensaje de ${nombreUsuario}: ${userMessage}`);

        // ============================================
        // FLUJO DE REGISTRO DE CITA
        // ============================================

        if (userState.step === 'registro_nombre') {
            userState.datos.nombre = message.body;
            userState.step = 'registro_telefono';
            await message.reply(`Perfecto *${message.body}* 👍\n\n📱 ¿Cuál es tu número de teléfono?`);
            return;
        }

        if (userState.step === 'registro_telefono') {
            userState.datos.telefono = message.body;
            userState.step = 'registro_email';
            await message.reply('📧 ¿Cuál es tu correo electrónico?');
            return;
        }

        if (userState.step === 'registro_email') {
            userState.datos.email = message.body;
            userState.step = 'registro_edad';
            await message.reply('🎂 ¿Cuál es tu edad?');
            return;
        }

        if (userState.step === 'registro_edad') {
            userState.datos.edad = message.body;
            userState.step = 'registro_programa';
            await message.reply(`📚 ¿Qué programa te interesa?\n\n1️⃣ Adultos/Ejecutivos (18 meses)\n2️⃣ Adolescentes (42 meses)\n\n_Escribe 1 o 2_:`);
            return;
        }

        if (userState.step === 'registro_programa') {
            userState.datos.programa = message.body === '1' ? 'Adultos/Ejecutivos' : 'Adolescentes';
            userState.step = 'registro_horario';
            await message.reply('⏰ ¿Qué horario prefieres?\n\n1️⃣ Mañana (8am-12pm)\n2️⃣ Tarde (2pm-6pm)\n3️⃣ Noche (6pm-9pm)\n\n_Escribe 1, 2 o 3_:');
            return;
        }

        if (userState.step === 'registro_horario') {
            const horarios = { '1': 'Mañana (8am-12pm)', '2': 'Tarde (2pm-6pm)', '3': 'Noche (6pm-9pm)' };
            userState.datos.horario = horarios[message.body] || message.body;
            userState.step = 'registro_observaciones';
            await message.reply('💬 ¿Alguna observación adicional?\n\n_(Escribe "ninguna" si no tienes)_');
            return;
        }

        if (userState.step === 'registro_observaciones') {
            userState.datos.observaciones = message.body.toLowerCase() === 'ninguna' ? '' : message.body;

            // Guardar en Google Sheets
            const resultado = await sheetsManager.guardarRegistro(userState.datos);

            if (resultado.success) {
                await message.reply(`✅ *¡REGISTRO COMPLETADO CON ÉXITO!*\n\n📋 *Resumen de tu cita:*\n\n👤 *Nombre:* ${userState.datos.nombre}\n📱 *Teléfono:* ${userState.datos.telefono}\n📧 *Email:* ${userState.datos.email}\n🎂 *Edad:* ${userState.datos.edad}\n📚 *Programa:* ${userState.datos.programa}\n⏰ *Horario:* ${userState.datos.horario}\n${userState.datos.observaciones ? `💬 *Observaciones:* ${userState.datos.observaciones}\n` : ''}\n🎉 *Nuestro equipo se pondrá en contacto contigo pronto.*\n\n¿Necesitas algo más?`);
            } else {
                await message.reply(`❌ Hubo un error al guardar tu información.\n\nPor favor contacta directamente al:\n📱 *900118664*\n\nO escribe *"6"* para hablar con un asesor.`);
            }

            userState.step = 'inicio';
            delete userState.datos;

            setTimeout(async () => {
                try {
                    await message.reply(menuPrincipal(nombreUsuario));
                } catch (e) {
                    console.error('❌ Error enviando menú final:', e.message);
                }
            }, 3000);
            return;
        }

        // ============================================
        // FLUJO PRINCIPAL
        // ============================================

        if (userMessage === 'hola' || userMessage === 'menu' || userMessage === 'inicio' || userState.step === 'inicio') {
            await message.reply(menuPrincipal(nombreUsuario));
            userState.step = 'menu_principal';
            return;
        }

        // Opción 1: Programas
        if (userMessage === '1' && userState.step === 'menu_principal') {
            userState.step = 'programas';
            await message.reply(menuProgramas);
            return;
        }

        // Submenú de programas
        if (userState.step === 'programas') {
            if (userMessage === '1') {
                await message.reply(INFO_WISE_UP.programas.adultos);
                setTimeout(async () => {
                    try {
                        await message.reply('\n¿Quieres ver otro programa o volver al menú?\n\n' + menuProgramas);
                    } catch (e) {
                        console.error('❌ Error enviando submenú:', e.message);
                    }
                }, 2000);
            } else if (userMessage === '2') {
                await message.reply(INFO_WISE_UP.programas.adolescentes);
                setTimeout(async () => {
                    try {
                        await message.reply('\n¿Quieres ver otro programa o volver al menú?\n\n' + menuProgramas);
                    } catch (e) {
                        console.error('❌ Error enviando submenú:', e.message);
                    }
                }, 2000);
            } else if (userMessage === '3') {
                await message.reply(INFO_WISE_UP.programas.presencial);
                setTimeout(async () => {
                    try {
                        await message.reply('\n¿Quieres ver otro programa o volver al menú?\n\n' + menuProgramas);
                    } catch (e) {
                        console.error('❌ Error enviando submenú:', e.message);
                    }
                }, 2000);
            } else if (userMessage === '4') {
                userState.step = 'menu_principal';
                await message.reply(menuPrincipal(nombreUsuario));
            } else {
                await message.reply('Por favor elige una opción válida.\n\n' + menuProgramas);
            }
            return;
        }

        // Opción 2: Metodología
        if (userMessage === '2' && userState.step === 'menu_principal') {
            await message.reply(INFO_WISE_UP.metodologia);
            setTimeout(async () => {
                try {
                    await message.reply(menuPrincipal(nombreUsuario));
                } catch (e) {
                    console.error('❌ Error enviando menú:', e.message);
                }
            }, 2000);
            return;
        }

        // Opción 3: Ubicación
        if (userMessage === '3' && userState.step === 'menu_principal') {
            await message.reply(INFO_WISE_UP.ubicacion);
            setTimeout(async () => {
                try {
                    await message.reply(menuPrincipal(nombreUsuario));
                } catch (e) {
                    console.error('❌ Error enviando menú:', e.message);
                }
            }, 2000);
            return;
        }

        // Opción 4: Testimonios
        if (userMessage === '4' && userState.step === 'menu_principal') {
            await message.reply(INFO_WISE_UP.testimonios);
            setTimeout(async () => {
                try {
                    await message.reply(menuPrincipal(nombreUsuario));
                } catch (e) {
                    console.error('❌ Error enviando menú:', e.message);
                }
            }, 2000);
            return;
        }

        // Opción 5: Agendar cita
        if (userMessage === '5' && userState.step === 'menu_principal') {
            userState.step = 'registro_nombre';
            userState.datos = {};
            await message.reply(`📅 *AGENDAR CITA EN WISE UP*\n\n¡Perfecto *${nombreUsuario}*! Vamos a registrar tu información para agendar una cita.\n\n👤 Para comenzar, ¿cuál es tu *nombre completo*?`);
            return;
        }

        // Opción 6: Hablar con asesor
        if (userMessage === '6' && userState.step === 'menu_principal') {
            await message.reply(`💬 *CONTACTO DIRECTO CON ASESOR*\n\nPuedes contactar directamente con nuestro Jefe Comercial:\n\n📱 *900118664*\n\n🕐 *Horario de atención:*\nLunes a Viernes: 9:00 AM - 8:00 PM\nSábados: 9:00 AM - 2:00 PM\n\n¡Estamos disponibles para atenderte! 😊`);
            setTimeout(async () => {
                try {
                    await message.reply(menuPrincipal(nombreUsuario));
                } catch (e) {
                    console.error('❌ Error enviando menú:', e.message);
                }
            }, 2000);
            return;
        }

        // Respuesta por defecto
        await message.reply(`Lo siento, no entendí tu mensaje. 😅\n\nPor favor, selecciona una opción del menú:\n\n${menuPrincipal(nombreUsuario)}`);

    } catch (error) {
        console.error('❌ Error al procesar mensaje:', error);
        try {
            await message.reply('❌ Ocurrió un error. Por favor, escribe *"menu"* para volver a empezar.');
        } catch (e) {
            console.error('❌ No se pudo responder al mensaje:', e.message);
        }
    }
});

// ============================================
// RUTAS EXPRESS
// ============================================

// Página principal
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
                <p><strong>Versión:</strong> 1.0.0</p>
                <p><strong>Node.js:</strong> ${process.version}</p>
                <p><strong>Plataforma:</strong> ${process.platform}</p>
                <p><strong>Webhook Meta:</strong> <code>/webhook</code></p>
            </div>
        </body>
        </html>
    `);
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

// Estado simple
app.get('/status', (req, res) => {
    res.json({
        bot: 'Wise Up ChatBot',
        status: 'running',
        activeChats: Object.keys(userStates).length,
        timestamp: new Date().toLocaleString('es-PE')
    });
});

// ============================================
// WEBHOOK META / WHATSAPP CLOUD API
// ============================================

// Verificación del webhook por Meta
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('📥 Verificación webhook recibida:', req.query);

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ Webhook verificado correctamente con Meta');
        return res.status(200).send(challenge);
    }

    console.log('❌ Error de verificación de webhook');
    return res.sendStatus(403);
});

// Recepción de eventos enviados por Meta
app.post('/webhook', (req, res) => {
    console.log('📩 Evento recibido en /webhook:');
    console.log(JSON.stringify(req.body, null, 2));

    return res.sendStatus(200);
});

// Inicializar servidor
app.listen(PORT, async () => {
    console.log('\n🚀 ========================================');
    console.log(`   SERVIDOR EXPRESS EN PUERTO ${PORT}`);
    console.log('========================================\n');

    // Inicializar Google Sheets
    try {
        await sheetsManager.initialize();
        console.log('✅ Google Sheets API inicializada correctamente');
    } catch (error) {
        console.error('❌ Error al inicializar Google Sheets:', error.message);
    }

    // Inicializar cliente de WhatsApp Web
    try {
        client.initialize();
    } catch (error) {
        console.error('❌ Error al inicializar cliente de WhatsApp:', error.message);
    }
});

// Manejo de errores no capturados
process.on('unhandledRejection', (error) => {
    console.error('❌ Error no capturado:', error);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Excepción no capturada:', error);
});