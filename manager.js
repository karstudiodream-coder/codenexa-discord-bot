const fs = require('fs');
const path = require('path');

function revisarMes() {
    const dbPath = path.join(process.cwd(), 'database.json');
    let db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    
    const fechaActual = new Date();
    const mesActual = `${fechaActual.getMonth() + 1}-${fechaActual.getFullYear()}`;

    if (db.mesActual !== mesActual) {
        if (!db.historico) db.historico = [];
        
        db.historico.push({
            mes: db.mesActual,
            top: db.usuarios
        });

        for (let id in db.usuarios) {
            db.usuarios[id].minutos = 0;
            db.usuarios[id].eventos = 0;
        }

        db.mesActual = mesActual;
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 4));
    }
}

module.exports = { revisarMes };