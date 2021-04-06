export function isOpUser(discordUserID: String) {
    return discordUserID == process.env.DISCORD_OP_USER_ID
}