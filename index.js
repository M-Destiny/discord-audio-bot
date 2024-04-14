import { Client, GatewayIntentBits, PermissionsBitField } from 'discord.js';
import ytdl from 'ytdl-core';
import fetch from 'node-fetch';
import scdl from 'soundcloud-downloader';
import { joinVoiceChannel, getVoiceConnection, createAudioResource, StreamType, createAudioPlayer } from '@discordjs/voice';
import { config } from 'dotenv';
config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ]
});
const prefix = '!';

const queue = new Map();

client.once('ready', () => {
    console.log('Bot is online!');
});

client.on('messageCreate', async (message) => {
    console.log(`Received message: ${message.content}`);

    if (!message.content.startsWith(prefix)) {
        console.log('Message does not start with prefix.');
        return;
    }

    const serverQueue = queue.get(message.guild.id);

    if (message.content.startsWith(`${prefix}play`)) {
        console.log('Executing play command.');
        execute(message, serverQueue);
        return;
    } else if (message.content.startsWith(`${prefix}pause`)) {
        console.log('Executing pause command.');
        pause(message, serverQueue);
        return;
    } else if (message.content.startsWith(`${prefix}resume`)) {
        console.log('Executing resume command.');
        resume(message, serverQueue);
        return;
    } else if (message.content.startsWith(`${prefix}skip`)) {
        console.log('Executing skip command.');
        skip(message, serverQueue);
        return;
    } else if (message.content.startsWith(`${prefix}stop`)) {
        console.log('Executing stop command.');
        stop(message, serverQueue);
        return;
    } else {
        console.log('Invalid command.');
        message.channel.send('Invalid command!');
    }
});

async function execute(message, serverQueue) {
    const args = message.content.split(' ');
    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel) return message.channel.send('You need to be in a voice channel to play music!');

    const permissions = voiceChannel.permissionsFor(message.client.user);

    if (!permissions.has(PermissionsBitField.Flags.Connect) || !permissions.has(PermissionsBitField.Flags.Speak)) {
        return message.channel.send('I need the permissions to join and speak in your voice channel!');
    }

    let songInfo = null;
    let song = null;

    if (ytdl.validateURL(args[1])) {
        songInfo = await ytdl.getInfo(args[1]);
        song = {
            title: songInfo.videoDetails.title,
            url: songInfo.videoDetails.video_url,
        };
    } else {
        message.channel.send('Invalid URL!');
        return;
    }

    if (!serverQueue) {
        const queueContruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true,
        };

        queue.set(message.guild.id, queueContruct);

        queueContruct.songs.push(song);

        try {
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                debug: true,
            });
            queueContruct.connection = connection;
            play(message.guild, queueContruct.songs[0]);
        } catch (err) {
            console.log(err);
            queue.delete(message.guild.id);
            return message.channel.send(err);
        }
    } else {
        serverQueue.songs.push(song);
        return message.channel.send(`${song.title} has been added to the queue!`);
    }
}

