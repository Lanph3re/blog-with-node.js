const express = require('express');
const posts = require('../models/post');
const categories = require('../models/category');
const tags = require('../models/tag');
const moment = require('moment');
const h2p = require('html2plaintext');
const Feed = require('feed');
const fs = require('fs');
const router = express.Router();

router.get('/', (req, res) => {
  let page_num = req.query.page
    ? req.query.page
    : 1;
  let limitSize = 8;
  let skipSize = (page_num - 1) * limitSize;

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

  let category_load = new Promise((resolve, reject) => {
    categories
      .find({ $where: "this.is_parent == true" })
      .populate("children")
      .exec((err, parent_categories) => {
        if (err) reject(err);
        resolve(parent_categories);
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

      res.render("index", {
        parent_categories: page_info[0],
        path: '/',
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

router.get('/about', (req, res) => {
  categories
    .find({ $where: 'this.is_parent == true' })
    .populate('children')
    .exec((err, parent_categories) => {
      if (err) throw err;
      res.render('about', { parent_categories: parent_categories });
    });
});

router.get('/guestbook', (req, res) => {
  categories
    .find({ $where: 'this.is_parent == true' })
    .populate('children')
    .exec((err, parent_categories) => {
      if (err) throw err;
      res.render('guestbook', { parent_categories: parent_categories });
    });
});

router.get('/login', (req, res) => {
  if (req.session.user) {
    res.redirect('/');
  } else {
    res.render('login');
  }
});

router.post('/login', (req, res) => {
  let id = req.body.id;
  let passwd = req.body.passwd;

  if (id == ADMIN_ID && passwd == ADMIN_PASSWD) {
    req.session.user = {
      'name': 'admin',
    }

    if (req.session.returnURL) {
      let returnURL = req.session.returnURL;
      delete req.session.returnURL;
      res.redirect(returnURL);
    } else {
      res.redirect('/');
    }
  } else {
    res.redirect('/login');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
      res.clearCookie('connect.sid');
      res.render('500error');
    } else {
      res.redirect('/');
    }
  });
})

router.get('/tags', (req, res) => {
  let category_load = new Promise((resolve) => {
    categories
      .find({ $where: 'this.is_parent == true' })
      .populate('children')
      .exec((err, parent_categories) => {
        if (err) reject(err);
        resolve(parent_categories);
      });
  });

  let tag_load = new Promise((resolve) => {
    tags
      .find({})
      .exec((err, tags) => {
        if (err) reject(err);
        resolve(tags);
      });
  });

  Promise
    .all([category_load, tag_load])
    .then((page_info) => {
      res.render('tags', { parent_categories: page_info[0], tags_info: page_info[1] });
    })
    .catch((err) => {
      console.log(err);
    });
});

router.get('/tags/:tagname', (req, res) => {
  let page_num = req.query.page
    ? req.query.page
    : 1;
  let limitSize = 8;
  let skipSize = (page_num - 1) * limitSize;

  let category_load = new Promise((resolve) => {
    categories
      .find({ $where: 'this.is_parent == true' })
      .populate('children')
      .exec((err, parent_categories) => {
        if (err) reject(err);
        resolve(parent_categories);
      });
  });

  let tagged_post_load = new Promise((resolve, reject) => {
    posts
      .find({ tags: req.params.tagname })
      .skip(skipSize)
      .limit(limitSize)
      .sort({ date: -1 })
      .exec((err, posts) => {
        if (err) reject(err);
        resolve(posts);
      });
  });

  let posts_count_load = new Promise((resolve, reject) => {
    posts
      .countDocuments({ tags: req.params.tagname }, (err, count) => {
        if (err) reject(err);
        resolve(count);
      });
  });

  Promise
    .all([category_load, tagged_post_load, posts_count_load])
    .then((page_info) => {

      // convert html to plaintext
      let parsed_posts = page_info[1].map((post) => {
        return h2p(post.contents);
      });

      res.render('posts', {
        path: '/tags/' + req.params.tagname,
        parent_categories: page_info[0],
        category: req.params.tagname,
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

router.get('/search', (req, res) => {
  categories
    .find({ $where: 'this.is_parent == true' })
    .populate('children')
    .exec((err, parent_categories) => {
      if (err) throw err;
      if (req.query.q) {

        // if search_word exists
        let search_word = req.query.q;
        let searchCondition = {
          $regex: search_word
        };
        let page_num = req.query.page
          ? req.query.page
          : 1;
        let limitSize = 8;
        let skipSize = (page_num - 1) * limitSize;

        let posts_load = new Promise((resolve, reject) => {
          posts
            .find({ $or: [{ title: searchCondition }, { contents: searchCondition }] })
            .sort({ date: -1 })
            .skip(skipSize)
            .limit(limitSize)
            .exec((err, searchPosts) => {
              if (err) reject(err);
              resolve(searchPosts);
            });
        });

        let posts_count_load = new Promise((resolve, reject) => {
          posts
            .countDocuments({ $or: [{ title: searchCondition }, { contents: searchCondition }] }, (err, count) => {
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

            res.render('search', {
              path: search_word,
              parent_categories: parent_categories,
              category: search_word,
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

        // if no keywords given
        res.render('search', { parent_categories: parent_categories });
      }
    });
});

router.get('/write', (req, res) => {
  if (req.session.user) {
    categories
      .find({ $where: 'this.is_parent == true' })
      .populate('children')
      .exec((err, parent_categories) => {
        if (err) throw err
        res.render('write', { parent_categories: parent_categories });
      });
  } else {
    req.session.returnURL = '/write';
    res.redirect('/login');
  }
});

router.get('/rss', (req, res) => {
  let feed = new Feed.Feed({
    title: 'Lanph3re\'s Blog',
    link: 'http://localhost:8080/',
    generator: 'feed for Node.js',
    copyright: 'All rights reserved 2019, Yeonghun Kim',
  });

  posts
    .find({})
    .limit(10)
    .sort({ date: -1 })
    .exec((err, posts) => {
      if (err) throw err;
      posts.forEach((post) => {
        feed.addItem({
          title: post.title,
          id: post._id,
          link: 'http://localhost:8080/posts/view?id=' + post._id,
          content: post.contents,
          description: post.category,
          date: post.date
        });
      });

      fs.writeFile(__dir + '/rss.xml', feed.rss2(), 'utf8', (err) => {
        if (err) throw err;
        res.sendFile(__dir + '/rss.xml');
      });
    });
});

module.exports = router;