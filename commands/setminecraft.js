const { SlashCommandBuilder } = require('discord.js');
const api = require('../server/apiwrapper');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setminecraft')
        .setDescription('Links an identifier to this Discord server')
        .addStringOption(option => option.setName('identifier').setDescription('The Minecraft server Identifier').setRequired(true)),
    async execute(interaction) {
        const id = interaction.options.getString('identifier');
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        // Check if the user is a superuser
        if (!await api.isSuperuser(guildId, userId)) {
            return interaction.reply({content: 'You do not have permission to use this command.',  flags: 1 << 6});
        }
        api.addIdentifier(guildId, id).then(() => {
            interaction.reply({content: `Identifier ${id} linked to guild id: ${guildId}`,  flags: 1 << 6});
        }).catch((err) => {
            console.error(err.message);
            return interaction.reply({content: 'Error linking identifier.',  flags: 1 << 6});
        });
    },
};