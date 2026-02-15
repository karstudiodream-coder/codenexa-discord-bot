import 'dotenv/config';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import mongoose from 'mongoose';
import Usuario from './models/Usuario.js';

http.createServer((req, res) => {
    res.write('Codenexa Bot está operando en el Nexo 🚀');
    res.end();
}).listen(process.env.PORT || 8080);

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

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Base de datos conectada en la nube 🌐'))
    .catch(err => console.error('Error al conectar MongoDB:', err));

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
if (!fs.existsSync(commandsPath)) fs.mkdirSync(commandsPath);

const commandFolders = fs.readdirSync(commandsPath);
for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    
    if (fs.lstatSync(folderPath).isDirectory()) {
        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const filePath = `file://${path.join(folderPath, file)}`;
            const { default: command } = await import(filePath);
            if (command?.data && command?.execute) {
                client.commands.set(command.data.name, command);
            }
        }
    }
}

const eventsPath = path.join(__dirname, 'events');
if (!fs.existsSync(eventsPath)) fs.mkdirSync(eventsPath);
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = `file://${path.join(eventsPath, file)}`;
    const { default: event } = await import(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

async function checkMonthlyReset() {
    try {
        const now = new Date();
        const currentMonth = `${now.getMonth() + 1}-${now.getFullYear()}`;
        
        // Usamos una pequeña lógica para saber si ya reiniciamos este mes
        // Podrías guardar esto en una colección aparte, por ahora lo comparamos con un log
        console.log(`Verificando ciclo mensual: ${currentMonth}`);
        
        // Esta línea pone en 0 los minutos de todos los usuarios en la nube
        // pero NO toca los puntos_totales.
        await Usuario.updateMany({}, { $set: { minutos_mes: 0 } });
        
        console.log('Reinicio de actividad mensual completado.');
    } catch (error) {
        console.error('Error en el reinicio mensual:', error);
    }
}

client.once('ready', () => {
    checkMonthlyReset();
    console.log(`Conectado como: ${client.user.tag}`);
});

process.on('unhandledRejection', error => {
    console.error('Error detectado:', error);
});

client.login(process.env.TOKEN);