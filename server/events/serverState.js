const { EmbedBuilder} = require('discord.js');
        
module.exports = {
    name: 'serverState',
    async handle(wsm, ws, data) {
        const embed = new EmbedBuilder()
            .setColor(data.state === "stopped" ? 0xFF0000 : 0x00FF00)
            .setTitle(`Server ${data.state}`)
            .setTimestamp();

        // Get channel ID from database
        if (!ws.guildId) {
            await wsm.setGuildId(ws);
        }
        wsm.db.get(`SELECT channelId
                    FROM config
                    WHERE guildId = ?`, [ws.guildId], (err, row) => {
            if (err) {
                console.error(`Error getting channelId for guildId ${ws.guildId}: ${err.message}`);
                return;
            }
            if (row && row.channelId) {
                const channel = wsm.client.channels.cache.get(row.channelId);
                if (channel) {
                    channel.send({embeds: [embed]}).catch(console.error);
                }
            }
        });
    },
};