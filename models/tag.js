// models/tag.js

let mongoose = require('mongoose');
let tagSchema = mongoose.Schema(
  {
    name: String,
    count: Number
  }
);

module.exports = mongoose.model('tag', tagSchema);