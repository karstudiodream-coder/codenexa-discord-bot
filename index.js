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

// 2. FUNCIÓN RECURSIVA PARA CARGAR ARCHIVOS
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

// 3. CARGA DINÁMICA DE MÓDULOS
async function loadModules() {
    console.log('--- Cargando Módulos ---');
    
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = getFiles(commandsPath);
    for (const filePath of commandFiles) {
        try {
            const fileUrl = pathToFileURL(filePath).href;
            const { default: command } = await import(fileUrl);
            if (command?.data?.name) {
                client.commands.set(command.data.name, command);
                console.log(`✅ Comando: ${command.data.name}`);
            }
        } catch (err) {
            console.error(`❌ Error cargando comando en ${filePath}:`, err.message);
        }
    }

    const eventsPath = path.join(__dirname, 'events');
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
                console.log(`✅ Evento: ${event.name}`);
            }
        } catch (err) {
            console.error(`❌ Error cargando evento en ${filePath}:`, err.message);
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
    } catch (e) { console.error('Error reset mensual:', e); }
}

// 5. EVENTO READY (Interno)
client.once('ready', async () => {
    console.log('---------------------------------------');
    console.log(`🚀 BOT ONLINE: ${client.user.tag}`);
    console.log('---------------------------------------');
    await checkMonthlyReset();
});

// 6. FUNCIÓN PRINCIPAL CON DIAGNÓSTICO
async function main() {
    try {
        console.log('Step 1: Conectando a MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('📡 DB Conectada');

        console.log('Step 2: Cargando archivos...');
        await loadModules();

        console.log('Step 3: Intentando login en Discord...');
        if (!process.env.TOKEN) {
            throw new Error('La variable TOKEN no está definida en Render.');
        }

        await client.login(process.env.TOKEN);

    } catch (error) {
        console.log('---------------------------------------');
        console.error('❌ ERROR FATAL AL INICIAR:');
        console.error(error);
        console.log('---------------------------------------');
        process.exit(1); // Forzamos reinicio si hay error crítico
    }
}

main();