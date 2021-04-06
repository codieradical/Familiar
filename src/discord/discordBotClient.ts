import { Client, DMChannel, Message } from "discord.js"
import events from "../events"
import fetch from "node-fetch"

class DiscordBotClient extends Client {
    constructor(options) {
        super(options)

        this.on('ready', async () => {
            console.log('& Discord client connected.');
            events.emitDiscordReady()

            var owner = await this.users.fetch(process.env.DISCORD_OP_USER_ID)

            this.user.setPresence({
                activity: {
                    name: owner.username,
                    type: "LISTENING",
                }
            })
        });
        this.login(process.env.DISCORD_BOT_TOKEN)
        
        this.on('messageReactionAdd', async (reaction, user) => {
            events.emitDiscordReactionAdded(reaction, user)
        });
        
        this.on('message', (msg) => {
            if (msg.author.id == this.user.id)
                return
                
            var botPrefix = `<@!${this.user.id}> `

            if (msg.content.startsWith(botPrefix) || msg.channel instanceof DMChannel) {
                var split = msg.content.substr(msg.content.startsWith(botPrefix) ? botPrefix.length : 0).split(/[ ,]+/)
                events.emitDiscordCommand(msg, split[0], split.length > 1 ? split.slice(1) : [])
            }
        });
    }
}

export default new DiscordBotClient({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] })