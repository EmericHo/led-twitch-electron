const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const axios = require('axios');
const WebSocket = require('ws');
const { Control, Discovery, CustomMode } = require('magic-home');

const clientId = 'r99ibgskd6tsvakpit7hag9o6o1jty';
const clientSecret = '0364ju464muwj0850msf2rp7uq4w2d';
let accessToken = ''
const verifyToken = 'generated_by_twitch';


const getChannelInfo = async (targetChannelName) => {
    try {
        const channelInfoResponse = await axios.get(
            'https://api.twitch.tv/helix/users',
            {
                params: {
                    login: targetChannelName,
                },
                headers: {
                    'Client-ID': clientId,
                    'Authorization': `Bearer ${accessToken}`,
                },
            }
        );

        const channelInfo = channelInfoResponse.data.data[0];
        console.log('Channel Info:', channelInfo);
        return channelInfo;
    } catch (error) {
        console.error('Error getting channel info:', error.response.data);
    }
}

const subscribeToFollowerEvents = async () => {
    try {
        await getChannelInfo('Emeroc').then(async channelInfo => {

            const socket = new WebSocket('wss://eventsub.wss.twitch.tv/ws');

            socket.on('open', () => {
                console.log('WebSocket connection opened');
            });

            socket.on('message', (data) => {
                const message = JSON.parse(data);
                handleWebSocketMessage(socket, message, channelInfo.id);
            });

            socket.on('close', (code, reason) => {
                console.log(`WebSocket connection closed with code ${code}: ${reason}`);
            });


            console.log('Subscription response:', response.data);
        })
            .catch(error => {
                console.error('Error:', error.message);
            });
    } catch (error) {
        console.error('Error subscribing to follows:', error);
    }
};

function createWindow() {
    const mainWindow = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), nodeIntegration: true, // Assurez-vous que nodeIntegration est activé
            enableRemoteModule: true,
        }
    })

    ipcMain.on('auth', (event) => {

        const redirectUri = 'https://gradual.netlify.app/';
        const scopes = ['bits:read', 'moderator:read:followers', 'channel:read:subscriptions', 'user:read:subscriptions	'];

        const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scopes.join(' ')}`;
        console.log("authentication url:", authUrl)
        mainWindow.loadURL(authUrl);
    });

    mainWindow.webContents.on('did-navigate', (event, url) => {
        console.log('Current URL:', url);
        if (url.includes('?code=')) {
            const code = new URL(url).searchParams.get('code');
            console.log("authentication code:", code)

            axios.post('https://id.twitch.tv/oauth2/token', null, {
                params: {
                    client_id: clientId,
                    client_secret: clientSecret,
                    code,
                    grant_type: 'authorization_code',
                    redirect_uri: 'https://gradual.netlify.app/',
                },
            })
                .then(response => {
                    accessToken = response.data.access_token;
                    console.log(accessToken)
                    subscribeToFollowerEvents();
                })
                .catch(error => {
                    console.error('Error exchanging code for access token:', error);
                });
            // Close the Electron window after handling the OAuth code
            const mainWindow = BrowserWindow.getFocusedWindow();
            if (mainWindow) {
                mainWindow.close();
            }
        }
    });

    mainWindow.loadFile('app/front/index.html')
}

app.whenReady().then(() => {
    createWindow();
    let discovery = new Discovery();
    discovery.scan(500).then(devices => {
        console.log(devices)
    });

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
}).then(() => {
    // Spécifiez le port explicitement
    const port = 3000;
    mainWindow.loadURL(`http://localhost:${port}`);
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})

function createEventSubSubscriptionForFollowers(streamerId, session_id) {
    const apiUrl = 'https://api.twitch.tv/helix/eventsub/subscriptions';
    console.log('Sub to follow events:', streamerId);

    const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Client-Id': clientId,
        'Content-Type': 'application/json',
    };

    const data = {
        type: 'channel.follow',
        version: '2',
        condition: {
            broadcaster_user_id: streamerId,
            moderator_user_id: streamerId,
        },
        transport: {
            method: 'websocket',
            session_id: session_id
        }
    };

    axios.post(apiUrl, data, { headers })
        .then(response => {
            console.log('Subscription created successfully:', response.data);
        })
        .catch(error => {
            console.error('Error creating subscription:', error.response.data);
        });
}

function createEventSubSubscriptionForSubFisrtTime(streamerId, session_id) {
    const apiUrl = 'https://api.twitch.tv/helix/eventsub/subscriptions';
    console.log('Sub to follow events:', streamerId);

    const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Client-Id': clientId,
        'Content-Type': 'application/json',
    };

    const data = {
        type: 'channel.subscribe',
        version: '1',
        condition: {
            broadcaster_user_id: streamerId,
        },
        transport: {
            method: 'websocket',
            session_id: session_id
        }
    };

    axios.post(apiUrl, data, { headers })
        .then(response => {
            console.log('Subscription created successfully:', response.data);
        })
        .catch(error => {
            console.error('Error creating subscription:', error.response.data);
        });
}

