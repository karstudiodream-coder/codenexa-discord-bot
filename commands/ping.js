import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Devuelve la latencia de respuesta del bot'),
    async execute(interaction) {
        await interaction.reply(`Latencia actual: ${interaction.client.ws.ping}ms`);
    },
};