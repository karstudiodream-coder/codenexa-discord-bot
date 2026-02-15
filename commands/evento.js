import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('evento')
        .setDescription('Crea un evento de estudio')
        .addStringOption(opt => opt.setName('tema').setDescription('¿Qué vamos a estudiar?').setRequired(true))
        .addStringOption(opt => opt.setName('hora').setDescription('Ejemplo: 18:00 PM').setRequired(true)),
    async execute(interaction) {
        const tema = interaction.options.getString('tema');
        const hora = interaction.options.getString('hora');

        const embed = new EmbedBuilder()
            .setTitle('📅 Próxima Sesión de Estudio')
            .setThumbnail(interaction.user.displayAvatarURL())
            .setColor('#3498db')
            .addFields(
                { name: '📚 Tema:', value: tema, inline: true },
                { name: '⏰ Hora:', value: hora, inline: true },
                { name: '📍 Lugar:', value: 'Canales de Voz / Biblioteca', inline: false }
            )
            .setDescription('Reacciona con ✅ si vas a asistir para avisar a los demás.')
            .setFooter({ text: `Organizado por ${interaction.user.username}` });

        const mensaje = await interaction.reply({ embeds: [embed], fetchReply: true });
        await mensaje.react('✅');
    }
};