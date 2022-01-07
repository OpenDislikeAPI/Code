const mongoose = require("mongoose");

module.exports.connect_db = () =>  mongoose.connect(process.env.mongoURI,
  {
    useNewUrlParser: true, useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB Client Connected'))
  .catch(err => console.log(err));
