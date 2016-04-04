const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  URL: String
});

module.exports = mongoose.model('files', userSchema);