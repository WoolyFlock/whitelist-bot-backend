const mongoose = require('mongoose');

const LoggedDataSchema = new mongoose.Schema({
  userId: { type: Number, required: true, unique: true },
  username: { type: String, required: true },
  walletAddress: { type: String, required: true }
});

const LoggedData = mongoose.model('LoggedData', LoggedDataSchema);

module.exports = LoggedData;
