const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
      .setName('getguildconfig')
      .setDescription('Get the configuration for this guild'),
    async execute(interaction, db) {
        const guildId = interaction.guild.id;
        
        const id = await db.getIdentifier(guildId);
        const channelId = await db.getChannelId(guildId);
        const superusers = await db.getSuperusers(guildId);
        
        // send an embed with the configuration
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
                            value: superusers.map(userId => `<@${userId}>`).join('\n') || 'None',
                        }
                    ],
                },
            ],
        });
    },
}