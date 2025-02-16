const { SlashCommandBuilder } = require('discord.js');
const api = require("../server/apiwrapper");

module.exports = {
    data: new SlashCommandBuilder()
      .setName('getguildconfig')
      .setDescription('Get the configuration for this guild'),
    async execute(interaction) {
        const guildId = interaction.guild.id;
        
        const id = await api.getIdentifier(guildId);
        const channelId = await api.getChannelId(guildId);
        const superusers = await api.getSuperusers(guildId);

        if (!id && !channelId && (!Array.isArray(superusers) || superusers.length === 0)) {
            return interaction.reply({content: 'No configuration set for this guild.', flags: 1 << 6});
        }
        
        // send an embed with the configuration
        console.log(superusers);
        interaction.reply({
            content: `Configuration for guild ${guildId}`,
            embeds: [
                {
                    title: 'Configuration',
                    fields: [
                        {
                            name: 'Identifier',
                            value: id || 'Not set',
                        },
                        {
                            name: 'Channel',
                            value: channelId ? `<#${channelId}>` : 'Not set',
                        },
                        {
                            name: 'Superusers',
                            value: (Array.isArray(superusers) && superusers.map(userId => `<@${userId}>`).join('\n')) || 'None',
                        }
                    ],
                },
            ],
        });
    },
}