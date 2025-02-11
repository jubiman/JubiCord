require('dotenv').config();
const WebSocket = require('ws');
const https = require('https');
const fs = require('fs');
const EventManager = require('./eventManager');

class WebSocketManager {
    constructor(client, db) { // Add client and db as parameters
        this.client = client;
        this.db = db;
        this.ws = null;
        this.clients = new Set(); // Keep track of connected clients
        this.idToWs = new Map(); // Map identifiers to WebSocket objects
        this.guildIdToWs = new Map(); // Map guild IDs to WebSocket objects
        
        // Register events from the events folder
        this.eventManager = new EventManager(this);
    }

    startServer(port) {
        // openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -sha256 -days 365
        // TODO: make it work with ssl?
        //const privateKey = fs.readFileSync('./ssl/key.pem', 'utf8');
        //const certificate = fs.readFileSync('./ssl/cert.pem', 'utf8');
        //
        // const server = https.createServer({
        //     key: privateKey,
        //     passphrase: process.env.PEM_PASSPHRASE,
        //     cert: certificate,
        // });

        // this.ws = new WebSocket.Server({ server });
        this.ws = new WebSocket.Server({ port });
        console.log(`WebSocket server listening on port ${port} (SSL/TLS)`);
        
        // server.listen(port, () => {
        //     console.log(`WebSocket server listening on port ${port} (SSL/TLS)`);
        // });

        this.ws.on('connection', conn => {
            console.log(`Received connection from Minecraft client`);
            this.clients.add(conn); // Add client to the set
            
            // Send them an identify packet
            conn.send(JSON.stringify({ event: 'identify' }));

            conn.on('message', message => {
                this.handleMessage(conn, message);
            });

            conn.on('close', () => {
                console.log('Minecraft client disconnected');
                this.cleanup(conn);
            });

            conn.on('error', error => {
                console.error('WebSocket error:', error);
                this.cleanup(conn);
            });
        });
    }

    handleMessage(ws, message) {
        try {
            const data = JSON.parse(message);
            
            this.eventManager.handleEvent(ws, data); // Handle the event
            
        } catch (error) {
            console.error('Error parsing or handling message from Minecraft:', error);
        }
    }

    cleanup(ws) {
        this.clients.delete(ws);
        this.idToWs.delete(ws.identifier);
        this.guildIdToWs.delete(ws.guildId);
    }
    
    close(ws) {
        this.cleanup(ws);
        ws.close();
    }
    
    // TODO: make it so unclaimed servers don't crash this
    async setGuildId(ws) {
        if (!ws.identifier) {
            console.error('Server did not identify. Closing connection.');
            this.close(ws);
            return;
        }
        const row = await new Promise((resolve, reject) => {
            this.db.get(`SELECT guildId
                        FROM identifiers
                        WHERE id = ?`, [ws.identifier], (err, row) => {
                if (err) {
                    reject(err);
                }
                resolve(row);
            });
        });
        ws.guildId = row.guildId;
        this.guildIdToWs.set(ws.guildId, ws);
        console.debug(`Set guildId to ${ws.guildId}`);
    }
    
    async setChannelId(ws) {
        if (!ws.guildId) {
            await this.setGuildId(ws);
        }
        const row = await new Promise((resolve, reject) => {
            this.db.get(`SELECT channelId
                        FROM config
                        WHERE guildId = ?`, [ws.guildId], (err, row) => {
                if (err) {
                    reject(err);
                }
                resolve(row);
            });
        });
        ws.channelId = row.channelId;
        console.debug(`Set channelId to ${ws.channelId}`);
    }
    
    sendMessageToMinecraft(message, username, guildId) {
        this.guildIdToWs.get(guildId).send(JSON.stringify({ 
            event: 'message',
            message,
            username
        }));
    }

    sendToServer(id, message, username, avatar) {
        // get the channelId from the database
        this.db.get(`SELECT channelId FROM config WHERE guildId = ?`, [id], (err, row) => {
            if (err) {
                console.error(err.message);
                return;
            }
            if (row && row.channelId) {
                const channel = this.client.channels.cache.get(row.channelId);
                if (channel) {
                    channel.fetchWebhooks().then(webhook => {
                        webhook = webhook.find(webhook => webhook.name === "JubiCord");
                        webhook.send({
                            content: message,
                            username: username,
                            avatarURL: avatar
                        })
                    });
                }
            }
        });
    }
}

module.exports = WebSocketManager;
