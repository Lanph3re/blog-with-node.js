const express = require("express");
const posts = require("../models/post");
const categories = require("../models/category");
const tags = require("../models/tag");
const pt_matches = require("../models/pt_match");
const moment = require("moment");
const h2p = require('html2plaintext');
const router = express.Router();

router.get("/", (req, res) => {
  let page_num = req.query.page
    ? req.query.page
    : 1;
  let limitSize = 8;
  let skipSize = (page_num - 1) * limitSize;

  let category_load = new Promise((resolve, reject) => {
    categories
      .find({ $where: "this.is_parent == true" })
      .populate("children")
      .exec((err, parent_categories) => {
        if (err) reject(err);
        resolve(parent_categories);
      });
  });

  let posts_load = new Promise((resolve, reject) => {
    posts
      .find({})
      .sort({ date: -1 })
      .skip(skipSize)
      .limit(limitSize)
      .exec((err, posts) => {
        if (err) reject(err);
        resolve(posts);
      });
  });

  let posts_count_load = new Promise((resolve, reject) => {
    posts
      .countDocuments({}, (err, count) => {
        if (err) reject(err);
        resolve(count);
      });
  });

  Promise
    .all([category_load, posts_load, posts_count_load])
    .then((page_info) => {

      // convert html to plaintext
      let parsed_posts = page_info[1].map((post) => {
        return h2p(post.contents);
      });

      res.render("posts", {
        path: "/posts",
        parent_categories: page_info[0],
        category: "전체 글 보기",
        posts: page_info[1],
        parsed_posts: parsed_posts,
        page_num: page_num,
        total_num: page_info[2],
        limitSize: limitSize,
        moment: moment
      });
    })
    .catch((err) => {
      console.log(err);
    });
});

router.get("/view", (req, res) => {
  let category_load = new Promise((resolve, reject) => {
    categories
      .find({ $where: "this.is_parent == true" })
      .populate("children")
      .exec((err, parent_categories) => {
        if (err) reject(err);
        resolve(parent_categories);
      });
  });

  let post_load = new Promise((resolve, reject) => {
    if (req.query.id) {
      posts.findById(req.query.id, (err, post) => {
        if (err || post == null) {
          // no posts found with given id or error occured during process
          if (err) {
            reject(err);
          } else {
            res.status(404).render('404error');
          }
        } else {
          resolve(post);
        }
      });
    } else {
      throw err;
    }
  });

  Promise
    .all([category_load, post_load])
    .then((page_info) => {
      res.render("viewPost", {
        parent_categories: page_info[0],
        post: page_info[1],
        moment: moment,
        session: req.session.user
      });
    })
    .catch((err) => {
      res.status(500).render('500error');
      console.log(err);
    })
});

