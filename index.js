require('dotenv').config();
const { Client, GatewayIntentBits, Routes, Collection } = require('discord.js');
const { REST } = require('@discordjs/rest');
const fs = require('node:fs');
const path = require('node:path');
const fetch = require('node-fetch');
const sqlite3 = require('sqlite3').verbose();

// Set up client
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const token = process.env.DISCORD_TOKEN;
const rest = new REST({ version: '10' }).setToken(token);

// Load commands
client.commands = new Collection();
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    commands.push(command.data.toJSON()); // TODO: remove some redundency?
    client.commands.set(command.data.name, command);
}

const db = new sqlite3.Database('config.db'); // Create or open the database
db.serialize(() => {
    db.run(`
    CREATE TABLE IF NOT EXISTS config
    (
        guildId   TEXT PRIMARY KEY,
        channelId TEXT
    )`);
    db.run(`
    CREATE TABLE IF NOT EXISTS identifiers
    (
        id      TEXT PRIMARY KEY,
        guildId TEXT,
        FOREIGN KEY (guildId) REFERENCES config (guildId)
    )`);
});

// On ready
client.once('ready', async () => {
    console.log('Bot is ready!');

    try {
        console.log('Started refreshing application (/) commands.');

        // Register commands globally first
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands globally.');

    } catch (error) {
        console.error(error);
    }
});

// Create commands
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName); // Get the command object

    if (!command) return;

    try {
        await command.execute(interaction, db); // Execute the command
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

const WebSocketManager = require('./server/websocket_manager');
const websocketManager = new WebSocketManager(client, db); // Pass client and db to the WebSocketManager
websocketManager.startServer(3542);

// TODO: check
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const guildId = message.guild.id;

    db.get(`SELECT channelId FROM config WHERE guildId = ?`, [guildId], (err, row) => {
        if (err) {
            console.error(err.message);
            return; // Or handle the error as needed
        }

        if (!row || message.channel.id !== row.channelId) return; // Only process messages from the set channel

        const playerName = message.author.username;
        const messageContent = message.content;

        websocketManager.sendMessageToMinecraft(messageContent, playerName, guildId);
    });
});

// ... (Other event handlers)

client.login(token).then(r => console.log(`Logged in as ${client.user.tag}`)).catch(console.error);


// Make sure the database closes when the bot exits
process.on('SIGINT', () => {
    console.log('Bot received SIGINT signal. Closing...');
    db.close();
    process.exit();
});

client.on('error', err => {
    console.error('Bot error:', err);
    db.close();
});

client.on('exit', () => {
    console.log('Bot exiting...');
    db.close();
});


// TODO: move this?
// ... (Function to send messages to Minecraft - you'll need to implement your communication logic)

async function sendToMinecraft(message, playerName) { // Include playerName
    try {
        const response = await fetch('YOUR_MINECRAFT_ENDPOINT', { // Replace with your endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message, player: playerName }), // Send message and player name
        });
        // ... (Handle response)
    } catch (error) {
        console.error('Error sending message to Minecraft:', error);
    }
}