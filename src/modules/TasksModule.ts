import events from "../events"
import IModule from "./IModule"
import * as packageInfo from "../../package.json"
import { DMChannel, Message, MessageEmbed, MessageReaction, PartialUser, User } from "discord.js"
import discordBotClient from "../discord/discordBotClient"
import { modules } from ".."
import os from "os"
import { isOpUser } from "../discord/permissions"
import Task from "../schema/Task"
import SavedMessage from "../schema/SavedMessage"
import sleep from "../utils/sleep"

export default class TaskModule implements IModule {
    private static readonly CURRENT_TASK_MESSAGE_NAME = "CURRENT_TASK_MESSAGE_NAME"
    private static readonly APPROVE_EMOJI = "👍"
    private static readonly REMINDER_FREQUENCY_SECONDS = 600
    private running = false

    private ownerDMs : DMChannel = null;

    registerModule() {
        events.onDiscordReady(this.reminderLoop)
        events.onDiscordReady(this.updateTaskMessage)
        events.onDiscordCommand(this.addTaskCommandHandler)
        // events.onDiscordCommand(this.removeTaskCommandHandler)
        events.onDiscordReactionAdded(this.taskCompletionReactionHandler)
    }

    public reminderLoop = async () => {
        console.debug("& Starting Twitch tracker.")
        this.running = true
        
        while (this.running) {
            await sleep(TaskModule.REMINDER_FREQUENCY_SECONDS * 1000)
            try {
                await this.updateTaskMessage()
            } catch {
                // ignore
            }
        }
    }

    updateTaskMessage = async () => {
        if (this.ownerDMs == null)
            this.ownerDMs = await (await discordBotClient.users.fetch(process.env.DISCORD_OP_USER_ID)).createDM();

        await this.deleteSavedMessage()
        await this.createSavedMessage()
    }

    getCurrentTask = async () => {
        var tasks = await Task.find()
        tasks = tasks.sort((taskA, taskB) => taskA.createdAt - taskB.createdAt)
        return tasks[0]
    }

    deleteSavedMessage = async () => {
        var savedMessage = await SavedMessage.findOne({ name: TaskModule.CURRENT_TASK_MESSAGE_NAME}).exec()
        if (savedMessage != null) 
        {
            try {
                await (await this.ownerDMs.messages.fetch(savedMessage.messageID)).delete()
            } catch (error) {
                // ignore
            }
            await savedMessage.delete()
        }
    }

    createSavedMessage = async () => {
        var task = (await this.getCurrentTask())
        if (task != null) {
            var message = await this.ownerDMs.send(task.description)
            message.react(TaskModule.APPROVE_EMOJI)

            await new SavedMessage({
                name: TaskModule.CURRENT_TASK_MESSAGE_NAME,
                channelID: message.channel.id,
                messageID: message.id
            }).save()
        }
    }

    addTaskCommandHandler = async (message : Message, name : string, args : string[]) => {
        if (name == "i" && args.length >= 2 && args[0] == "need" && args[1] == "to") {

            var owner = await discordBotClient.users.fetch(process.env.DISCORD_OP_USER_ID)

            if (!isOpUser(message.author.id)) {
                message.channel.send(`Sorry, I only respond to ${owner.username}.`)
                return;
            }

            if (args.length < 3) {
                message.channel.send("What do you need to do?")
                return;
            }

            var description = args.slice(2).join(" ")
            var createdAt = new Date().getTime()

            await new Task({
                description,
                createdAt
            }).save()
        }
    }

    private taskCompletionReactionHandler = async (reaction: MessageReaction, user: User | PartialUser) => {
        // If the message isn't cached
        if (reaction.message.author == null)
            return
        // If it's not a reaction to an Alphabot message or Alphabot is reacting, ignore.
        if (reaction.message.author.id != discordBotClient.user.id || user.id == discordBotClient.user.id)
            return

        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                return
            }
        }

        // If it's not a task message
        var savedMessage = await SavedMessage.findOne({ messageID: reaction.message.id, name: TaskModule.CURRENT_TASK_MESSAGE_NAME }).exec()
        if (savedMessage == null)
            return

        if (reaction.emoji.name == TaskModule.APPROVE_EMOJI) {
            await (await this.getCurrentTask()).delete()
            await this.updateTaskMessage()
        }
    }
}