require('dotenv').config();

const util = require('util');
// Define the formatting function
function formatMessage(level, ...args) {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const formattedArgs = args.map(arg =>
        typeof arg === 'object' ? util.inspect(arg, { depth: 5, colors: true }) : arg
    );
    return `[${timestamp}] [${level}] ${formattedArgs.join(' ')}`;
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

// Override console.error
const originalError = console.error;
console.error = (...args) => {
    originalError(formatMessage('ERROR', 'An error occurred'));
    originalError(...args);
}

const { Client, GatewayIntentBits, Routes, Collection, GuildMember} = require('discord.js');
const { REST } = require('@discordjs/rest');
const fs = require('node:fs');
const path = require('node:path');
const api = require('./server/apiwrapper');
const config = require('./config.json');

// Set up client
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] });
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
        console.log('Doing guild setup for anything we missed...');
        client.guilds.cache.forEach((guild) => {
            guild.members.fetch().then(() => {
                createGuild(guild);
                addUsers(guild);
                addMembers(guild);
                addSuperusers(guild);
            }).catch(console.error);
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

// TODO: delete guild data instantly or after a delay when the bot leaves a guild?
client.on('guildCreate', guild => {
    createGuild(guild);
    addUsers(guild);
    addSuperusers(guild);
});

// Listen to user join events and fetch user data to store in the database
client.on('guildMemberAdd', member => {
    // if the member is a bot, ignore
    if (member.user.bot) return;
    addMember(member);
    createUser(member.user);
});

// Listen to user update events and update user data in the database
client.on('guildMemberUpdate', (oldMember, newMember) => {
    // if the member is a bot, ignore
    if (newMember.user.bot) return;
    updateUser(newMember.user);
});

// Listen to user leave events and delete user data from the database
client.on('guildMemberRemove', member => {
    // if the member is a bot, ignore
    removeMember(member);
    deleteUser(member.user);
});

// Create a guild
function createGuild(guild) {
    api.createGuild(guild.id, guild.name, guild.icon).then(res => {
        if (res.error) {
            if (res.error.errno === 19) return; // Ignore duplicate entry error
            console.error(`Error creating guild: ${res.error.message || res.error.code}`);
            return;
        }
        console.log(`Created guild ${guild.id}`)
    }).catch(console.error);
}

// Add users to a guild
function addUsers(guild) {
    guild.members.cache.forEach(member => {
        // if the member is a bot, ignore
        if (member.user.bot) return;
        createUser(member.user);
    });
}

// Create a user
function createUser(user) {
    api.createUser(user.id, user.username, user.avatar).then(res => {
        if (res.error) {
            if (res.error.errno === 19) return; // Ignore duplicate entry error
            console.error(`Error creating user: ${res.error.message || res.error.code}`);
            return;
        }
        console.log(`Created user ${user.id}`)
    }).catch(console.error);
}

// Update a user
function updateUser(user) {
    api.updateUser(user.id, user.username, user.avatar).then(res => {
        if (res.error) {
            console.error(`Error updating user: ${res.error.message || res.error.code}`);
            return;
        }
        console.log(`Updated user ${user.id}`)
    }).catch(console.error);
}

// Delete a user
function deleteUser(user) {
    api.deleteUser(user.id).then(res => {
        if (res.error) {
            console.error(`Error deleting user: ${res.error.message || res.error.code}`);
            return;
        }
        console.log(`Deleted user ${user.id}`)
    }).catch(console.error);
}

function addMembers(guild) {
     api.addMembers(guild.id, guild.members.cache.filter(member => !member.user.bot).map(member => member.id)).then(res => {
        if (res.error) {
            if (res.error.errno === 19) return; // Ignore duplicate entry error
            console.error(`Error adding members: ${res.error.message || res.error.code}`);
            return;
        }
        console.log(`Added ${res.count} members to guild ${guild.id}`)
    }).catch(console.error);
}

function addMember(member) {
    api.addMembers(member.guild.id, [member.id]).then(res => {
        if (res.error) {
            if (res.error.errno === 19) return; // Ignore duplicate entry error
            console.error(`Error adding member: ${res.error.message || res.error.code}`);
            return;
        }
        console.log(`Added member ${member.id} to guild ${member.guild.id}`)
    }).catch(console.error);
}

function removeMember(member) {
    api.removeMembers(member.guild.id, [member.id]).then(res => {
        if (res.error) {
            console.error(`Error removing member: ${res.error.message || res.error.code}`);
            return;
        }
        console.log(`Removed member ${member.id} from guild ${member.guild.id}`)
    }).catch(console.error);
}

// Add superusers to a guild
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
process.on('unhandledRejection', err => {
    console.error('Unhandled rejection:', err);
    client.destroy().then(() => {
        console.log('Bot destroyed');
        process.exit(1);
    });
})

client.on('error', err => {
    console.error('Bot error:', err);
});

client.on('exit', () => {
    console.log('Bot exiting...');
});