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
  const message = "🔥 MINTING IS NOW LIVE! 🔥\n\n" +
  "WL mint is now open exclusively for whitelisted wallets! Join the growth of WoolySwap by minting a Liquidity Lamb NFT! These unique NFTs provide you with an opportunity to become part of our community of early adopters while unlocking a TON of utilities.\n\n";
   const imageUrl = "https://i.ibb.co/6s9J01z/IMG-0617.png";
  const mintButtonText = "Mint Now 💎";
  const mintButtonUrl = "https://nft.woolyswap.com";
  const tweetButtonText = "Like, Comment + Repost 💬";
  const tweetButtonUrl = "https://x.com/woolyswap/status/1814607689260904517?s=46";
  const shareButtonText = "Share with Friends 🐑";
  const shareButtonUrl = "https://nft.woolyswap.com";

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

// curl -X POST https://whitelist-bot-backend.onrender.com/send-message -H "Content-Type: application/json"




// Add the listener for text messages
bot.on();

bot.launch();
