const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  await mongoose;
  mongoose
    .set("strictQuery", true)
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: "true",
      useUnifiedTopology: "true",
    })
    .then(() => {
      console.log("connected to db");
    })
    .catch((error) => console.log(error));
};

module.exports = { connectDB };