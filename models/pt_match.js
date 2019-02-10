// models/post_tag_match.js

let mongoose = require('mongoose');
let pt_matchSchema = mongoose.Schema(
  {
    post_id: mongoose.Schema.Types.ObjectId,
    tag_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'tag'
    },
  }
);

module.exports = mongoose.model('pt_match', pt_matchSchema);