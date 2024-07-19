const express = require('express');
const cors = require('cors');
const expressApp = express();
const port = process.env.PORT || 3000;
expressApp.use(express.static('static'));
expressApp.use(express.json());
const { connectDB } = require('./db');
const LoggedData = require('./models/LoggedData');
require('dotenv').config();

const { Telegraf, Markup } = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);

const getRandomEmojis = () => {
  const emojis = ['🐶', '🐱', '🐭', '🐹', '🐰', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🐌', '🐞', '🐜', '🦋', '🐢', '🐍', '🦎', '🦂', '🐢', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🐊', '🐅', '🐆', '🦓', '🦍', '🐘', '🦏', '🦒', '🐃', '🐂', '🐄', '🐎', '🐖', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🦉', '🦇', '🐺', '🐲', '🐉', '🦕', '🦖', '🐾', '🐉', '🦖', '🦕'];
  let selectedEmojis = emojis.sort(() => 0.5 - Math.random()).slice(0, 5);
  selectedEmojis.push('🐑');
  return selectedEmojis.sort(() => 0.5 - Math.random());
};
let loggedData = [];
let userStates = {};

expressApp.use(cors());

// Connect to MongoDB
connectDB().then(() => {
  expressApp.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}).catch(err => console.error('Failed to connect to MongoDB', err));

// Express route handler to log data from sender
expressApp.post('/log-wallet-address', async (req, res) => {
  const { userId, username, walletAddress } = req.body;
  console.log(`Received wallet address: userId=${userId}, username=${username}, walletAddress=${walletAddress}`);

  // Save to MongoDB
  try {
    const loggedData = new LoggedData({ userId, username, walletAddress });
    await loggedData.save();
    res.sendStatus(200);
  } catch (err) {
    console.error('Failed to save to MongoDB', err);
    res.sendStatus(500);
  }
});

expressApp.get('/', (res) => {
  res.send('Hello World!');
});

expressApp.get('/logged-data', async (req, res) => {
  try {
    const data = await LoggedData.find();
    res.json(data);
  } catch (err) {
    console.error('Failed to retrieve logged data', err);
    res.sendStatus(500);
  }
});

/// send message to all users
expressApp.post('/send-message', async (req, res) => {
  const message = "Hey Wooly Shepherd, our Liquidity Lambs NFT collection is set to launch in less than 10 hours! You can now check your eligibility for the whitelist. Simply connect your wallet to verify your eligibility and get ready to mint! 🐑 🐑 🐑";
  const imageUrl = "https://i.ibb.co/T1DpkhR/IMG-0211.png";
  const mintButtonText = "Mint NFT 💎";
  const mintButtonUrl = "https://nft.woolyswap.com";
  const tweetButtonText = "Like, Comment + Repost 💬";
  const tweetButtonUrl = "https://x.com/woolyswap/status/1814324145951314168?s=46";
  const shareButtonText = "Share with Friends 👫";
  const shareButtonUrl = "https://telegram.me/share/url?url=https://t.me/WoolyRanch_bot";

  try {
    const users = await LoggedData.find();
    for (const user of users) {
      try {
        await bot.telegram.sendPhoto(user.userId, imageUrl, {
          caption: message,
          reply_markup: {
            inline_keyboard: [
              [{ text: mintButtonText, url: mintButtonUrl }],
              [{ text: tweetButtonText, url: tweetButtonUrl }],
              [{ text: shareButtonText, url: shareButtonUrl }]
            ]
          }
        });
      } catch (err) {
        if (err.response && err.response.error_code === 403) {
          console.error(`Failed to send message to user ${user.userId}: ${err.description}`);
        } else {
          throw err;
        }
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('Failed to send message to all users', err);
    res.sendStatus(500);
  }
});

// curl -X POST http://localhost:3000/send-message -H "Content-Type: application/json"




// Add the listener for text messages
bot.on();

bot.launch();
