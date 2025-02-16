const { EmbedBuilder} = require('discord.js');
const api = require('../apiwrapper');

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
        
        api.getChannelId(ws.guildId).then(channelId => {
            if (channelId) {
                const channel = wsm.client.channels.cache.get(channelId);
                if (channel) {
                    channel.send({embeds: [embed]}).catch(console.error);
                }
            }
        }).catch(console.error);
    },
};