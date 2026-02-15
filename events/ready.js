export default {
    name: 'ready',
    once: true,
    async execute(client) {
        // Esto es lo único que necesitas para saber que el bot prendió
        console.log(` Sesion iniciada como ${client.user.tag}`);
        
        // Configuramos el estado del bot (opcional pero genial)
        client.user.setActivity('operando en el Nexo', { type: 0 }); // "Playing operando en el Nexo"
    },
};