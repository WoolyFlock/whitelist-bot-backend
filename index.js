const express = require('express');
const expressApp = express();
const axios = require("axios");
const path = require("path");
const port = process.env.PORT || 3000;
expressApp.use(express.static('static'));
expressApp.use(express.json());
require('dotenv').config();

const { Telegraf, Markup } = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);

let loggedData = [];
let userStates = {}; // Object to track user progress

// Express route handler to log data from sender
expressApp.post('/log-wallet-address', (req, res) => {
  const { userId, username, walletAddress } = req.body;
  console.log(`Received wallet address: userId=${userId}, username=${username}, walletAddress=${walletAddress}`);
  // Store logged data (for example, in-memory)
  loggedData.push({ userId, username, walletAddress });
  res.sendStatus(200);
});

expressApp.get('/', (req, res) => {
  res.send('Hello World!');
});

expressApp.get('/logged-data', (req, res) => {
  res.json(loggedData);
});

expressApp.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

bot.command('start', async (ctx) => {
  const { id, first_name } = ctx.from;
  console.log(ctx.from);
  // Check if the user's wallet address is already saved
  const userExists = loggedData.some((entry) => entry.userId === id);
  if (userExists) {
    await bot.telegram.sendMessage(ctx.chat.id, 'Your wallet address is already saved. Thank you!');
    return;
  }

  const imageUrl = "https://i.ibb.co/CsYyZ6d/wooly-liquidity-lambs.jpg";
  
  // Initialize user state
  userStates[id] = 'start';

  // Adding a reply button to the welcome message
  await bot.telegram.sendPhoto(ctx.chat.id, imageUrl, {
    caption: `Hi ${first_name}, the launch of Liquidity Lambs NFT collection is almost upon us. You can now claim your whitelist spot by clicking the button below, limited spots available!`,
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Get Whitelist 🎁', callback_data: 'get_whitelist' }]
      ]
    }
  });
});

// Function to send 'get_whitelist' message
const sendGetWhitelistMessage = async (ctx) => {
  const { id, first_name } = ctx.from;

  const text = `Join the WoolySwap community and collect our 3,333 unique NFT sheeps, each representing the spirit of our community. Unlock exclusive benefits and rewards as you gather your flock!`;
  const buttons = [
    { text: 'Learn More', url: 'https://woolyswap.com' },
    { text: 'Claim Whitelist 🎁', callback_data: 'get_whitelist_clicked' }
  ];

  const imageUrl1 = "https://i.ibb.co/3dYRFKj/679737f6-5f56-4122-848f-9cdeeca2f900.jpg";
  const imageUrl2 = "https://i.ibb.co/j4qLv59/b0f6281f-55c0-4847-8309-1f3882ae1d80.jpg";

  // Send the first image
  await bot.telegram.sendPhoto(ctx.chat.id, imageUrl1);

  // Send the second image
  await bot.telegram.sendPhoto(ctx.chat.id, imageUrl2);

  // Send the main message with text and buttons
  await bot.telegram.sendMessage(ctx.chat.id, text, {
    reply_markup: {
      inline_keyboard: [buttons]
    }
  });

  // Update user state
  userStates[id] = 'get_whitelist_clicked';
};

bot.on('callback_query', async (ctx) => {
  const callbackData = ctx.callbackQuery.data;
  const messageId = ctx.callbackQuery.message.message_id;
  const { id } = ctx.from;
    if (callbackData === 'get_whitelist') {
      await sendGetWhitelistMessage(ctx);
    }

  const steps = {
    'get_whitelist_clicked': {
      text: `STEP 1: Follow us on Twitter.\n\nPlease follow WoolySwap on Twitter and click the button below to continue: https://twitter.com/WoolySwap`,
      buttons: [
        { text: 'Follow Twitter', url: 'https://twitter.com/WoolySwap' },
        { text: 'Done Task ✅', callback_data: 'follow_twitter_clicked' }
      ],
      nextState: 'follow_twitter_clicked'
    },
    'follow_twitter_clicked': {
      text: `STEP 2: Engage with our pinned tweet! Like, repost, and comment.\n\nVisit our Twitter page here: https://twitter.com/WoolySwap`,
      buttons: [
        { text: 'Open Twitter', url: 'https://twitter.com/WoolySwap' },
        { text: 'Done Task ✅', callback_data: 'engage_twitter_clicked' }
      ],
      nextState: 'engage_twitter_clicked'
    },
    'engage_twitter_clicked': {
      text: `STEP 3: Join our Telegram Community\n\nFollow the link below to join the flock 🐑🐑🐑🐑🐑🐑🐑✨✨`,
      buttons: [
        { text: 'Join Telegram', url: 'https://t.me/WoolySwap_Flock' },
        { text: 'Subscribe Channel', url: 'https://t.me/WoolySwap_Flock' },
        { text: 'Done Task ✅', callback_data: 'send_telegram_clicked' }
      ],
      nextState: 'send_telegram_clicked'
    },
    'send_telegram_clicked': {
      text: 'STEP 4: Submit your TON wallet address below:',
      buttons: [
        { text: 'Need Help?', url: 'https://ton.org/wallets?pagination%5Blimit%5D=-1' }
      ],
      nextState: 'submit_wallet'
    },
  };

  if (callbackData in steps) {
    // Update user state
    userStates[id] = steps[callbackData].nextState;

    // Delete the previous message
    await ctx.deleteMessage(messageId);
    // Send the current step message
    const step = steps[callbackData];
    await bot.telegram.sendMessage(ctx.chat.id, step.text, {
      reply_markup: {
        inline_keyboard: step.buttons.map(button => [button])
      }
    });
  }
});

// Create a handler for the wallet address submission
const walletAddressHandler = async (ctx) => {
  const { id, username } = ctx.from;

  // Check if the user's wallet address is already saved
  const userExists = loggedData.some((entry) => entry.userId === id);
  if (userExists) {
    await bot.telegram.sendMessage(ctx.chat.id, `Your wallet address is already saved. Thank you! 🐑✨`);
    return;
  }

  // Check if user has reached Step 4
  if (userStates[id] !== 'submit_wallet') {
    await bot.telegram.sendMessage(ctx.chat.id, `Click a button on the text to continue...`);
    return;
  }

  const walletAddress = ctx.message.text;
  // Log wallet address and ctx.from data
  loggedData.push({ userId: id, username, walletAddress });
  console.log('Logged:', { userId: id, username, walletAddress });
  await bot.telegram.sendMessage(ctx.chat.id, `🎉 Thank you for submitting your wallet address!\n\nWallet Address: ${walletAddress}\n\nOur team will verify the completion of tasks and award whitelist spots. Stay tuned for further updates! 🐑✨`);

  // Clear user state after submission
  delete userStates[id];
};

// Add the listener for text messages
bot.on('text', walletAddressHandler);

bot.launch();
