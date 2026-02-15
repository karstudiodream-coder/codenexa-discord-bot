import { PermissionFlagsBits } from 'discord.js';

export default {
    name: 'messageCreate',
    async execute(message) {
        // Ignorar bots y mensajes fuera de servidores
        if (message.author.bot || !message.guild) return;

        // Detectar si el mensaje contiene un enlace
        const isLink = /https?:\/\/\S+/gi.test(message.content);
        
        // Si es un enlace y NO es administrador, se borra
        if (isLink && !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            await message.delete().catch(() => {});
            const msg = await message.channel.send(`${message.author}, el envío de enlaces no está permitido.`);
            
            // Borrar el aviso después de 5 segundos
            setTimeout(() => msg.delete().catch(() => {}), 5000);
        }
    },
};