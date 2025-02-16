const { SlashCommandBuilder } = require('discord.js');
const api = require("../server/apiwrapper");

module.exports = {
    data: new SlashCommandBuilder()
      .setName('addsuperuser')
      .setDescription('Adds a superuser for this guild')
      .addUserOption(option => option.setName('user').setDescription('The user to add as a superuser').setRequired(true)),
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const guildId = interaction.guild.id;

        // Check if the user is a superuser
        if (!await api.isSuperuser(guildId, interaction.user.id)) {
            return interaction.reply({content: 'You do not have permission to use this command.', flags: 1 << 6});
        }

        api.addSuperuser(guildId, user.id).then((data) => {
            if (data.error) {
                return interaction.reply({content: `Error adding superuser: ${data.error.code}`, flags: 1 << 6});
            }
            interaction.reply({content: `${interaction.user.tag} has been added as a superuser for this guild.`, flags: 1 << 6});
        }).catch(err => {
            console.error(err);
            interaction.reply({content: 'Error adding superuser.', flags: 1 << 6});
        });
    },
};