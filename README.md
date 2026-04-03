# 🎓 Wise Up WhatsApp ChatBot

Chatbot profesional para WhatsApp que gestiona información sobre los cursos de inglés de Wise Up, incluyendo registro automático de citas en Google Sheets.

## 🚀 Características

- ✅ Respuesta automática con nombre personalizado
- 📚 Información completa sobre programas
- 📅 Sistema de registro de citas
- 📊 Integración con Google Sheets
- 🤖 Menús interactivos
- 💬 Atención 24/7

## 📋 Requisitos Previos

- Node.js 18 o superior
- Cuenta de Google Cloud Platform
- Cuenta en Render.com
- Número de WhatsApp para el bot

## 🔧 Instalación Local

### 1. Clonar e instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno

Copia `.env.example` a `.env` y completa:
```env
GOOGLE_CLIENT_EMAIL=tu-email@proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
SPREADSHEET_ID=tu_spreadsheet_id_aqui
PORT=3000
```

### 3. Configurar Google Sheets

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuevo proyecto
3. Habilita Google Sheets API
4. Crea credenciales (Service Account)
5. Descarga el archivo JSON de credenciales
6. Crea una hoja de cálculo con estas columnas:
   - Fecha | Nombre | Teléfono | Email | Edad | Programa | Horario | Observaciones
7. Comparte la hoja con el email del service account

### 4. Ejecutar el bot
```bash
npm start
```

### 5. Escanear código QR

Escanea el código QR que aparece en la terminal con WhatsApp.

## 🌐 Deploy en Render

### 1. Crear Web Service

1. Ve a [Render.com](https://render.com)
2. Crea nuevo "Web Service"
3. Conecta tu repositorio de GitHub

### 2. Configurar Build

- **Build Command:** `npm install`
- **Start Command:** `npm start`

### 3. Variables de Entorno

Agrega en Render:
- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `SPREADSHEET_ID`
- `PORT` = 3000

### 4. Deploy

Haz click en "Create Web Service"

## 📱 Uso del ChatBot

### Comandos principales:

- `hola` o `menu` - Menú principal
- `1` - Ver programas
- `2` - Metodología
- `3` - Ubicación
- `4` - Testimonios
- `5` - Agendar cita
- `6` - Contactar asesor

## 🗂️ Estructura del Proyecto