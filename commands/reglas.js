const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reglas')
        .setDescription('Publica las normas de la comunidad')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await interaction.deferReply();

        const rutaImagen = path.join(process.cwd(), 'reglas.png');
        
        const embed = new EmbedBuilder()
            .setTitle('✨ Nuestra Convivencia en el Club')
            .setDescription('Este es un espacio de apoyo mutuo. Al formar parte de esta comunidad, aceptamos lo siguiente:')
            .addFields(
                { name: '🤝 Colaboración', value: 'Ayudamos cuando podemos y pedimos ayuda con respeto.' },
                { name: '🌱 Crecimiento', value: 'Mantenemos los canales limpios para que todos puedan concentrarse.' },
                { name: '🛡️ Respeto', value: 'Valoramos el tiempo y el esfuerzo de cada miembro.' }
            )
            .setColor('#a5adff')
            .setFooter({ text: 'Haz clic en el botón de abajo para empezar tu camino.' });

        const fila = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('aceptar_reglas')
                    .setLabel('Aceptar y Unirse')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('✅')
            );

        if (fs.existsSync(rutaImagen)) {
            const imagen = new AttachmentBuilder(rutaImagen);
            embed.setImage('attachment://reglas.png');
            await interaction.editReply({ embeds: [embed], components: [fila], files: [imagen] });
        } else {
            await interaction.editReply({ embeds: [embed], components: [fila] });
        }
    }
};