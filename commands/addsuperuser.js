const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
      .setName('addsuperuser')
      .setDescription('Adds a superuser for this guild')
      .addUserOption(option => option.setName('user').setDescription('The user to add as a superuser').setRequired(true)),
    async execute(interaction, db) {
        const user = interaction.options.getUser('user');
        const guildId = interaction.guild.id;

        // db.run(`INSERT INTO superusers (guildId, userId) VALUES (?, ?)`, [guildId, user.id], function(err) {
        //     if (err) {
        //         console.error(err.message);
        //         return interaction.reply({ content: 'Error adding superuser.', ephemeral: true });
        //     }
        //     interaction.reply({ content: `${user.tag} has been added as a superuser for this guild.`, ephemeral: true });
        // });
        db.addSuperuser(guildId, user.id).then(() => {
            interaction.reply({content: `${interaction.user.tag} has been added as a superuser for this guild.`, flags: 1 << 6});
        }).catch(err => {
            console.error(err);
            interaction.reply({content: 'Error adding superuser.', flags: 1 << 6});
        });
    },
};