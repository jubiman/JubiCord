const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
      .setName('removesuperuser')
      .setDescription('Removes a superuser for this guild')
      .addUserOption(option => option.setName('user').setDescription('The user to remove as a superuser').setRequired(true)),
    async execute(interaction, db) {
        const user = interaction.options.getUser('user');
        const guildId = interaction.guild.id;
        
        db.removeSuperuser(guildId, user.id).then(() => {
            interaction.reply({content: `${user.tag} has been removed as a superuser for this guild.`, flags: 1 << 6});
        }).catch(err => {
            console.error(err);
            interaction.reply({content: 'Error removing superuser.', flags: 1 << 6});
        });
    },
}