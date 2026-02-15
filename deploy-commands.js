import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const commands = [];
const foldersPath = join(__dirname, 'commands');
const commandFolders = readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = join(foldersPath, folder);
    const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = join(commandsPath, file);
        const { default: command } = await import(`file://${filePath}`);
        
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        }
    }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`🚀 Iniciando la actualización de ${commands.length} comandos (/)`);

        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log(`✅ ¡Éxito! Se registraron ${data.length} comandos correctamente.`);
    } catch (error) {
        console.error('❌ Error al registrar comandos:', error);
    }
})();