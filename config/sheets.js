const { google } = require('googleapis');

class SheetsManager {
  constructor() {
    this.auth = null;
    this.sheets = null;
    this.spreadsheetId = process.env.SPREADSHEET_ID;
  }

  async initialize() {
    try {
      this.auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      console.log('✅ Google Sheets API inicializada correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error al inicializar Google Sheets:', error.message);
      return false;
    }
  }

  async guardarRegistro(datos) {
    try {
      const values = [[
        new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' }),
        datos.nombre,
        datos.telefono,
        datos.email,
        datos.edad,
        datos.programa,
        datos.horario,
        datos.observaciones || 'Ninguna'
      ]];

      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Registros!A:H',
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: { values }
      });

      console.log('✅ Registro guardado en Sheets:', datos.nombre);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Error al guardar en Sheets:', error.message);
      return { success: false, error: error.message };
    }
  }

  async verificarConexion() {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });
      console.log('✅ Conexión con Sheets verificada:', response.data.properties.title);
      return true;
    } catch (error) {
      console.error('❌ Error al verificar conexión con Sheets:', error.message);
      return false;
    }
  }
}

module.exports = SheetsManager;