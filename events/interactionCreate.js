import fs from 'fs';
import path from 'path';

export default {
    name: 'interactionCreate',
    async execute(interaction, client) {
        // Manejo de comandos de barra (Slash Commands)
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: 'Hubo un error al ejecutar este comando.', flags: 64 });
                }
            }
        }

        // Manejo de botones (Aceptar reglas)
        if (interaction.isButton()) {
            if (interaction.customId === 'aceptar_reglas') {
                const dbPath = path.join(process.cwd(), 'database.json');
                
                // Verificamos si existe la DB para evitar que el bot se detenga
                if (!fs.existsSync(dbPath)) {
                    return interaction.reply({ content: 'El sistema no ha sido configurado aún por un administrador.', flags: 64 });
                }

                const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
                const config = db[interaction.guild.id];

                if (!config || !config.autoRoleId) {
                    return interaction.reply({ content: 'El sistema de roles no está configurado correctamente.', flags: 64 });
                }

                const role = interaction.guild.roles.cache.get(config.autoRoleId);
                if (!role) {
                    return interaction.reply({ content: 'No se encontró el rol configurado en este servidor.', flags: 64 });
                }

                if (interaction.member.roles.cache.has(config.autoRoleId)) {
                    return interaction.reply({ content: 'Ya aceptaste las reglas y eres miembro oficial del club. ✨', flags: 64 });
                }

                try {
                    await interaction.member.roles.add(role);
                    await interaction.reply({ content: '¡Reglas aceptadas! Ahora tienes acceso a todos los canales. ¡Bienvenido! 🌱', flags: 64 });
                } catch (error) {
                    console.error('Error al dar rol:', error);
                    await interaction.reply({ content: 'No pude asignarte el rol. Por favor, contacta a un administrador para que verifique la jerarquía de mis permisos.', flags: 64 });
                }
            }
        }
    }
};