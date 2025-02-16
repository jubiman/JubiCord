const { SlashCommandBuilder } = require('discord.js');
const api = require('../server/apiwrapper');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setchannel')
        .setDescription('Sets the channel for Minecraft chat')
        .addChannelOption(option => option.setName('channel').setDescription('The channel to use').setRequired(true)),
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        // Check if the user is a superuser
        if (!await api.isSuperuser(guildId, userId)) {
            return interaction.reply({content: 'You do not have permission to use this command.',  flags: 1 << 6});
        }

        api.setChannelId(guildId, channel.id).then(() => {
            interaction.reply({
                content: `Minecraft chat channel set to <#${channel.id}> for this server.`,
                flags: 1 << 6
            });
        }).catch((err) => {
            console.error(err.message);
            return interaction.reply({content: 'Error setting channel.',  flags: 1 << 6});
        });
    },
};