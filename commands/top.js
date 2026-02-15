const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('top')
        .setDescription('Muestra el ranking de los miembros más activos del club'),
    async execute(interaction) {
        const dbPath = path.join(process.cwd(), 'database.json');

        if (!fs.existsSync(dbPath)) {
            return interaction.reply({ content: 'Aún no hay datos registrados.', ephemeral: true });
        }

        const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const usuarios = db.usuarios;

        if (!usuarios || Object.keys(usuarios).length === 0) {
            return interaction.reply({ content: 'Nadie ha registrado tiempo en el club todavía.', ephemeral: true });
        }

        const ranking = Object.entries(usuarios)
            .map(([id, data]) => ({ id, minutos: data.minutos || 0 }))
            .sort((a, b) => b.minutos - a.minutos)
            .slice(0, 10);

        const embed = new EmbedBuilder()
            .setTitle('🏆 Cuadro de Honor del Club')
            .setDescription('Estos son los miembros que más tiempo han compartido con nosotros:')
            .setColor('#f1c40f')
            .setThumbnail(interaction.guild.iconURL());

        let lista = '';
        const medallas = ['🥇', '🥈', '🥉', '👤', '👤', '👤', '👤', '👤', '👤', '👤'];

        for (let i = 0; i < ranking.length; i++) {
            const usuario = await interaction.client.users.fetch(ranking[i].id).catch(() => null);
            const nombre = usuario ? usuario.username : 'Usuario Desconocido';
            const horas = (ranking[i].minutos / 60).toFixed(1);
            
            lista += `${medallas[i]} **${nombre}** — \`${horas} horas\`\n`;
        }

        embed.addFields({ name: 'Ranking de Actividad', value: lista || 'No hay datos suficientes.' });
        embed.setFooter({ text: '¡Sigue participando para aparecer aquí!' });

        await interaction.reply({ embeds: [embed] });
    }
};