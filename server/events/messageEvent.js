module.exports = {
    name: 'message',
    async handle(wsm, ws, data) {
        const uuid = data.uuid;
        const message = data.message;
        let userIcon = `https://crafatar.com/avatars/${uuid}`;
        let username = data.player;
        if(!username) username = "JubiCord"
        if(!userIcon) userIcon = process.env.BOT_AVATAR_URL //TODO: set?
        
        if (!ws.guildId) {
            await wsm.setGuildId(ws);
        }
        
        wsm.sendToServer(ws.guildId, message, username, userIcon);
    }
};