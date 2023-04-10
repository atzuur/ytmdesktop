const clientId = '495666957501071390'
const RPC = require('discord-rpc')
const settingsProvider = require('./settingsProvider')

let client
let _isStarted

function isStarted() {
    return _isStarted
}

function _setIsStarted(value) {
    _isStarted = value
}

function start() {
    client = new RPC.Client({ transport: 'ipc' })

    client.on('ready', () => _setIsStarted(true))

    client.login({ clientId }).catch(() => {
        if (!isStarted()) {
            setTimeout(() => {
                start()
            }, 10000)
        }
    })

    client.on('disconnected', () => {
        _setIsStarted(false)
        start()
    })
}

function stop() {
    client.destroy()
    _setIsStarted(false)
}

async function setActivity(info) {
    if (isStarted() && info.track.title && !info.track.isPaused) {
        const now = Date.now()
        const activity = {}
        const discordSettings = settingsProvider.get('discord-presence-settings')

        if (discordSettings.details) activity.details = info.track.title

        if (discordSettings.state) activity.state = info.track.author

        if (discordSettings.time) {
            if (info.player.isPaused) {
                delete activity.startTimestamp
                delete activity.endTimestamp
            } else {
                activity.startTimestamp =
                    now + info.player.seekbarCurrentPosition * 1000
                activity.endTimestamp =
                    now +
                    (info.track.duration - info.player.seekbarCurrentPosition) *
                    1000
            }
        }

        activity.largeImageKey = info.track.cover
        activity.largeImageText = info.track.album || info.track.title
        activity.instance = false

        if (info.track.isAdvertisement) {
            await client.clearActivity()
        } else {
            await client.request('SET_ACTIVITY', {
                pid: process.pid,
                activity: {
                    type: 2,
                    state: activity.state,
                    details: activity.details,
                    timestamps: {
                        start: activity.startTimestamp,
                        end: activity.endTimestamp,
                    },
                    assets: {
                        large_image: activity.largeImageKey,
                        large_text: activity.largeImageText,
                    },
                    instance: activity.instance,
                    buttons: activity.buttons,
                },
            })
        }
    }
}

module.exports = {
    isStarted: isStarted,
    start: start,
    stop: stop,
    setActivity: setActivity,
}
