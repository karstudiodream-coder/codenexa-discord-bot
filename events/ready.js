const { REST, Routes } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        const commands = Array.from(client.commands.values()).map(c => c.data.toJSON());
        const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

        try {
            await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, '1471508922048188614'),
                { body: commands }
            );

            console.log('Comandos registrados en el servidor 1471508922048188614');
            console.log('Sesion iniciada como ' + client.user.tag);
        } catch (error) {
            console.error('Error detectado:');
            console.error(error);
        }
    },
};