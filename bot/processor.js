const { sendWhatsAppText } = require('./whatsapp');
const { INFO, menuPrincipal, menuProgramas } = require('./messages');
const { crmManager, STAGES, CLASSIFICATIONS } = require('../crm/CRMManager');
 
// ================================================================
// Estado de conversación en memoria (flujo del bot)
// Los datos del lead se persisten en SQLite via CRMManager
// ================================================================
const userStates = {};
 
function getUserState(phone) {
    if (!userStates[phone]) {
        userStates[phone] = { step: 'inicio' };
    }
    return userStates[phone];
}
 
function getActiveChats() {
    return Object.keys(userStates).length;
}
 
// ================================================================
// PROCESADOR PRINCIPAL DE MENSAJES
// ================================================================
async function procesarMensaje({ from, nombreUsuario, textoOriginal }) {
    const texto = (textoOriginal || '').toLowerCase().trim();
    const state = getUserState(from);
 
    console.log(`📨 [${from}] ${nombreUsuario}: ${textoOriginal}`);
 
    if (!texto) return;
 
    // ── CRM: capturar lead y registrar interacción ──
    crmManager.capturarLead(from, nombreUsuario);
    crmManager.registrarInteraccion(from, 'IN', textoOriginal);
 
    // ── Helper para enviar y registrar respuesta ──
    async function responder(mensaje) {
        await sendWhatsAppText(from, mensaje);
        crmManager.registrarInteraccion(from, 'OUT', mensaje.substring(0, 200));
    }
 
    async function mostrarMenu() {
        await responder(menuPrincipal(nombreUsuario));
    }
 
    // ================================================================
    // FLUJO DE REGISTRO DE CITA (multi-paso)
    // ================================================================
    if (state.step === 'registro_nombre') {
        state.datos.nombre = textoOriginal;
        state.step = 'registro_telefono';
        await responder(`Perfecto *${textoOriginal}* 👍\n\n📱 ¿Cuál es tu número de teléfono?`);
        return;
    }
 
    if (state.step === 'registro_telefono') {
        state.datos.telefono = textoOriginal;
        state.step = 'registro_email';
        await responder('📧 ¿Cuál es tu correo electrónico?');
        return;
    }
 
    if (state.step === 'registro_email') {
        state.datos.email = textoOriginal;
        state.step = 'registro_edad';
        await responder('🎂 ¿Cuál es tu edad?');
        return;
    }
 
    if (state.step === 'registro_edad') {
        state.datos.edad = textoOriginal;
        state.step = 'registro_programa';
        await responder(`📚 ¿Qué programa te interesa?\n\n1️⃣ Adultos/Ejecutivos (18 meses)\n2️⃣ Adolescentes (42 meses)\n\n_Escribe 1 o 2_:`);
        return;
    }
 
    if (state.step === 'registro_programa') {
        state.datos.programa = texto === '1' ? 'Adultos/Ejecutivos' : 'Adolescentes';
        state.step = 'registro_horario';
        await responder('⏰ ¿Qué horario prefieres?\n\n1️⃣ Mañana (8am-12pm)\n2️⃣ Tarde (2pm-6pm)\n3️⃣ Noche (6pm-9pm)\n\n_Escribe 1, 2 o 3_:');
        return;
    }
 
    if (state.step === 'registro_horario') {
        const horarios = { '1': 'Mañana (8am-12pm)', '2': 'Tarde (2pm-6pm)', '3': 'Noche (6pm-9pm)' };
        state.datos.horario = horarios[texto] || textoOriginal;
        state.step = 'registro_observaciones';
        await responder('💬 ¿Alguna observación adicional?\n\n_(Escribe "ninguna" si no tienes)_');
        return;
    }
 
    if (state.step === 'registro_observaciones') {
        state.datos.observaciones = texto === 'ninguna' ? '' : textoOriginal;
 
        // ── CRM: guardar cita (también actualiza etapa y clasificación) ──
        const datosCita = { phone: from, ...state.datos };
        let citaGuardada = false;
 
        try {
            crmManager.guardarCita(datosCita);
            citaGuardada = true;
        } catch (err) {
            console.error('❌ Error CRM guardarCita:', err.message);
        }
 
        // ── Google Sheets (legacy, mantener para respaldo) ──
        try {
            const sheetsManager = require('../config/sheets');
            const sm = new sheetsManager();
            await sm.initialize();
            await sm.guardarRegistro(state.datos);
        } catch (err) {
            console.error('⚠️  Google Sheets no disponible:', err.message);
        }
 
        if (citaGuardada) {
            const d = state.datos;
            await responder(
                `✅ *¡REGISTRO COMPLETADO CON ÉXITO!*\n\n📋 *Resumen de tu cita:*\n\n` +
                `👤 *Nombre:* ${d.nombre}\n📱 *Teléfono:* ${d.telefono}\n📧 *Email:* ${d.email}\n` +
                `🎂 *Edad:* ${d.edad}\n📚 *Programa:* ${d.programa}\n⏰ *Horario:* ${d.horario}\n` +
                `${d.observaciones ? `💬 *Observaciones:* ${d.observaciones}\n` : ''}` +
                `\n🎉 *Nuestro equipo se pondrá en contacto contigo pronto.*`
            );
        } else {
            await responder(
                `❌ Hubo un error al guardar tu información.\n\n` +
                `Por favor contacta directamente al:\n📱 *900118664*\n\n` +
                `O escribe *"6"* para hablar con un asesor.`
            );
        }
 
        state.step = 'inicio';
        delete state.datos;
        await mostrarMenu();
        return;
    }
 
    // ================================================================
    // FLUJO PRINCIPAL (menú)
    // ================================================================
    if (texto === 'hola' || texto === 'menu' || texto === 'inicio' || state.step === 'inicio') {
        state.step = 'menu_principal';
        await mostrarMenu();
        return;
    }
 
    if (texto === '1' && state.step === 'menu_principal') {
        state.step = 'programas';
        // CRM: marcar como interesado
        crmManager.cambiarEtapa(from, STAGES.INTERESADO);
        crmManager.clasificarLead(from, CLASSIFICATIONS.TIBIO);
        await responder(menuProgramas);
        return;
    }
 
    if (state.step === 'programas') {
        if (texto === '1') {
            crmManager.actualizarLead(from, { program_interest: 'Adultos/Ejecutivos' });
            await responder(INFO.programas.adultos);
            await responder(`\n¿Quieres ver otro programa o volver al menú?\n\n${menuProgramas}`);
            return;
        }
        if (texto === '2') {
            crmManager.actualizarLead(from, { program_interest: 'Adolescentes' });
            await responder(INFO.programas.adolescentes);
            await responder(`\n¿Quieres ver otro programa o volver al menú?\n\n${menuProgramas}`);
            return;
        }
        if (texto === '3') {
            crmManager.actualizarLead(from, { program_interest: 'Presencial' });
            await responder(INFO.programas.presencial);
            await responder(`\n¿Quieres ver otro programa o volver al menú?\n\n${menuProgramas}`);
            return;
        }
        if (texto === '4') {
            state.step = 'menu_principal';
            await mostrarMenu();
            return;
        }
        await responder(`Por favor elige una opción válida.\n\n${menuProgramas}`);
        return;
    }
 
    if (texto === '2' && state.step === 'menu_principal') {
        await responder(INFO.metodologia);
        await mostrarMenu();
        return;
    }
 
    if (texto === '3' && state.step === 'menu_principal') {
        await responder(INFO.ubicacion);
        await mostrarMenu();
        return;
    }
 
    if (texto === '4' && state.step === 'menu_principal') {
        await responder(INFO.testimonios);
        await mostrarMenu();
        return;
    }
 
    if (texto === '5' && state.step === 'menu_principal') {
        state.step = 'registro_nombre';
        state.datos = {};
        await responder(
            `📅 *AGENDAR CITA EN WISE UP*\n\n` +
            `¡Perfecto *${nombreUsuario}*! Vamos a registrar tu información para agendar una cita.\n\n` +
            `👤 Para comenzar, ¿cuál es tu *nombre completo*?`
        );
        return;
    }
 
    if (texto === '6' && state.step === 'menu_principal') {
        await responder(
            `💬 *CONTACTO DIRECTO CON ASESOR*\n\n` +
            `Puedes contactar directamente con nuestro Jefe Comercial:\n\n` +
            `📱 *900118664*\n\n` +
            `🕐 *Horario de atención:*\nLunes a Viernes: 9:00 AM - 8:00 PM\nSábados: 9:00 AM - 2:00 PM\n\n` +
            `¡Estamos disponibles para atenderte! 😊`
        );
        await mostrarMenu();
        return;
    }
 
    // Mensaje no reconocido
    await responder(`Lo siento, no entendí tu mensaje. 😅\n\n${menuPrincipal(nombreUsuario)}`);
}
 
module.exports = { procesarMensaje, getActiveChats };