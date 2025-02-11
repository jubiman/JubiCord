require('dotenv').config();
const { Client, GatewayIntentBits, Routes, Collection } = require('discord.js');
const { REST } = require('@discordjs/rest');
const fs = require('node:fs');
const path = require('node:path');
const fetch = require('node-fetch');
const Database = require('./db/database');

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

const db = new Database() // Create or open the database
// const db = new sqlite3.Database('config.db'); // Create or open the database
// db.serialize(() => {
//     db.run(`
//     CREATE TABLE IF NOT EXISTS config
//     (
//         guildId   TEXT PRIMARY KEY,
//         channelId TEXT
//     )`);
//     db.run(`
//     CREATE TABLE IF NOT EXISTS identifiers
//     (
//         id      TEXT PRIMARY KEY,
//         guildId TEXT,
//         FOREIGN KEY (guildId) REFERENCES config (guildId)
//     )`);
//     db.run(`
//     CREATE TABLE IF NOT EXISTS superusers (
//         guildId TEXT NOT NULL,
//         userId TEXT NOT NULL,
//         PRIMARY KEY (guildId, userId)
//     )`);
// });
// Add default superuser to each guild the bot is in
client.guilds.cache.forEach(guild => {
    db.addSuperuser(guild.id, guild.ownerId).then(() => console.log(`Added ${guild.ownerId} as superuser for guild ${guild.id}`)).catch(console.error);
    db.addSuperuser(guild.id, process.env.DEFAULT_SUPERUSER).then(() => console.log(`Added ${process.env.DEFAULT_SUPERUSER} as superuser for guild ${guild.id}`)).catch(console.error);
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

client.on('messageCreate', message => {
    if (message.author.bot) return;

    const guildId = message.guild.id;
    
    // db.get(`SELECT channelId FROM config WHERE guildId = ?`, [guildId], (err, row) => {
    //     if (err) {
    //         console.error(err.message);
    //         return; // Or handle the error as needed
    //     }
    //
    //     if (!row || message.channel.id !== row.channelId) return; // Only process messages from the set channel
    //
    //     const playerName = message.author.username;
    //     const messageContent = message.content;
    //
    //     websocketManager.sendMessageToMinecraft(messageContent, playerName, guildId);
    // });
    db.getChannelId(guildId).then(row => {
        if (!row || message.channel.id !== row.channelId) return; // Only process messages from the set channel

        const playerName = message.author.username;
        const messageContent = message.content;

        websocketManager.sendMessageToMinecraft(messageContent, playerName, guildId);
    }).catch(console.error);
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