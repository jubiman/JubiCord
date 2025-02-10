const fs = require('fs');

class EventManager {
    constructor(wsm) {
        this.wsm = wsm;
        this.events = new Map();
        
        this.registerEvents();
    }
    
    registerEvents() {
        console.log('Registering events...');
        const eventFiles = fs.readdirSync('./server/events').filter(file => file.endsWith('.js'));
        
        for (const file of eventFiles) {
            const event = require(`./events/${file}`);
            this.events.set(event.name, event);
            console.log(`Registered event: ${event.name}`);
        }
    }

    handleEvent(ws, data) {
        const event = data.event;
        console.log(`Received event: ${event}`);

        if (this.events.has(event)) {
            this.events.get(event).handle(this.wsm, ws, data);
        } else {
            console.log(`Received unknown event: ${event}`);
        }
    }
}

module.exports = EventManager;