import 'dotenv/config';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import mongoose from 'mongoose';
import Usuario from './models/Usuario.js';

// Servidor para mantener vivo el bot en Render
http.createServer((req, res) => {
    res.write('Codenexa Bot está operando en el Nexo');
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

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Base de datos conectada en la nube'))
    .catch(err => console.error('Error al conectar MongoDB:', err));

client.commands = new Collection();

// Carga de Comandos
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
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
}

// Carga de Eventos
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
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
}

// Lógica de reinicio mensual corregida
async function checkMonthlyReset() {
    try {
        const now = new Date();
        const currentMonthLabel = `${now.getMonth() + 1}-${now.getFullYear()}`;
        
        // Buscamos un documento de control para no reiniciar cada vez que el bot prenda
        // Si no existe, lo creamos. Esto evita que los minutos se borren accidentalmente.
        let config = await mongoose.connection.db.collection('config').findOne({ name: 'monthly_reset' });

        if (!config || config.lastReset !== currentMonthLabel) {
            console.log(`Iniciando nuevo ciclo mensual: ${currentMonthLabel}`);
            
            // Ponemos a 0 solo los minutos del mes
            await Usuario.updateMany({}, { $set: { minutos_mes: 0 } });

            // Actualizamos la fecha del último reinicio en la DB
            await mongoose.connection.db.collection('config').updateOne(
                { name: 'monthly_reset' },
                { $set: { lastReset: currentMonthLabel } },
                { upsert: true }
            );

            console.log('Actividad mensual reiniciada correctamente.');
        } else {
            console.log(`Ciclo mensual verificado: ${currentMonthLabel} (Ya reiniciado)`);
        }
    } catch (error) {
        console.error('Error en el reinicio mensual:', error);
    }
}

client.once('ready', () => {
    checkMonthlyReset();
    console.log(`Conectado como: ${client.user.tag}`);
});

process.on('unhandledRejection', error => {
    console.error('Error no controlado:', error);
});

client.login(process.env.TOKEN);