const mongoose = require('mongoose');

const blackListTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('BlackListToken', blackListTokenSchema);
