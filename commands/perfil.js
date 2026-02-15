import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';

export default {
    data: new SlashCommandBuilder()
        .setName('perfil')
        .setDescription('Mira tu actividad y logros en la comunidad'),
    async execute(interaction) {
        await interaction.deferReply();

        const dbPath = path.join(process.cwd(), 'database.json');
        
        // Verificamos si la base de datos existe para evitar errores
        let db = { usuarios: {} };
        if (fs.existsSync(dbPath)) {
            db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        }

        const usuarioData = db.usuarios?.[interaction.user.id] || { minutos: 0, eventos: 0 };

        const horasTotales = (usuarioData.minutos / 60).toFixed(1);

        let nivelNombre = 'Recién Llegado';
        let proximoNivel = 10;
        let colorEmbed = '#a5adff';

        if (horasTotales >= 10) { nivelNombre = 'Colaborador'; proximoNivel = 30; colorEmbed = '#7289da'; }
        if (horasTotales >= 30) { nivelNombre = 'Pilar del Club'; proximoNivel = 60; colorEmbed = '#f1c40f'; }
        if (horasTotales >= 60) { nivelNombre = 'Leyenda'; proximoNivel = 100; colorEmbed = '#e91e63'; }

        const progreso = Math.min(Math.floor((horasTotales / proximoNivel) * 10), 10);
        const barra = '🟩'.repeat(progreso) + '⬜'.repeat(10 - progreso);

        const embed = new EmbedBuilder()
            .setAuthor({ name: `Miembro: ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
            .setTitle('✨ Estado de Actividad')
            .setColor(colorEmbed)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '🏆 Rango', value: `\`${nivelNombre}\``, inline: true },
                { name: '🤝 Eventos', value: `\`${usuarioData.eventos}\``, inline: true },
                { name: '⏱️ Tiempo Total', value: `\`${horasTotales} horas\``, inline: false },
                { name: '📊 Progreso de Nivel', value: `${barra} \`${horasTotales}/${proximoNivel}h\``, inline: false }
            )
            .setFooter({ text: 'Tu constancia fortalece nuestra comunidad.' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};