const { google } = require('googleapis');

class SheetsManager {
    constructor() {
        this.sheets = null;
        this.spreadsheetId = process.env.SPREADSHEET_ID;
        this.sheetName = process.env.SHEET_NAME || 'Hoja1';
    }

    async initialize() {
        try {
            const auth = new google.auth.GoogleAuth({
                credentials: {
                    client_email: process.env.GOOGLE_CLIENT_EMAIL,
                    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
                },
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });

            const client = await auth.getClient();

            this.sheets = google.sheets({
                version: 'v4',
                auth: client
            });

            console.log('✅ Google Sheets API inicializada correctamente');
            return true;
        } catch (error) {
            console.error('❌ Error al inicializar Google Sheets:', error.message);
            return false;
        }
    }

    async verificarConexion() {
        try {
            if (!this.sheets) {
                await this.initialize();
            }

            const response = await this.sheets.spreadsheets.get({
                spreadsheetId: this.spreadsheetId
            });

            console.log(`✅ Conexión con Google Sheets OK: ${response.data.properties.title}`);
            return true;
        } catch (error) {
            console.error('❌ Error verificando conexión con Sheets:', error.message);
            if (error.response?.data) {
                console.error('❌ Detalle Google API:', JSON.stringify(error.response.data, null, 2));
            }
            return false;
        }
    }

    async guardarRegistro(datos) {
        try {
            if (!this.sheets) {
                await this.initialize();
            }

            const values = [[
                new Date().toLocaleString('es-PE'),
                datos.nombre || '',
                datos.telefono || '',
                datos.email || '',
                datos.edad || '',
                datos.programa || '',
                datos.horario || '',
                datos.observaciones || ''
            ]];

            console.log('📤 Enviando datos a Sheets:', values);

            const response = await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: `${this.sheetName}!A:H`,
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                requestBody: {
                    values
                }
            });

            console.log('✅ Registro guardado en Google Sheets');
            console.log('✅ Respuesta Google Sheets:', response.data);

            return { success: true };
        } catch (error) {
            console.error('❌ Error al guardar en Google Sheets:', error.message);

            if (error.response?.data) {
                console.error('❌ Detalle Google API:', JSON.stringify(error.response.data, null, 2));
            }

            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = SheetsManager;