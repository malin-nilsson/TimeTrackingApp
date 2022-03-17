// REQUIRES //

require("dotenv").config();
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { UsersModel, TasksModel, ForumModel } = require("../models/Models.js");
const {
  hashPassword,
  comparePassword,
  getUniqueFilename,
} = require("../utils.js");
const bcrypt = require("bcrypt");
const path = require("path");
const { default: mongoose } = require("mongoose");

// ROUTES //

// READ – FORUM
router.get("/:id", async (req, res) => {
  const user = await UsersModel.findById(req.params.id).lean();
  const forumPosts = await ForumModel.find().lean();

  TasksModel.find(
    {
      user: {
        _id: user._id,
        username: user.username,
        profilePicture: user.profilePicture,
      },
    },
    function (err, tasks) {
      const forumPost = forumPosts.sort(function (a, b) {
        let dateA = new Date(a.created),
          dateB = new Date(b.created);
        return dateB - dateA;
      });
      res.render("forum/forum-dashboard", {
        user,
        tasks,
        forumPosts,
      });
    }
  ).lean();
});

// POST – CREATE FORUM POST
router.post("/:id", async (req, res) => {
  const user = await UsersModel.findById(req.params.id).lean();

  const { title, post } = req.body;
  const date = new Date().toISOString();

  if (post == "") {
    TasksModel.find(
      {
        user: {
          _id: user._id,
          username: user.username,
          profilePicture: user.profilePicture,
        },
      },
      function (err, tasks) {
        ForumModel.find(
          {
            user: {
              _id: user._id,
              username: user.username,
              profilePicture: user.profilePicture,
            },
          },
          (err, myPosts) => {
            const errorMessage = "Oops! Did you forget to fill something out?";
            res.render("forum/forum-list", {
              errorMessage,
              user,
              tasks,
              myPosts,
            });
          }
        ).lean();
      }
    ).lean();
  } else {
    const newPost = new ForumModel({
      title: title,
      post: post,
      created: date,
      user: {
        _id: user._id,
        username: user.username,
        profilePicture: user.profilePicture,
      },
    });
    await newPost.save();
    res.redirect("/forum/" + user._id);
  }
});

// READ – FORUM LIST
router.get("/:id/list", async (req, res) => {
  const user = await UsersModel.findById(req.params.id).lean();

  TasksModel.find(
    {
      user: {
        _id: user._id,
        username: user.username,
        profilePicture: user.profilePicture,
      },
    },
    function (err, tasks) {
      ForumModel.find(
        {
          user: {
            _id: user._id,
            username: user.username,
            profilePicture: user.profilePicture,
          },
        },
        (err, myPosts) => {
          res.render("forum/forum-list", {
            user,
            tasks,
            myPosts,
          });
        }
      ).lean();
    }
  ).lean();
});

// READ – UPDATE FORUM POST
router.get("/:userid/:id/update", async (req, res) => {
  const user = await UsersModel.findById(req.params.userid).lean();
  const forumPost = await ForumModel.findById(req.params.id).lean();

  TasksModel.find(
    {
      user: {
        _id: user._id,
        username: user.username,
        profilePicture: user.profilePicture,
      },
    },
    function (err, tasks) {
      res.render("forum/forum-update", {
        user,
        tasks,
        forumPost,
      });
    }
  ).lean();
});

// POST – UPDATE FORUM POST
router.post("/:userid/:id/update", async (req, res) => {
  const user = await UsersModel.findById(req.params.userid).lean();
  const forumPost = await ForumModel.findById(req.params.id).lean();
  const { title, post } = req.body;
  if (post == "" || title == "") {
    TasksModel.find(
      {
        user: {
          _id: user._id,
          username: user.username,
          profilePicture: user.profilePicture,
        },
      },
      function (err, tasks) {
        const errorMessage = "Oops! Did you forget to fill something out?";
        res.render("forum/forum-update", {
          user,
          tasks,
          errorMessage,
          forumPost,
        });
      }
    ).lean();
  } else {
    TasksModel.find(
      {
        user: {
          _id: user._id,
          username: user.username,
          profilePicture: user.profilePicture,
        },
      },
      async function (err, tasks) {
        await ForumModel.findByIdAndUpdate(
          {
            _id: req.params.id,
          },
          {
            title: req.body.title,
            post: req.body.post,
          }
        );
        res.redirect("/forum/" + user._id);
      }
    ).lean();
  }
});

// POST - DELETE FORUM POST

router.get("/:userid/:id/delete", async (req, res) => {
  const user = await UsersModel.findById(req.params.userid).lean();
  const post = await ForumModel.findByIdAndDelete(req.params.id).lean();
  res.redirect("/forum/" + user._id);
});

router.post("/:userid/:id/delete", async (req, res) => {
  const user = await UsersModel.findById(req.params.userid).lean();
  const post = await ForumModel.findByIdAndDelete(req.params.id).lean();
  res.redirect("/forum/" + user._id);
});
module.exports = router;