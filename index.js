require('dotenv').config();

// Define the formatting function
function formatMessage(level, ...args) {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    return `[${timestamp}] [${level}] ${args.join(' ')}`;
}

// Override console.log
const originalLog = console.log;
console.log = (...args) => {
    originalLog(formatMessage('LOG', ...args));
};

// Override console.debug
const originalDebug = console.debug;
console.debug = (...args) => {
    originalDebug(formatMessage('DEBUG', ...args));
};

const { Client, GatewayIntentBits, Routes, Collection } = require('discord.js');
const { REST } = require('@discordjs/rest');
const fs = require('node:fs');
const path = require('node:path');
const api = require('./server/apiwrapper');
const config = require('./config.json');

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

        // Add default superuser to each guild the bot is in
        console.log('Adding default superuser to each guild the bot is in...');
        client.guilds.cache.forEach(guild => {
            addSuperusers(guild);
            api.createGuild(guild.id, guild.name, guild.icon).then(() => console.log(`Created guild ${guild.id}`)).catch(console.error);
        });
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
        await command.execute(interaction); // Execute the command
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

const WebSocketManager = require('./server/websocket_manager');
const websocketManager = new WebSocketManager(client); // Pass client to the WebSocketManager
websocketManager.startServer(3542);

client.on('messageCreate', message => {
    if (message.author.bot) return;

    const guildId = message.guild.id;
    
    api.getChannelId(guildId).then(channelId => {
        if (!channelId || message.channel.id !== channelId) return; // Only process messages from the set channel

        const playerName = message.author.username;
        const messageContent = message.content;

        websocketManager.sendMessageToMinecraft(messageContent, playerName, guildId);
    }).catch(console.error);
});

client.on('guildCreate', guild => {
    api.createGuild(guild.id, guild.name, guild.icon).then(() => console.log(`Created guild ${guild.id}`)).catch(console.error);
    addSuperusers(guild.id);
});

function addSuperusers(guild) {
    api.addSuperuser(guild.id, guild.ownerId).then((data) => {
        if (data.error) {
            if (data.error.errno === 19) return; // Ignore duplicate entry error
            console.error(`Error adding superuser: ${data.error.message || data.error.code}`);
            return;
        }
        console.log(`Added ${guild.ownerId} as superuser for guild ${guild.id}`)
    }).catch(console.error);
    api.addSuperuser(guild.id, config.DEFAULT_SUPERUSER).then((data) => {
        if (data.error) {
            if (data.error.errno === 19) return; // Ignore duplicate entry error
            console.error(`Error adding superuser: ${data.error.message || data.error.code}`);
            return;
        }
        console.log(`Added ${config.DEFAULT_SUPERUSER} as superuser for guild ${guild.id}`)
    }).catch(console.error);
}

client.login(token).then(r => console.log(`Logged in as ${client.user.tag}`)).catch(console.error);


// Make sure the database closes when the bot exits
process.on('SIGINT', () => {
    console.log('Bot received SIGINT signal. Closing...');
    process.exit();
});

client.on('error', err => {
    console.error('Bot error:', err);
});

client.on('exit', () => {
    console.log('Bot exiting...');
});