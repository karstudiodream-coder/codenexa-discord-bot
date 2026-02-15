import fs from 'fs';
import path from 'path';

const sesiones = new Map();

export default {
    name: 'voiceStateUpdate',
    async execute(oldState, newState) {
        const dbPath = path.join(process.cwd(), 'database.json');
        const userId = newState.id;

        // Cuando el usuario se une a un canal de voz
        if (!oldState.channelId && newState.channelId) {
            sesiones.set(userId, Date.now());
        } 
        
        // Cuando el usuario sale de un canal de voz
        else if (oldState.channelId && !newState.channelId) {
            const inicio = sesiones.get(userId);
            if (inicio) {
                const tiempoMilis = Date.now() - inicio;
                const minutosGanados = Math.floor(tiempoMilis / 60000);
                sesiones.delete(userId);

                if (minutosGanados < 1) return; // No guardar si fue menos de un minuto

                // Leer base de datos con seguridad
                let db = { usuarios: {} };
                if (fs.existsSync(dbPath)) {
                    db = JSON.parse(fs.readFileSync(dbPath, 'utf8') || '{}');
                }

                if (!db.usuarios) db.usuarios = {};
                if (!db.usuarios[userId]) {
                    db.usuarios[userId] = { minutos: 0, eventos: 0 };
                }

                db.usuarios[userId].minutos += minutosGanados;
                
                // Guardar cambios
                fs.writeFileSync(dbPath, JSON.stringify(db, null, 4));
            }
        }
    }
};