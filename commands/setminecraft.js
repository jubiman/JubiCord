const { SlashCommandBuilder } = require('discord.js');

// TODO: probably change it to having the server run on the bot, and add a FROM parameter in the packet the mc server sends
module.exports = {
    data: new SlashCommandBuilder()
      .setName('setminecraft')
      .setDescription('Links an identifier to this Discord server')
      .addStringOption(option => option.setName('identifier').setDescription('The Minecraft server Identifier').setRequired(true)),
    async execute(interaction, db) {
        const id = interaction.options.getString('identifier');
        const guildId = interaction.guild.id;
        
        db.run(`INSERT OR REPLACE INTO identifiers (id, guildId) VALUES (?, ?)`, [id, guildId], function(err) {
            if (err) {
                console.error(err.message);
                return interaction.reply({ content: 'Error linking identifier.', flags: 1 << 6 });
            }
            interaction.reply({ content: `Identifier ${id} linked to guild id: ${guildId}`, flags: 1 << 6 });
        });
    },
};