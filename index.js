import 'dotenv/config';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import http from 'http';
import mongoose from 'mongoose';
import Usuario from './models/Usuario.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. SERVIDOR DE MANTENIMIENTO (Para que Render vea el puerto abierto de inmediato)
const port = process.env.PORT || 10000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write('Codenexa Bot operativo');
    res.end();
}).listen(port, '0.0.0.0', () => {
    console.log(`🚀 Sistema: Servidor de enlace activo en puerto ${port}`);
});

// 2. CONFIGURACIÓN DEL CLIENTE
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.commands = new Collection();

const getFiles = (dir) => {
    let files = [];
    if (!fs.existsSync(dir)) return files;
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
        if (item.isDirectory()) {
            files = [...files, ...getFiles(path.join(dir, item.name))];
        } else if (item.name.endsWith('.js')) {
            files.push(path.join(dir, item.name));
        }
    }
    return files;
};

async function loadModules() {
    const commandsPath = path.join(__dirname, 'commands');
    if (fs.existsSync(commandsPath)) {
        const commandFiles = getFiles(commandsPath);
        for (const filePath of commandFiles) {
            try {
                const fileUrl = pathToFileURL(filePath).href;
                const { default: command } = await import(fileUrl);
                if (command?.data?.name) {
                    client.commands.set(command.data.name, command);
                    console.log(`Comando cargado: ${command.data.name}`);
                }
            } catch (err) {
                console.error(`Error en comando ${filePath}:`, err.message);
            }
        }
    }

    const eventsPath = path.join(__dirname, 'events');
    if (fs.existsSync(eventsPath)) {
        const eventFiles = getFiles(eventsPath);
        for (const filePath of eventFiles) {
            try {
                const fileUrl = pathToFileURL(filePath).href;
                const { default: event } = await import(fileUrl);
                if (event?.name) {
                    if (event.once) {
                        client.once(event.name, (...args) => event.execute(...args, client));
                    } else {
                        client.on(event.name, (...args) => event.execute(...args, client));
                    }
                    console.log(`Evento cargado: ${event.name}`);
                }
            } catch (err) {
                console.error(`Error en evento ${filePath}:`, err.message);
            }
        }
    }
}

async function checkMonthlyReset() {
    try {
        const now = new Date();
        const currentMonthLabel = `${now.getMonth() + 1}-${now.getFullYear()}`;
        let config = await mongoose.connection.db.collection('config').findOne({ name: 'monthly_reset' });

        if (!config || config.lastReset !== currentMonthLabel) {
            await Usuario.updateMany({}, { $set: { minutos_mes: 0 } });
            await mongoose.connection.db.collection('config').updateOne(
                { name: 'monthly_reset' },
                { $set: { lastReset: currentMonthLabel } },
                { upsert: true }
            );
            console.log('🌙 Actividad mensual reiniciada');
        }
    } catch (e) { 
        console.error('Error en el reset mensual:', e); 
    }
}

client.once('ready', async () => {
    console.log('---------------------------------------');
    console.log(`✅ Sesión iniciada como: ${client.user.tag}`);
    console.log('---------------------------------------');
    await checkMonthlyReset();
});

// 3. INICIO DE LA APLICACIÓN
async function main() {
    try {
        console.log('📡 Conectando a MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Base de datos lista');

        await loadModules();

        if (!process.env.TOKEN) {
            throw new Error('TOKEN no configurado en el entorno.');
        }
        
        console.log('🌐 Conectando con Discord...');
        await client.login(process.env.TOKEN);

    } catch (error) {
        console.error('❌ Error fatal:');
        console.error(error.message);
        process.exit(1);
    }
}

main();