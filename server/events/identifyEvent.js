module.exports = {
    name: 'identify',
    handle(wsm, ws, data) {
        console.log(`Received identification from Minecraft client: ${ws._socket.remoteAddress}: ${data.identifier}`);
        
        // attach the identifier to the WebSocket object, useful for logging and such
        ws.identifier = data.identifier;
        wsm.idToWs.set(data.identifier, ws);
        wsm.setGuildId(ws).catch(console.error);
        console.log(`Mapped identifier to WebSocket: ${data.identifier}`);
    }
};