const fs = require('fs');
const path = require('path');
const sesiones = new Map();

module.exports = {
    name: 'voiceStateUpdate',
    async execute(oldState, newState) {
        const dbPath = path.join(process.cwd(), 'database.json');
        const userId = newState.id;

        if (!oldState.channelId && newState.channelId) {
            sesiones.set(userId, Date.now());
        } 
        
        else if (oldState.channelId && !newState.channelId) {
            const inicio = sesiones.get(userId);
            if (inicio) {
                const tiempoMilis = Date.now() - inicio;
                const minutosGanados = Math.floor(tiempoMilis / 60000);
                sesiones.delete(userId);

                let db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
                if (!db.usuarios) db.usuarios = {};
                if (!db.usuarios[userId]) db.usuarios[userId] = { minutos: 0, eventos: 0, insignias: [] };

                db.usuarios[userId].minutos += minutosGanados;
                fs.writeFileSync(dbPath, JSON.stringify(db, null, 4));
            }
        }
    }
};