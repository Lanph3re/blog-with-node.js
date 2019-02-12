# Blog-with-node.js
> Self-made blog with node.js and mongoDB  
> It's my first time developing a website from front-end to back-end.  
> I wanted to have my own blog that has no platform for tech posts, making it by myself.

This blog supports
 - Basic post write, edit, delete, search
 - Simple parent-children hierarchical category structure
 - Tagging
 - Responsive layout

Willingly appreciate feedbacks about codes and everything about project.

I am a newbie developer and ignorant of copyright issues.

If my project violates somewhat copyright, please write issue.

# package.json
```
{
  "name": "blog",
  "version": "1.0.0",
  "description": "",
  "main": "app.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "",
  "license": "ISC",
  "dependencies": {
    "body-parser": "^1.18.3",
    "cheerio": "^1.0.0-rc.2",
    "express": "^4.16.4",
    "feed": "^2.0.2",
    "html2plaintext": "^2.1.2",
    "moment": "^2.24.0",
    "mongoose": "^5.4.10",
    "pug": "^2.0.3"
  }
}
```

# Description
All npm modules are install by **npm install --save modulename**

Server made by Node.js express, basic settings are in **app.js**

Database uses **MongoDB**, and npm **Mongoose**.

Template engine uses npm **Pug**.

### Subfolders
- models: mongoose schema templates
- public: static files(imgs, css, js..)
- routes: express router modules
- view: webpage templates written in Pug

# Installation(Develop)
It just needs Node.js and MongoDB.

No admin page yet, so to make a new category, you should mannually execute MongoDB queries in terminal.

When making new categories, please refer to category.js in models folder.

There are three types of categories possible.
 - Independant category: no children, able to write posts in. give is_parent: true, and is_end: true
 - Parent category: multiple children, not able to write in. give is_parent: true, and is_end: false
 - Child category: child of parent category, able to write in. give is_parent: false, and is_end: true

 # Updates
 ### 19.02.10
 - Basic posts CRUD
 - Parent-Children Hierarchical category
 - Tagging
 - Responsive layout
 ### 19.02.12
 - Login page added (not working)
 ### 19.02.13
 - Login feature updated
 - Login page design updated
 - Only admin can write, edit, and delete posts
 - Subtle design adjustments