// write or edit posts
router.post("/", (req, res) => {
  let mode = req.query.mode;
  let category = req.body.post_category;
  let title = req.body.post_title;
  let contents = req.body.post_contents;
  let tagArr = req.body.tag;

  if (!Array.isArray(tagArr)) {
    if (tagArr == undefined) {
      tagArr = [];
    } else {
      tagArr = [tagArr];
    }
  }

  if (mode) {
    if (mode == "write") {
      let newPost = new posts();
      let img_regex = RegExp('<img [^<>]*>');
      let thumbnail = contents.match(img_regex);
      newPost.category = category;
      newPost.title = title;
      newPost.contents = contents;
      newPost.tags = tagArr;

      if (thumbnail) thumbnail = thumbnail[0];
      else thumbnail = '';

      newPost.thumbnail = thumbnail;

      let category_update = new Promise((resolve, reject) => {
        categories.findOneAndUpdate(
          { name: category },
          { $inc: { count: 1 } },
          (err, fCategory) => {

            // update posts number of parent category
            if (err) reject(err);
            categories.updateOne({
              children: fCategory._id
            },
              { $inc: { count: 1 } },
              (err) => {
                if (err) reject(err);
                resolve();
              });
          });
      });

      let post_save = new Promise((resolve, reject) => {
        newPost.save((err, createdPost) => {
          if (err) reject(err);
          resolve(createdPost);
        });
      });

      post_save
        .then((createdPost) => {
          Promise
            .all(tagArr.map((item) => {
              return new Promise((resolve, reject) => {
                tags.findOne({
                  name: item
                },
                  (err, fTag) => {
                    if (err) reject(err);
                    if (fTag == null) {

                      // codes below executed when input tag doesn't exist in the database
                      let newTag = new tags();
                      newTag.name = item;

                      newTag.save((err, createdTag) => {
                        if (err) reject(err);
                        let newMatch = new pt_matches();

                        newMatch.post_id = createdPost._id;
                        newMatch.tag_id = createdTag._id;

                        newMatch.save((err) => {
                          if (err) reject(err);
                          resolve();
                        });
                      });
                    } else {

                      //codes below executed when input tag exists in the database
                      let newMatch = new pt_matches();

                      newMatch.post_id = createdPost._id;
                      newMatch.tag_id = fTag._id;

                      newMatch.save((err) => {
                        if (err) throw err;
                        resolve();
                      });
                    }
                  })
              });
            }))
            .then((resolves) => {
              category_update
                .then((resolve) => {
                  res.redirect("/posts/view?id=" + createdPost._id);
                })
                .catch((err) => {
                  console.log(err);
                });
            });
        });
    } else if (mode == "edit") {
      let id = req.body.post_id;
      let category_before = req.body.post_category_before;
      let img_regex = RegExp('<img [^<>]*>');
      let thumbnail = contents.match(img_regex);

      if (thumbnail) thumbnail = thumbnail[0];
      else thumbnail = '';

      let updates = {
        category: category,
        title: title,
        contents: contents,
        tags: tagArr,
        thumbnail: thumbnail
      };

      let post_update = new Promise((resolve, reject) => {
        posts.findOneAndUpdate(
          { _id: id },
          updates,
          (err, updatedPost) => {
            if (err) reject(err);
            resolve(updatedPost);
          });
      });

      post_update
        .then((updatedPost) => {
          /*
           * for the ease of coding, all the match entries are deleted in the database
           * after that, both tag data and match entry are inserted in the database
           */
          pt_matches.deleteMany(
            { post_id: updatedPost._id },
            (err) => {
              if (err) throw err;

              tagArr.forEach((item) => {
                // check whether item tag is already in data base
                tags.findOne(
                  {
                    name: item
                  },
                  (err, fTag) => {
                    if (err) throw err;

                    if (fTag == null) {
                      // codes below executed when input tag doesn't exist in the database
                      let newTag = new tags();
                      newTag.name = item;

                      newTag.save((err, createdTag) => {
                        let newMatch = new pt_matches();

                        newMatch.post_id = updatedPost._id;
                        newMatch.tag_id = createdTag._id;

                        newMatch.save((err) => {
                          if (err) throw err;
                        });
                      });
                    } else {
                      //codes below executed when input tag exists in the database
                      let newMatch = new pt_matches();

                      newMatch.post_id = updatedPost._id;
                      newMatch.tag_id = fTag._id;

                      newMatch.save((err) => {
                        if (err) throw err;
                      });
                    } // end else of if(fTag == null)
                  }
                ); // end tags.findOne()
              }); // end tagArr.forEach()
            }
          ); // end pt_matches.deleteMany()
        });


      /*
       * category_before: category that the post was in
       * if category is diffrent with category_before, posts counts in both category are updated
       */
      if (category != category_before) {
        let category_before_update = new Promise((resolve, reject) => {
          categories.findOneAndUpdate(
            { name: category_before },
            { $inc: { count: -1 } },
            (err, uCategory) => {
              if (err) reject(err);

              // uCategory: updatedCategory
              categories.updateOne(
                { children: uCategory._id },
                { $inc: { count: -1 } },
                (err) => {
                  if (err) reject(err);
                  resolve();
                });
            });
        });

        let category_update = new Promise((resolve, reject) => {
          categories.findOneAndUpdate(
            { name: category },
            { $inc: { count: 1 } },
            (err, uCategory) => {
              if (err) reject(err);

              // uCategory: updatedCategory
              categories.updateOne(
                { children: uCategory._id },
                { $inc: { count: 1 } },
                (err) => {
                  if (err) reject(err);
                  resolve();
                });
            });
        });

        Promise
          .all([post_update, category_before_update, category_update])
          .then((page_info) => {
            res.redirect("/posts/view?id=" + page_info[0]._id);
          })
          .catch((err) => {
            console.log(err);
          })
      } else {
        post_update
          .then((updatedPost) => {
            res.redirect("/posts/view?id=" + updatedPost._id);
          })
          .catch((err) => {
            console.log(err);
          });
      }// end else of if(category != category_before)
    } else {

      // if invalid mode is given
      throw err;
    }
  } else {

    // if no mode specified
    throw err;
  }
});

