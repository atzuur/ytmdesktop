import { Client, Intents, ActivityType } from 'discord.js'
import { get } from './settingsProvider'

const clientId = '495666957501071390'

const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_PRESENCES],
})

let _isStarted

function isStarted() {
    return _isStarted
}

function _setIsStarted(value) {
    _isStarted = value
}

client.once('ready', () => {
    _setIsStarted(true)
})

async function login() {
    try {
        await client.login({ clientId })
    } catch (error) {
        if (!isStarted()) {
            setTimeout(() => {
                login()
            }, 10000)
        }
    }
}

client.on('shardDisconnected', () => {
    _setIsStarted(false)
    login()
})

async function start() {
    await login()
}

function stop() {
    client.destroy()
    _setIsStarted(false)
}

async function setActivity(info) {
    if (!isStarted()) {
        return
    }

    if (
        info.track.isAdvertisement ||
        info.track.isPaused ||
        !info.track.title
    ) {
        await client.user.setPresence({ activities: [] })
        return
    }

    const activity = {}
    const discordSettings = get('discord-presence-settings')

    if (discordSettings.details) activity.details = info.track.title
    if (discordSettings.state) activity.state = 'by ' + info.track.author
    activity.largeImage = info.track.cover
    activity.largeText = info.track.album || info.track.title
    activity.type = ActivityType.LISTENING

    await client.user.setPresence({ activities: [activity] })
}

module.exports = {
    isStarted: isStarted,
    start: start,
    stop: stop,
    setActivity: setActivity,
}