async function getSpotifyTrackInfo(trackUrl) {
    const response = await fetch(`https://api.spotify.com/v1/tracks/${trackUrl.split('/')[4]}`, {
        headers: {
            'Authorization': `Bearer ${process.env.SPOTIFY_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
        },
    });
    const data = await response.json();
    return data;
}
// Works
// function play(guild, song) {
//     const serverQueue = queue.get(guild.id);
//     if (!song) {
//         if (serverQueue.connection) {
//             serverQueue.connection.destroy();
//         }
//         queue.delete(guild.id);
//         return;
//     }

//     if (!serverQueue.connection) {
//         return;
//     }

//     const audioPlayer = createAudioPlayer();
//     const audioResource = createAudioResource(ytdl(song.url), {
//         inlineVolume: true,
//         type: StreamType.Arbitrary,
//     });

//     audioPlayer.on('stateChange', (oldState, newState) => {
//         console.log(`Audio Player State Change: ${oldState.status} -> ${newState.status}`);
//         if (newState.status === 'idle') {
//             serverQueue.songs.shift();
//             play(guild, serverQueue.songs[0]);
//         }
//     });

//     audioPlayer.on('error', error => {
//         console.error(`Audio Player Error: ${error.message}`);
//         serverQueue.textChannel.send(`Error: ${error.message}`);
//         serverQueue.songs.shift();
//         play(guild, serverQueue.songs[0]);
//     });
//     console.log(audioResource, 'audio res');
//     // audioResource.on('input', (data) => {
//     //     console.log(`Audio stream data received: ${data.length} bytes`);
//     // });

//     // audioResource.on('error', (error) => {
//     //     console.error(`Audio stream error: ${error.message}`);
//     // });

//     audioPlayer.play(audioResource);
//     serverQueue.connection.subscribe(audioPlayer);

//     serverQueue.textChannel.send(`Start playing: **${song.title}**`);
// }

function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
        if (serverQueue && serverQueue.connection) {
            serverQueue.connection.destroy();
        }
        queue.delete(guild.id);
        return;
    }

    if (!serverQueue || !serverQueue.connection) {
        console.error('Server queue or connection is undefined.');
        return;
    }

    const audioPlayer = createAudioPlayer();
    const audioResource = createAudioResource(ytdl(song.url), {
        inlineVolume: true,
        type: StreamType.Arbitrary,
        buffer: 1024 * 1024 * 100, // 10 MB buffer
        silencePaddingFrames: 200,
        silenceRemaining: 300,
    });

    audioPlayer.on('stateChange', (oldState, newState) => {
        console.log(`Audio Player State Change: ${oldState.status} -> ${newState.status}`);
        console.log(`Playback Duration: ${audioResource.playbackDuration}ms`);

        if (newState.status === 'idle') {
            if (serverQueue.songs.length > 0) {
                serverQueue.songs.shift();
                play(guild, serverQueue.songs[0]);
            } else {
                serverQueue.textChannel.send('Queue is empty. Stopping playback.');
                serverQueue.connection.destroy();
                queue.delete(guild.id);
            }
        } else if (newState.status === 'paused' && oldState.status !== 'playing') {
            audioPlayer.unpause();
        } else if (newState.status === 'autopaused') {
            console.error('Audio Player Autopaused.');
            serverQueue.textChannel.send('The player has been automatically paused.');
        }
    });

    audioPlayer.on('error', error => {
        console.error(`Audio Player Error: ${error.message}`);
        serverQueue.textChannel.send(`Error: ${error.message}`);
        serverQueue.songs.shift();
        play(guild, serverQueue.songs[0]);
    });

    audioPlayer.on('debug', (message) => {
        console.log(`Audio Player Debug: ${message}`);
    });

    audioPlayer.on('data', (data) => {
        console.log(`Audio stream data received: ${data.length} bytes`);
    });

    audioPlayer.play(audioResource);
    serverQueue.connection.subscribe(audioPlayer);

    serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}


function pause(message, serverQueue) {
    if (!serverQueue) return message.channel.send('There is no song to pause!');
    if (!serverQueue.playing) return message.channel.send('The song is already paused!');
    serverQueue.connection.dispatcher.pause();
    serverQueue.playing = false;
    message.channel.send('Song paused!');
}

function resume(message, serverQueue) {
    if (!serverQueue) return message.channel.send('There is no song to resume!');
    if (serverQueue.playing) return message.channel.send('The song is already playing!');
    serverQueue.connection.dispatcher.resume();
    serverQueue.playing = true;
    message.channel.send('Song resumed!');
}

function skip(message, serverQueue) {
    if (!serverQueue) return message.channel.send('There is no song to skip!');
    serverQueue.connection.dispatcher.end();
    message.channel.send('Song skipped!');
}

function stop(message, serverQueue) {
    if (!serverQueue) return message.channel.send('There is no song to stop!');
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
    message.channel.send('Music stopped and bot disconnected!');
}

client.login(process.env.DISCORD_TOKEN);
