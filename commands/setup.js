const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Configuracion del bot')
        .addChannelOption(opt => opt.setName('canal').setDescription('Canal de bienvenida').setRequired(true))
        .addRoleOption(opt => opt.setName('rol').setDescription('Rol automatico').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const dbPath = path.join(process.cwd(), 'database.json');
        const canal = interaction.options.getChannel('canal');
        const rol = interaction.options.getRole('rol');

        try {
            let db = {};
            if (fs.existsSync(dbPath)) {
                db = JSON.parse(fs.readFileSync(dbPath, 'utf8') || '{}');
            }

            db[interaction.guild.id] = {
                welcomeChannelId: canal.id,
                autoRoleId: rol.id
            };

            fs.writeFileSync(dbPath, JSON.stringify(db, null, 4));

            const embed = new EmbedBuilder()
                .setTitle('Configuracion Guardada')
                .setDescription(`Canal: <#${canal.id}>\nRol: ${rol.name}`)
                .setColor(0x00FF00);

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Hubo un error al guardar los datos' });
        }
    }
};