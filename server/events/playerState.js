module.exports = {
    name: 'playerState',
    async handle(wsm, ws, data) {
        console.log(`Received player state from Minecraft client: ${ws._socket.remoteAddress}: ${data.joined}`);

        const server = data.server
        const player = data.player
        const state = data.joined
        const uuid = data.uuid
        const userIcon = `https://crafatar.com/avatars/${uuid}`;
        if (!wsm.idToWs.get(server)) {
            console.log("Server not found, adding it to the list")
            wsm.idToWs.set(server, ws)
        }
        
        // Get guildId if needed
        if (!ws.guildId) {
            await wsm.setGuildId(ws);
        }
        
        if (state === "joined") {
            wsm.sendToServer(ws.guildId, `${player} joined the game.`, player, userIcon)
        } else {
            wsm.sendToServer(ws.guildId, `${player} left the game.`, player, userIcon)
        }
    }
}