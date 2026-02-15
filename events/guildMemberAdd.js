import { AttachmentBuilder, EmbedBuilder } from 'discord.js';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import fs from 'fs';
import path from 'path';

export default {
    name: 'guildMemberAdd',
    async execute(member) {
        const dbPath = path.join(process.cwd(), 'database.json');
        if (!fs.existsSync(dbPath)) return;

        const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const config = db[member.guild.id];
        if (!config) return;

        // Auto-rol
        const role = member.guild.roles.cache.get(config.autoRoleId);
        if (role) await member.roles.add(role).catch(() => {});

        // Creación del Canvas
        const canvas = createCanvas(1000, 500);
        const ctx = canvas.getContext('2d');

        try {
            const background = await loadImage('./fondo.png');
            ctx.drawImage(background, 0, 0, 1000, 500);
        } catch (e) {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, 1000, 500);
        }

        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
        ctx.beginPath();
        ctx.roundRect(400, 0, 600, 500, [50, 0, 0, 50]);
        ctx.fill();

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(230, 250, 140, 0, Math.PI * 2, true);
        ctx.lineWidth = 15;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        ctx.clip();
        
        const avatar = await loadImage(member.user.displayAvatarURL({ extension: 'png', size: 512 }));
        ctx.drawImage(avatar, 90, 110, 280, 280);
        ctx.restore();

        ctx.font = 'bold 24px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('BIENVENIDO AL', 480, 180);

        ctx.font = 'bold 70px sans-serif';
        ctx.fillStyle = '#f8fafc';
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 5;
        ctx.fillText('CLUB DE', 480, 250);
        ctx.fillText('ESTUDIO', 480, 320);

        ctx.font = '35px sans-serif';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`@${member.user.username}`, 480, 385);

        const channel = member.guild.channels.cache.get(config.welcomeChannelId);
        if (channel) {
            const buffer = await canvas.encode('png');
            const file = new AttachmentBuilder(buffer, { name: 'welcome-club.png' });

            const embed = new EmbedBuilder()
                .setAuthor({ name: 'Acceso concedido al Club', iconURL: member.guild.iconURL() })
                .setDescription(`### Una nueva mente brillante \nHola ${member}, tu escritorio está listo. ¡A por todas!`)
                .setImage('attachment://welcome-club.png')
                .setColor('#38bdf8');

            await channel.send({ content: `¡Bienvenido/a al equipo, ${member}!`, embeds: [embed], files: [file] });
        }
    }
};