import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';

export default {
    data: new SlashCommandBuilder()
        .setName('ranking')
        .setDescription('Muestra el cuadro de honor mensual del club'),
    async execute(interaction) {
        await interaction.deferReply();

        const dbPath = path.join(process.cwd(), 'database.json');
        
        // Verificación de seguridad por si no hay datos aún
        if (!fs.existsSync(dbPath)) {
            return interaction.editReply({ content: 'Aún no hay registros de actividad este mes.' });
        }

        const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const usuarios = db.usuarios || {};

        const listaRanking = Object.entries(usuarios)
            .map(([id, data]) => ({ id, minutos: data.minutos || 0 }))
            .sort((a, b) => b.minutos - a.minutos)
            .slice(0, 10);

        if (listaRanking.length === 0) {
            return interaction.editReply({ content: 'Aún no hay registros de actividad este mes.' });
        }

        const embed = new EmbedBuilder()
            .setTitle('🏆 Cuadro de Honor Mensual')
            .setDescription('Los miembros más activos en voz durante este periodo:')
            .setColor('#f1c40f')
            .setThumbnail(interaction.guild.iconURL());

        const medallas = ['🥇', '🥈', '🥉', '👤', '👤', '👤', '👤', '👤', '👤', '👤'];
        let descripcion = '';

        for (let i = 0; i < listaRanking.length; i++) {
            try {
                const usuario = await interaction.client.users.fetch(listaRanking[i].id);
                const horas = (listaRanking[i].minutos / 60).toFixed(1);
                descripcion += `${medallas[i]} **${usuario.username}** — \`${horas}h\`\n`;
            } catch (e) {
                descripcion += `${medallas[i]} *Usuario fuera del club* — \`0h\`\n`;
            }
        }

        embed.addFields({ name: 'Top 10 Miembros', value: descripcion });
        embed.setFooter({ text: `Mes actual: ${db.lastReset || 'Iniciando ciclo'}` });

        await interaction.editReply({ embeds: [embed] });
    }
};