function createEventSubSubscriptionForSubGift(streamerId, session_id) {
    const apiUrl = 'https://api.twitch.tv/helix/eventsub/subscriptions';
    console.log('Sub to follow events:', streamerId);

    const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Client-Id': clientId,
        'Content-Type': 'application/json',
    };

    const data = {
        type: 'channel.subscription.gift',
        version: '1',
        condition: {
            broadcaster_user_id: streamerId,
        },
        transport: {
            method: 'websocket',
            session_id: session_id
        }
    };

    axios.post(apiUrl, data, { headers })
        .then(response => {
            console.log('Subscription created successfully:', response.data);
        })
        .catch(error => {
            console.error('Error creating subscription:', error.response.data);
        });
}

function createEventSubSubscriptionForReSub(streamerId, session_id) {
    const apiUrl = 'https://api.twitch.tv/helix/eventsub/subscriptions';
    console.log('Sub to follow events:', streamerId);

    const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Client-Id': clientId,
        'Content-Type': 'application/json',
    };

    const data = {
        type: 'channel.subscription.message',
        version: '1',
        condition: {
            broadcaster_user_id: streamerId,
        },
        transport: {
            method: 'websocket',
            session_id: session_id
        }
    };

    axios.post(apiUrl, data, { headers })
        .then(response => {
            console.log('Subscription created successfully:', response.data);
        })
        .catch(error => {
            console.error('Error creating subscription:', error.response.data);
        });
}

function createEventSubSubscriptionForCheers(streamerId, session_id) {
    const apiUrl = 'https://api.twitch.tv/helix/eventsub/subscriptions';
    console.log('Sub to follow events:', streamerId);

    const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Client-Id': clientId,
        'Content-Type': 'application/json',
    };

    const data = {
        type: 'channel.cheer',
        version: '1',
        condition: {
            broadcaster_user_id: streamerId,
        },
        transport: {
            method: 'websocket',
            session_id: session_id
        }
    };

    axios.post(apiUrl, data, { headers })
        .then(response => {
            console.log('Subscription created successfully:', response.data);
        })
        .catch(error => {
            console.error('Error creating subscription:', error.response.data);
        });
}

function createEventSubSubscriptionForRaid(streamerId, session_id) {
    const apiUrl = 'https://api.twitch.tv/helix/eventsub/subscriptions';
    console.log('Sub to follow events:', streamerId);

    const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Client-Id': clientId,
        'Content-Type': 'application/json',
    };

    const data = {
        type: 'channel.raid',
        version: '1',
        condition: {
            broadcaster_user_id: streamerId,
        },
        transport: {
            method: 'websocket',
            session_id: session_id
        }
    };

    axios.post(apiUrl, data, { headers })
        .then(response => {
            console.log('Subscription created successfully:', response.data);
        })
        .catch(error => {
            console.error('Error creating subscription:', error.response.data);
        });
}

function handleWebSocketMessage(socket, message, streamerId) {
    switch (message.metadata.message_type) {
        case 'session_welcome':
            console.log('Received welcome message: ', message);
            createEventSubSubscriptionForFollowers(streamerId, message.payload.session.id);
            createEventSubSubscriptionForSubFisrtTime(streamerId, message.payload.session.id);
            createEventSubSubscriptionForSubGift(streamerId, message.payload.session.id);
            createEventSubSubscriptionForReSub(streamerId, message.payload.session.id);
            createEventSubSubscriptionForCheers(streamerId, message.payload.session.id);
            createEventSubSubscriptionForRaid(streamerId, message.payload.session.id);
            break;

        case 'session_keepalive':
            console.log('Keepalive websocket');
            break;

        case 'notification':
            console.log('Notification recieved');
            console.log(`Message type: ${message.metadata.message_type}, Notification type: ${message.payload.subscription.type}`)
            if (message.payload.subscription.type === 'channel.follow') {
                console.log(`${message.payload.event.user_name} a follow !`)
            }
            lights();
            break;

        default:
            console.log('Unhandled message type: ', message);
    }
}

async function lights() {
    const controller = new Control("192.168.1.16", { ack: Control.ackMask(0) });
    let my_effect = new CustomMode();

    my_effect
        .addColor(255, 0, 255)
        .addColor(0, 255, 0)
        .addColor(255, 0, 0)
        .addColor(0, 0, 255)
        .addColor(255, 0, 255)
        .addColor(0, 255, 0)
        .addColor(255, 0, 0)
        .addColor(0, 0, 255)
        .addColor(255, 0, 255)
        .addColor(0, 255, 0)
        .addColor(255, 0, 0)
        .addColor(0, 0, 255)
        .setTransitionType("fade");

    controller.setCustomPattern(my_effect, 100).then(success => {
        console.log((success) ? "success" : "failed");
    }).catch(err => {
        return console.log("Error:", err.message);
    });
    /*
    controller.setPattern('green_gradual_change', 100).then(success => {
        console.log((success) ? "success" : "failed");
    }).catch(err => {
        return console.log("Error:", err.message);
    });*/
    setTimeout(() => controller.setColor(5, 54, 30), 5000);
}

