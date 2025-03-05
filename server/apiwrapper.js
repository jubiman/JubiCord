const config = require("../config.json");

class Apiwrapper {
    constructor() {
        this.url = config.API_URL;
    }
    
    async createGuild(guildId, guildName, iconUrl) {
        const url = `${this.url}/guilds/create`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                guildId,
                guildName,
                iconUrl // this can be gotten by https://cdn.discordapp.com/icons/{guildId}/{icon}.png
            })
        });
        return response.json();
    }
    
    async getGuildConfig(guildId) {
        const url = `${this.url}/guilds/${guildId}`;
        const response = await fetch(url);
        return response.json();
    }
    
    async getGuildIdsFromIdentifier(identifier) {
        const url = `${this.url}/guilds?identifier=${identifier}`;
        const response = await fetch(url);
        const data = await response.json();
        // if (!Array.isArray(data.guilds)) return [];
        return data.guilds.map(guild => guild.guildId);
    }
    
    async getChannelId(guildId) {
        const guildConfig = await this.getGuildConfig(guildId);
        return guildConfig.channelId;
    }
    
    async setChannelId(guildId, channelId) {
        const url = `${this.url}/guilds/${guildId}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                channelId
            })
        });
        return response.json();
    }
    
    async getIdentifier(guildId) {
        const guildConfig = await this.getGuildConfig(guildId);
        return guildConfig.identifier;
    }
    
    async addIdentifier(guildId, identifier) {
        const url = `${this.url}/guilds/${guildId}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                identifier
            })
        });
        return response.json();
    }
    
    async removeIdentifier(guildId) {
        const url = `${this.url}/guilds/${guildId}/identifier`;
        const response = await fetch(url, {
            method: 'DELETE'
        });
        return response.json();
    }

    async addSuperuser(guildId, userId) {
        const url = `${this.url}/guilds/${guildId}/superusers/`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId
            })
        });
        return response.json();
    }
    
    async isSuperuser(guildId, userId) {
        const url = `${this.url}/guilds/${guildId}/superusers/${userId}`;
        const response = await fetch(url);
        const data = await response.json();
        return data.isSuperuser;
    }
    
    async removeSuperuser(guildId, userId) {
        const url = `${this.url}/guilds/${guildId}/superusers/${userId}`;
        const response = await fetch(url, {
            method: 'DELETE'
        });
        return response.json();
    }
    
    async getSuperusers(guildId) {
        const url = `${this.url}/guilds/${guildId}/superusers`;
        const response = await fetch(url);
        const data = await response.json();
        return data.superusers;
    }

    async createUser(userId, username, avatarUrl) {
        const url = `${this.url}/users/create`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId,
                username,
                avatarUrl
            })
        });
        return response.json();
    }

    async updateUser(userId, username, avatarUrl) {
        const url = `${this.url}/users/${userId}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                avatarUrl
            })
        });
        return response.json();
    }

    async deleteUser(userId) {
        const url = `${this.url}/users/${userId}`;
        const response = await fetch(url, {
            method: 'DELETE'
        });
        return response.json();
    }

    async addMembers(guildId, members) {
        const url = `${this.url}/guilds/${guildId}/members`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                members
            })
        });
        return response.json();
    }

    async removeMembers(guildId, members) {
        const url = `${this.url}/guilds/${guildId}/members`;
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                members
            })
        });
        return response.json();
    }
}

module.exports = new Apiwrapper();