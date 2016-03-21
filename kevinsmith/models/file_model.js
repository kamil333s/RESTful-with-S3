const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  Bucket: String,
  Key: {type: String},  
  URL: String
});

module.exports = mongoose.model('files', userSchema);