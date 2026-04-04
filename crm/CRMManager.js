const db = require('../config/database');
 
const STAGES = {
    NUEVO:         'NUEVO',
    INTERESADO:    'INTERESADO',
    CITA_AGENDADA: 'CITA_AGENDADA',
    CLIENTE:       'CLIENTE',
    INACTIVO:      'INACTIVO'
};
 
const CLASSIFICATIONS = {
    FRIO:     'FRIO',
    TIBIO:    'TIBIO',
    CALIENTE: 'CALIENTE'
};
 
class CRMManager {
    // ──────────────────────────────────────────
    // LEADS
    // ──────────────────────────────────────────
 
    capturarLead(phone, name) {
        const existing = db.prepare('SELECT * FROM leads WHERE phone = ?').get(phone);
 
        if (!existing) {
            db.prepare('INSERT INTO leads (phone, name) VALUES (?, ?)').run(phone, name || '');
            console.log(`📋 CRM: Nuevo lead capturado → ${phone} (${name})`);
        } else {
            db.prepare(`
                UPDATE leads
                SET name         = COALESCE(NULLIF(?, ''), name),
                    last_contact = strftime('%d/%m/%Y %H:%M', 'now', 'localtime')
                WHERE phone = ?
            `).run(name || '', phone);
        }
 
        return db.prepare('SELECT * FROM leads WHERE phone = ?').get(phone);
    }
 
    actualizarLead(phone, data) {
        const fields = [];
        const values = [];
 
        const map = {
            name:             'name',
            email:            'email',
            age:              'age',
            program_interest: 'program_interest',
            schedule_pref:    'schedule_pref',
            stage:            'stage',
            classification:   'classification',
            notes:            'notes'
        };
 
        for (const [key, col] of Object.entries(map)) {
            if (data[key] !== undefined && data[key] !== null) {
                fields.push(`${col} = ?`);
                values.push(data[key]);
            }
        }
 
        if (fields.length === 0) return;
 
        fields.push("last_contact = strftime('%d/%m/%Y %H:%M', 'now', 'localtime')");
        values.push(phone);
 
        db.prepare(`UPDATE leads SET ${fields.join(', ')} WHERE phone = ?`).run(...values);
    }
 
    cambiarEtapa(phone, stage) {
        db.prepare(`
            UPDATE leads
            SET stage        = ?,
                last_contact = strftime('%d/%m/%Y %H:%M', 'now', 'localtime')
            WHERE phone = ?
        `).run(stage, phone);
        console.log(`📊 CRM: ${phone} → etapa ${stage}`);
    }
 
    clasificarLead(phone, classification) {
        db.prepare('UPDATE leads SET classification = ? WHERE phone = ?').run(classification, phone);
    }
 
    // ──────────────────────────────────────────
    // INTERACCIONES
    // ──────────────────────────────────────────
 
    registrarInteraccion(phone, direction, message) {
        db.prepare('INSERT INTO interactions (lead_phone, direction, message) VALUES (?, ?, ?)').run(phone, direction, message || '');
        db.prepare(`
            UPDATE leads
            SET total_interactions = total_interactions + 1,
                last_contact       = strftime('%d/%m/%Y %H:%M', 'now', 'localtime')
            WHERE phone = ?
        `).run(phone);
    }
 
    // ──────────────────────────────────────────
    // CITAS
    // ──────────────────────────────────────────
 
    guardarCita(data) {
        db.prepare(`
            INSERT INTO appointments (lead_phone, name, email, age, program, schedule, observations)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            data.phone,
            data.nombre        || '',
            data.email         || '',
            data.edad          || '',
            data.programa      || '',
            data.horario       || '',
            data.observaciones || ''
        );
 
        this.cambiarEtapa(data.phone, STAGES.CITA_AGENDADA);
        this.clasificarLead(data.phone, CLASSIFICATIONS.CALIENTE);
        this.actualizarLead(data.phone, {
            name:             data.nombre,
            email:            data.email,
            age:              data.edad,
            program_interest: data.programa,
            schedule_pref:    data.horario
        });
 
        console.log(`🗓️  CRM: Cita guardada para ${data.phone}`);
    }
 
    // ──────────────────────────────────────────
    // CONSULTAS
    // ──────────────────────────────────────────
 
    obtenerTodos(filtros = {}) {
        let query = 'SELECT * FROM leads';
        const conditions = [];
        const values = [];
 
        if (filtros.stage)          { conditions.push('stage = ?');          values.push(filtros.stage); }
        if (filtros.classification) { conditions.push('classification = ?'); values.push(filtros.classification); }
        if (filtros.search) {
            conditions.push("(name LIKE ? OR phone LIKE ? OR email LIKE ?)");
            const like = `%${filtros.search}%`;
            values.push(like, like, like);
        }
 
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        query += ' ORDER BY id DESC';
 
        return db.prepare(query).all(...values);
    }
 
    obtenerLead(phone) {
        return db.prepare('SELECT * FROM leads WHERE phone = ?').get(phone);
    }
 
    obtenerInteracciones(phone, limit = 50) {
        return db.prepare(
            'SELECT * FROM interactions WHERE lead_phone = ? ORDER BY id DESC LIMIT ?'
        ).all(phone, limit);
    }
 
    obtenerCitas() {
        return db.prepare('SELECT * FROM appointments ORDER BY id DESC').all();
    }
 
    obtenerEstadisticas() {
        const count = (sql) => db.prepare(sql).get().count;
 
        const totalLeads   = count('SELECT COUNT(*) as count FROM leads');
        const caliente     = count("SELECT COUNT(*) as count FROM leads WHERE classification = 'CALIENTE'");
        const tibio        = count("SELECT COUNT(*) as count FROM leads WHERE classification = 'TIBIO'");
        const totalCitas   = count('SELECT COUNT(*) as count FROM appointments');
        const totalInterac = count('SELECT COUNT(*) as count FROM interactions');
 
        const pipeline = {
            nuevo:        count("SELECT COUNT(*) as count FROM leads WHERE stage = 'NUEVO'"),
            interesado:   count("SELECT COUNT(*) as count FROM leads WHERE stage = 'INTERESADO'"),
            citaAgendada: count("SELECT COUNT(*) as count FROM leads WHERE stage = 'CITA_AGENDADA'"),
            cliente:      count("SELECT COUNT(*) as count FROM leads WHERE stage = 'CLIENTE'"),
            inactivo:     count("SELECT COUNT(*) as count FROM leads WHERE stage = 'INACTIVO'")
        };
 
        return {
            totalLeads,
            pipeline,
            clasificacion: { caliente, tibio, frio: totalLeads - caliente - tibio },
            totalCitas,
            totalInteracciones: totalInterac
        };
    }
}
 
const crmManager = new CRMManager();
 
module.exports = { crmManager, CRMManager, STAGES, CLASSIFICATIONS };