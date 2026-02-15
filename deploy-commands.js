import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const commands = [];
const foldersPath = join(__dirname, 'commands');

// Usamos el ID que me pasaste antes directamente para evitar errores de ENV
const CLIENT_ID = "1471568693128331405"; 
// Usamos TOKEN en lugar de DISCORD_TOKEN para que coincida con Render
const TOKEN = process.env.TOKEN;

const commandFolders = readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = join(foldersPath, folder);
    const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = join(commandsPath, file);
        const { default: command } = await import(`file://${filePath}`);
        
        if (command && 'data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        }
    }
}

const rest = new REST().setToken(TOKEN);

(async () => {
    try {
        console.log(`🚀 Iniciando la actualización de ${commands.length} comandos (/)`);

        const data = await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands },
        );

        console.log(`✅ ¡Éxito! Se registraron ${data.length} comandos correctamente.`);
    } catch (error) {
        console.error('❌ Error al registrar comandos:', error);
    }
})();