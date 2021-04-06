import events from "../events"
import IModule from "./IModule"
import * as packageInfo from "../../package.json"
import { MessageEmbed } from "discord.js"
import discordBotClient from "../discord/discordBotClient"
import { modules } from ".."
import os from "os"

export default class HelpModule implements IModule {
    registerModule() {
        events.onDiscordCommand(async (message, name, args) => {
            if (name == "who" && args.length == 2 && args[0] == "are" && args[1].startsWith("you")) {
                var owner = await discordBotClient.users.fetch(process.env.DISCORD_OP_USER_ID)

                const helpEmbed = new MessageEmbed()
                    .setColor('#DD2E44')
                    .setTitle(`${packageInfo.name} v${packageInfo.version}`)
                    .setURL('https://codie.gg/')
                    .setAuthor(packageInfo.author)
                    .setFooter("Occupying " + os.hostname())
                    .setDescription(`${packageInfo.description}\n\nHi! My name is **${process.env.FAMILIAR_NAME}**, I'm here to help **${owner.username}**!`)
                    .setThumbnail(discordBotClient.user.avatarURL())
                    .setTimestamp()

                message.channel.send(helpEmbed)
            }
        })
    }
}