# Discord Audio Bot

This is an open-source Discord audio bot that supports multiple platforms to play audio. The bot is built using Node.js and npm and utilizes the `discord.js` and `@discordjs/voice` libraries to interact with Discord's API and play audio in voice channels.


## Installation and Setup

Follow these steps to clone and install the bot:

1. **Clone the Repository**

   ```bash
   git clone https://github.com/M-Destiny/discord-audio-bot.git
   ```

2. **Navigate to the Project Directory**

   ```bash
   cd discord-audio-bot
   ```

3. **Install Dependencies**

   ```bash
   npm install
   ```

4. **Set Up Environment Variables**

   Create a `.env` file in the project directory and add your Discord bot token.

   ```
   DISCORD_TOKEN=your_discord_bot_token
   ```

5. **Run the Bot**

   ```bash
   npm start
   ```

## Adding the Bot to Your Server

To add this bot to your Discord server, click [here](https://discord.com/oauth2/authorize?client_id=1200705682152898570).

## Contributing

If you would like to contribute to this project, please follow these guidelines:

1. Fork the repository and create a new branch for your feature or bug fix.
2. Make your changes and test thoroughly.
3. Ensure your code follows the existing coding style and conventions.
4. Update the README with details of your changes if necessary.
5. Submit a pull request for review.

## Dependencies

The bot uses the following npm packages:

- `discord.js`: For interacting with Discord's API.
- `ytdl-core`: For downloading and streaming YouTube audio.
- `node-fetch`: For making HTTP requests to the Spotify API.
- `soundcloud-downloader`: For downloading tracks from SoundCloud.
- `@discordjs/voice`: For handling voice connections and audio playback.

## Usage

The bot uses the following commands prefixed with `!`:

- `!play [YouTube URL]`: Play audio from a YouTube link.
- `!pause`: Pause the currently playing audio.
- `!resume`: Resume playback of paused audio.
- `!skip`: Skip to the next track in the queue.
- `!stop`: Stop playback and disconnect from the voice channel.

## Version 0: Initial Commit

This code represents the initial commit, the first base commit for the project. The bot currently supports the following features:

- Play audio from YouTube links
- Pause and resume playback
- Skip to the next track in the queue
- Stop playback and disconnect from the voice channel

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

Feel free to modify and expand upon this bot as you see fit! If you encounter any issues or have suggestions for improvements, please open an issue on GitHub. Happy coding!