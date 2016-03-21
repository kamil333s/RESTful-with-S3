const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  Bucket: String,
  Files: [{URL:String}]
});

module.exports = mongoose.model('users', userSchema);