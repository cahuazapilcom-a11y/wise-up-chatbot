// ================================================================
// Mensajes y contenido informativo del bot Wise Up
// ================================================================
 
const INFO = {
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
✓ *Enseñanza personalizada*: Contenidos adaptados a tu nivel
✓ *Aula invertida*: Aprendizaje activo donde practicas más y comprendes mejor
✓ *Modo cine*: Videos inmersivos, 100% exclusivos y grabados en EE.UU.
✓ *Clases multinivel*: Estudiantes de diferentes niveles aprenden juntos
✓ *Inglés práctico*: Inmersión en la vida cotidiana anglosajona
✓ *Networking real*: Intercambios y conexiones dentro del aula
 
📍 *Ubicación:* Av. José Larco #101, Miraflores`
    },
 
    metodologia: `🎯 *NUESTRA METODOLOGÍA*
 
*Aprendizaje Práctico y Directo*
📖 Aprenderás el idioma aplicado en situaciones reales según tus intereses.
 
*Inmersión Cultural Verdadera*
🌍 Practica mediante una verdadera inmersión cultural. Pensarás en inglés, facilitando tu aprendizaje.
 
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
 
module.exports = { INFO, menuPrincipal, menuProgramas };