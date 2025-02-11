const { SlashCommandBuilder } = require('discord.js');
        
module.exports = {
    data: new SlashCommandBuilder()
        .setName('setminecraft')
        .setDescription('Links an identifier to this Discord server')
        .addStringOption(option => option.setName('identifier').setDescription('The Minecraft server Identifier').setRequired(true)),
    async execute(interaction, db) {
        const id = interaction.options.getString('identifier');
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

        // db.run(`INSERT OR REPLACE INTO identifiers (id, guildId) VALUES (?, ?)`, [id, guildId], function (err) {
        //     if (err) {
        //         console.error(err.message);
        //         return interaction.reply({content: 'Error linking identifier.',  flags: 1 << 6});
        //     }
        //     interaction.reply({content: `Identifier ${id} linked to guild id: ${guildId}`,  flags: 1 << 6});
        // });
        db.addIdentifier(guildId, id).then(() => {
            interaction.reply({content: `Identifier ${id} linked to guild id: ${guildId}`,  flags: 1 << 6});
        }).catch((err) => {
            console.error(err.message);
            return interaction.reply({content: 'Error linking identifier.',  flags: 1 << 6});
        });
    },
};