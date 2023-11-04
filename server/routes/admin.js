const express = require('express');
const { User, Course, Admin,Tags} = require("../db");
const jwt = require('jsonwebtoken');
const { SECRET } = require("../middleware/auth")
const { authenticateJwt } = require("../middleware/auth");

const router = express.Router();

router.get("/me", authenticateJwt, async (req, res) => {
    const admin = await Admin.findOne({ username: req.user.username });
    if (!admin) {
      res.status(403).json({msg: "Admin doesnt exist"})
      return
    }
    res.json({
        userhandle: admin.userhandle
    })
});

router.post('/signup', (req, res) => {
    const { userhandle,username, password } = req.body;
    function callback(admin) {
      if (admin) {
        res.status(403).json({ message: 'Admin already exists' });
      } else {
        const obj = { userhandle:userhandle,username: username, password: password };
        const newAdmin = new Admin(obj);
        newAdmin.save();

        const token = jwt.sign({ username, role: 'admin' }, SECRET, { expiresIn: '1h' });
        res.json({ message: 'Admin created successfully', token });
        console.log(token);
      }
  
    }
    Admin.findOne({ username }).then(callback);
  });
  
  router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username, password });
    if (admin) {
      const token = jwt.sign({ username, role: 'admin' }, SECRET, { expiresIn: '1h' });
      res.json({ message: 'Logged in successfully', token });
    } else {
      res.status(403).json({ message: 'Invalid username or password' });
    }
  });
  
  router.post('/courses', authenticateJwt, async (req, res) => {
   let course = new Course({
    title: req.body.title,
    description: req.body.description,  
    imageLink: req.body.imageLink,
    price: req.body.price,
    published: req.body.published,
    tags: req.body.tags,
    author: req.user.username
  });
    await course.save();

for(let i=0; i<req.body.tags.length; i++){
  let existingTag = await Tags.findOne({ tags: req.body.tags[i] });

  if (existingTag) {
    // If the tag already exists, update it with the new course ID
    await Tags.findOneAndUpdate(
      { tags: req.body.tags[i] },
      { $push: { courses_with_tag_id: course._id } }
    );
  } else {
    // If the tag doesn't exist, create a new one
    let tag = new Tags({
      tags: req.body.tags[i],
      courses_with_tag_id: [course._id]
    });

    await tag.save();
  }
}

res.json({ message: 'Course created successfully', courseId: course._id });
  });
  
  router.get('/courses', authenticateJwt, async (req, res) => {
    const courses = await Course.find({});
    res.json({ courses });
  });
  
  router.get('/course/:courseid', authenticateJwt, async (req, res) => {
    const courseid = req.params.courseid;
    const course = await Course.findById(courseid);
    res.json({ course });
  });

  module.exports = router