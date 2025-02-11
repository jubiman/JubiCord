const { SlashCommandBuilder } = require('discord.js');
                
module.exports = {
    data: new SlashCommandBuilder()
        .setName('setchannel')
        .setDescription('Sets the channel for Minecraft chat')
        .addChannelOption(option => option.setName('channel').setDescription('The channel to use').setRequired(true)),
    async execute(interaction, db) {
        const channel = interaction.options.getChannel('channel');
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        // Check if the user is a superuser
        // const isSuperUser = await new Promise((resolve, reject) => {
        //     db.get(`SELECT 1 FROM superusers WHERE guildId = ? AND userId = ?`, [guildId, userId], (err, row) => {
        //         if (err) {
        //             reject(err);
        //         } else {
        //             resolve(!!row);
        //         }
        //     });
        // });

        if (!await db.isSuperuser(guildId, userId)) {
            return interaction.reply({content: 'You do not have permission to use this command.',  flags: 1 << 6});
        }

        // db.run(`INSERT
        // OR REPLACE INTO config (guildId, channelId) VALUES (?, ?)`, [guildId, channel.id], function (err) {
        //     if (err) {
        //         console.error(err.message);
        //         return interaction.reply({content: 'Error setting channel.',  flags: 1 << 6});
        //     }
        //     interaction.reply({
        //         content: `Minecraft chat channel set to <#${channel.id}> for this server.`,
        //         flags: 1 << 6
        //     });
        // });
        db.setChannelId(guildId, channel.id).then(() => {
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