const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            try {
                await command.execute(interaction);
            } catch (error) {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: 'Error al ejecutar comando.', flags: 64 });
                }
            }
        }

        if (interaction.isButton()) {
            if (interaction.customId === 'aceptar_reglas') {
                const dbPath = path.join(process.cwd(), 'database.json');
                const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
                const config = db[interaction.guild.id];

                if (!config || !config.autoRoleId) {
                    return interaction.reply({ content: 'El sistema de roles no está configurado.', flags: 64 });
                }

                const role = interaction.guild.roles.cache.get(config.autoRoleId);
                if (!role) {
                    return interaction.reply({ content: 'No se encontró el rol en el servidor.', flags: 64 });
                }

                if (interaction.member.roles.cache.has(config.autoRoleId)) {
                    return interaction.reply({ content: 'Ya aceptaste las reglas y eres miembro oficial del club. ✨', flags: 64 });
                }

                try {
                    await interaction.member.roles.add(role);
                    await interaction.reply({ content: '¡Reglas aceptadas! Ahora tienes acceso a todos los canales. ¡Bienvenido! 🌱', flags: 64 });
                } catch (error) {
                    console.error('Error al dar rol:', error);
                    await interaction.reply({ content: 'No pude darte el rol. Revisa que mi rol esté por encima del de Miembro.', flags: 64 });
                }
            }
        }
    }
};