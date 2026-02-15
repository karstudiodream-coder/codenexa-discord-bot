const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (message.author.bot || !message.guild) return;

        const isLink = /https?:\/\/\S+/gi.test(message.content);
        if (isLink && !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            await message.delete().catch(() => {});
            const msg = await message.channel.send(`${message.author}, el envío de enlaces no está permitido.`);
            setTimeout(() => msg.delete().catch(() => {}), 5000);
        }
    },
};