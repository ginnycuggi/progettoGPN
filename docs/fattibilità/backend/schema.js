const mongoose = require('mongoose');
const Schema = new mongoose.Schema({
  filename: String,
  originalName: String,
  uploadDate: { type: Date, default: Date.now },
  rating: { type: Number, default: 0 }
});
module.exports = mongoose.model('Schema', Schema);