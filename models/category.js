// models/category.js

let mongoose = require('mongoose');
let categorySchema = mongoose.Schema(
  {
    name: String,
    children: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category'
      }
    ],
    is_parent: Boolean,
    is_end: Boolean,
    count: Number
  });

module.exports = mongoose.model('category', categorySchema);