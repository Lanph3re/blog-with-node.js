// models/post.js

let mongoose = require('mongoose');
let postSchema = mongoose.Schema(
  {
    category: String,
    title: String,
    contents: String,
    tags: [
      String
    ],
    thumbnail: String,
    /*
    -----------------------------
    comment feature, TODO
    -----------------------------
    comments: [{
        name: String,
        memo: String,
        password: String,
        date: { type: Date, default: Date.now},
    }],
    */
    date: { type: Date, default: Date.now },
  }
);

postSchema.index({date: -1});

module.exports = mongoose.model('postContents', postSchema);