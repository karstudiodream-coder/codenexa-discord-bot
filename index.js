import 'dotenv/config';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import http from 'http';
import mongoose from 'mongoose';
import Usuario from './models/Usuario.js';

// 1. MANTENER VIVO EN RENDER
http.createServer((req, res) => {
    res.write('Codenexa Bot operativo');
    res.end();
}).listen(process.env.PORT || 10000);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// 2. FUNCIÓN RECURSIVA PARA CARGAR ARCHIVOS (Busca en todas las subcarpetas)
const getFiles = (dir) => {
    let files = [];
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

// 3. CARGA DINÁMICA DE COMANDOS Y EVENTOS
async function loadModules() {
    // Cargar Comandos
    const commandsPath = path.join(__dirname, 'commands');
    if (fs.existsSync(commandsPath)) {
        const commandFiles = getFiles(commandsPath);
        for (const filePath of commandFiles) {
            const fileUrl = pathToFileURL(filePath).href;
            const { default: command } = await import(fileUrl);
            if (command?.data?.name) {
                client.commands.set(command.data.name, command);
                console.log(`Command Loaded: ${command.data.name}`);
            }
        }
    }

    // Cargar Eventos
    const eventsPath = path.join(__dirname, 'events');
    if (fs.existsSync(eventsPath)) {
        const eventFiles = getFiles(eventsPath);
        for (const filePath of eventFiles) {
            const fileUrl = pathToFileURL(filePath).href;
            const { default: event } = await import(fileUrl);
            if (event?.name) {
                if (event.once) {
                    client.once(event.name, (...args) => event.execute(...args, client));
                } else {
                    client.on(event.name, (...args) => event.execute(...args, client));
                }
                console.log(`Event Loaded: ${event.name}`);
            }
        }
    }
}

// 4. LÓGICA DE REINICIO MENSUAL
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
    } catch (e) { console.error('Error reset:', e); }
}

// 5. INICIO
client.once('ready', async () => {
    console.log(`✅ Conectado como: ${client.user.tag}`);
    await checkMonthlyReset();
});

async function main() {
    // Conectar DB
    await mongoose.connect(process.env.MONGO_URI)
        .then(() => console.log('📡 DB Conectada'))
        .catch(err => console.error('DB Error:', err));

    // Cargar módulos
    await loadModules();

    // Login
    await client.login(process.env.TOKEN);
}

main().catch(console.error);