// To delete a post
router.get("/delete", (req, res) => {
  if (req.session.user) {
    if (req.query.id) {
      posts.findOneAndDelete(
        {
          _id: req.query.id
        },
        (err, dPost) => {
          if (err) throw err;

          /*
           * dPost: deleted Post
           * posts number of category that the deleted post was in is decremented by 1
           * if there is parent category, update as well
           */

          categories.findOneAndUpdate(
            {
              name: dPost.category
            },
            { $inc: { count: -1 } },
            (err, uCategory) => {
              if (err) throw err;

              // uCategory: updated Category
              categories.updateOne(
                {
                  children: uCategory._id
                },
                { $inc: { count: -1 } },
                (err) => {
                  if (err) throw err;
                  pt_matches.deleteMany(
                    {
                      post_id: dPost._id
                    },
                    (err) => {
                      if (err) throw err;
                      // redirect to category the deleted post was in
                      res.redirect("/posts/" + uCategory.name);
                    });
                });
            });
        });
    } else {
      throw err;
    }
  } else {
    res.redirect('/login');
  }
});

// To edit a post
router.get("/edit", (req, res) => {
  if (req.session.user) {
    if (req.query.id) {
      let category_load = new Promise((resolve) => {
        categories
          .find({ $where: 'this.is_parent == true' })
          .populate('children')
          .exec((err, parent_categories) => {
            if (err) reject(err);
            resolve(parent_categories);
          });
      });
  
      let post_load = new Promise((resolve) => {
        posts.findOne(
          {
            _id: req.query.id
          },
          (err, post) => {
            if (err) reject(err);
            resolve(post);
          });
      });
  
      Promise
        .all([category_load, post_load])
        .then((page_info) => {
          res.render("edit", {
            parent_categories: page_info[0],
            post: page_info[1]
          });
        });
    } else {
      throw err;
    }
  } else {
    res.redirect('/login');
  }
});

// print the list of posts in certain category
router.get("/:category", (req, res) => {
  let pCategory = req.params.category;

  categories
    .find({ $where: "this.is_parent == true" })
    .populate("children")
    .exec((err, parent_categories) => {
      if (err) throw err;

      // search the parameter given as category in db
      categories
        .findOne({ name: pCategory })
        .populate("children")
        .exec((err, category) => {
          if (err || category == null) {

            // no category found or error occured in process
            res.status(404).render('404error');
          } else {
            if (category.is_end) {
              let page_num = req.query.page
                ? req.query.page
                : 1;
              let limitSize = 8;
              let skipSize = (page_num - 1) * limitSize;

              /*
               * if given category is leaf category
               * search posts in that category
               */
              let posts_load = new Promise((resolve, reject) => {
                posts
                  .find({ category: category.name })
                  .sort({ date: -1 })
                  .skip(skipSize)
                  .limit(limitSize)
                  .exec((err, posts) => {
                    if (err) reject(err);
                    resolve(posts);
                  });
              });

              let posts_count_load = new Promise((resolve, reject) => {
                posts
                  .countDocuments({ category: category.name }, (err, count) => {
                    if (err) reject(err);
                    resolve(count);
                  });
              });

              Promise
                .all([posts_load, posts_count_load])
                .then((page_info) => {

                  // convert html to plaintext
                  let parsed_posts = page_info[0].map((post) => {
                    return h2p(post.contents);
                  });

                  res.render("posts", {
                    path: "/posts/" + category.name,
                    parent_categories: parent_categories,
                    category: category.name,
                    posts: page_info[0],
                    parsed_posts: parsed_posts,
                    page_num: page_num,
                    total_num: page_info[1],
                    limitSize: limitSize,
                    moment: moment
                  });
                })
                .catch((err) => {
                  console.log(err);
                });
            } else {
              // if given category is parent category
              let category_list = new Array();
              let page_num = req.query.page
                ? req.query.page
                : 1;
              let limitSize = 8;
              let skipSize = (page_num - 1) * limitSize;

              for (let i = 0; i < category.children.length; i++) {
                category_list.push(category.children[i].name);
              }

              let posts_load = new Promise((resolve, reject) => {
                posts
                  .find({ category: category_list })
                  .sort({ date: -1 })
                  .skip(skipSize)
                  .limit(limitSize)
                  .exec((err, posts) => {
                    if (err) reject(err);
                    resolve(posts);
                  });
              });

              let posts_count_load = new Promise((resolve, reject) => {
                posts
                  .countDocuments({ category: category_list }, (err, count) => {
                    if (err) reject(err);
                    resolve(count);
                  });
              });

              Promise
                .all([posts_load, posts_count_load])
                .then((page_info) => {

                  // convert html to plaintext
                  let parsed_posts = page_info[0].map((post) => {
                    return h2p(post.contents);
                  });

                  res.render("posts", {
                    path: "/posts/" + category.name,
                    parent_categories: parent_categories,
                    category: category.name,
                    posts: page_info[0],
                    parsed_posts: parsed_posts,
                    page_num: page_num,
                    total_num: page_info[1],
                    limitSize: limitSize,
                    moment: moment
                  });
                })
                .catch((err) => {
                  console.log(err);
                });
            }
          }
        });
    });
});

module.exports = router;
