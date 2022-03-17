// REQUIRES //

require("dotenv").config();
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { UsersModel, TasksModel, ForumModel } = require("../models/Models.js");
const {
    hashPassword,
    comparePassword,
    getUniqueFilename,
    validateEmail,
    validateUsername,
} = require("../utils.js");
const path = require("path");

// ROUTES //

// 404 PAGE
router.get("/", (req, res) => {
    res.status(404).render("not-found");
});

// LOG IN PAGE

router.post("/", async (req, res) => {
    const { username, password } = req.body;

    UsersModel.findOne(
        {
            username,
        },
        (e, user) => {
            if (user && comparePassword(password, user.password)) {
                const userData = {
                    userId: user._id.toString(),
                    username,
                    profilePicture: user.profilePicture,
                };
                const accessToken = jwt.sign(userData, process.env.JWTSECRET);
                res.cookie("token", accessToken);

                res.redirect("/users/" + user._id + "/dashboard");
            } else {
                const errorUser = "Sorry! Username and password don't match.";
                res.render("home", {
                    errorUser,
                });
            }
        }
    );
});

// READ - SIGN UP PAGE
router.get("/signup", (req, res) => {
    res.render("users/users-create");
});

// POST – SIGN UP PAGE
router.post("/signup", async (req, res) => {
    const { username, password, email, confirmPassword } = req.body;

    const usernameTaken =
        "That username is already taken! Please pick another one.";

    UsersModel.findOne(
        {
            username,
        },
        async (error, user) => {
            if (user) {
                res.render("users/users-create", {
                    usernameTaken,
                });
            } else {
                if (req.files != null) {
                    // Profile picture (image upload)
                    const image = req.files.profilePic;
                    const filename = getUniqueFilename(image.name);
                    const uploadPath = path.join(
                        __dirname,
                        "../../public/uploads",
                        filename
                    );

                    let errorMessage = {};
                    if (
                        validateUsername(username) === false ||
                        username.length < 4 ||
                        username.length > 16
                    ) {
                        errorMessage.error = "Username incorrect";
                    }
                    if (validateEmail(email) === false) {
                        errorMessage.error2 = "Email incorrect";
                    }
                    if (password !== confirmPassword || password == "") {
                        errorMessage.error3 = "Password incorrect";
                    }

                    if (
                        Object.keys(errorMessage).length === 0 &&
                        errorMessage.constructor === Object
                    ) {
                        await image.mv(uploadPath);
                        const newUser = new UsersModel({
                            username: username,
                            password: hashPassword(password),
                            email: email,
                            profilePicture: "/uploads/" + filename,
                        });
                        await newUser.save();
                        res.redirect("/");
                    } else {
                        res.render("users/users-create", {
                            errorMessage,
                            username,
                            email,
                        });
                    }
                } else {
                    let errorMessage = {};
                    if (
                        validateUsername(username) === false ||
                        username.length < 4 ||
                        username.length > 16
                    ) {
                        errorMessage.error = "Username incorrect";
                    }
                    if (validateEmail(email) === false) {
                        errorMessage.error2 = "Email incorrect";
                    }
                    if (password !== confirmPassword || password == "") {
                        errorMessage.error3 = "Password incorrect";
                    }

                    if (
                        Object.keys(errorMessage).length === 0 &&
                        errorMessage.constructor === Object
                    ) {
                        const newUser = new UsersModel({
                            username: username,
                            password: hashPassword(password),
                            email: email,
                            profilePicture: "/assets/profile.jpg",
                        });
                        await newUser.save();
                        res.redirect("/");
                    } else {
                        res.render("users/users-create", {
                            errorMessage,
                            username,
                            email,
                        });
                    }
                }
            }
        }
    );
});

// READ - DASHBOARD

router.get("/dashboard", (req, res) => {
    res.status(404).render("not-found");
});

router.get("/:id/dashboard", async (req, res) => {
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
            TasksModel.find(
                {
                    private: false,
                },
                (err, publicTask) => {
                    const publicTasks = publicTask.sort(function (a, b) {
                        let dateA = new Date(a.created),
                            dateB = new Date(b.created);
                        return dateB - dateA;
                    });
                    
                    res.render("users/users-dashboard", {
                        publicTasks,
                        user,
                        tasks,
                    });
                }
            ).lean();
        }
    ).lean();
});

// READ – SIGN OUT
router.get("/signout", async (req, res) => {
    res.cookie("token", "", {
        maxAge: 0,
    });
    res.redirect("/");
});

// READ – UPDATE USER
router.get("/:id/update", async (req, res) => {
    const user = await UsersModel.findById(req.params.id).lean();

    TasksModel.find(
        {
            private: false,
        },
        (err, publicTask) => {
            const publicTasks = publicTask.sort(function (a, b) {
                let dateA = new Date(a.created),
                    dateB = new Date(b.created);
                return dateB - dateA;
            });
            res.render("users/users-update", { publicTasks, user });
        }
    ).lean();
});

// POST – UPDATE USER
router.post("/:id/update", async (req, res) => {
    const { token } = req.cookies;
    const user = await UsersModel.findById(req.params.id).lean();
    const { username, email, password } = req.body;

    if (req.files != null) {
        // Profile picture (image upload)
        const image = req.files.profilePic;
        const filename = getUniqueFilename(image.name);
        const uploadPath = path.join(
            __dirname,
            "../../public/uploads",
            filename
        );

        let errorMessage = {};
        if (
            validateUsername(username) === false ||
            username.length < 4 ||
            username.length > 16
        ) {
            errorMessage.error = "Username incorrect";
        }
        if (validateEmail(email) === false) {
            errorMessage.error2 = "Email incorrect";
        }
        if (password == "") {
            errorMessage.error3 = "Password required";
        }

        if (
            Object.keys(errorMessage).length === 0 &&
            errorMessage.constructor === Object
        ) {
            await image.mv(uploadPath);
            if (typeof user.google == "undefined") {
                await UsersModel.findOneAndUpdate(
                    {
                        _id: req.params.id,
                    },
                    {
                        username: username,
                        password: hashPassword(password),
                        email: email,
                        profilePicture: "/uploads/" + filename,
                    }
                );
            } else {
                await UsersModel.findOneAndUpdate(
                    {
                        _id: req.params.id,
                    },
                    {
                        username: username,
                        email: email,
                        profilePicture: "/uploads/" + filename,
                    }
                );
            }

            await TasksModel.updateMany(
                {
                    "user.profilePicture": user.profilePicture,
                    "user.username": user.username,
                },
                {
                    $set: {
                        "user.profilePicture": "/uploads/" + filename,
                        "user.username": req.body.username,
                    },
                }
            );
            await ForumModel.updateMany(
                {
                    "user.profilePicture": user.profilePicture,
                    "user.username": user.username,
                },
                {
                    $set: {
                        "user.profilePicture": "/uploads/" + filename,
                        "user.username": req.body.username,
                    },
                }
            );
            res.redirect("/users/" + user._id + "/dashboard");
        } else {
            TasksModel.find(
                {
                    private: false,
                },
                (err, publicTask) => {
                    const publicTasks = publicTask.sort(function (a, b) {
                        let dateA = new Date(a.created),
                            dateB = new Date(b.created);
                        return dateB - dateA;
                    });
                    res.render("users/users-update", {
                        publicTasks,
                        user,
                        errorMessage,
                        username,
                        email,
                    });
                }
            ).lean();
        }
    } else {
        let errorMessage = {};
        if (
            validateUsername(username) === false ||
            username.length < 4 ||
            username.length > 16
        ) {
            errorMessage.error = "Username incorrect";
        }
        if (validateEmail(email) === false) {
            errorMessage.error2 = "Email incorrect";
        }
        if (password == "") {
            errorMessage.error3 = "Password required";
        }

        if (
            Object.keys(errorMessage).length === 0 &&
            errorMessage.constructor === Object
        ) {
            if (typeof user.google == "undefined") {
                await UsersModel.findOneAndUpdate(
                    {
                        _id: req.params.id,
                    },
                    {
                        username: req.body.username,
                        password: hashPassword(req.body.password),
                        email: req.body.email,
                        profilePicture: user.profilePicture,
                    }
                );
            } else {
                await UsersModel.findOneAndUpdate(
                    {
                        _id: req.params.id,
                    },
                    {
                        username: req.body.username,
                        email: req.body.email,
                        profilePicture: user.profilePicture,
                    }
                );
            }
            await TasksModel.updateMany(
                { "user.username": user.username },
                { $set: { "user.username": req.body.username } }
            );
            await ForumModel.updateMany(
                { "user.username": user.username },
                { $set: { "user.username": req.body.username } }
            );

            res.redirect("/users/" + user._id + "/dashboard");
        } else {
            TasksModel.find(
                {
                    private: false,
                },
                (err, publicTask) => {
                    const publicTasks = publicTask.sort(function (a, b) {
                        let dateA = new Date(a.created),
                            dateB = new Date(b.created);
                        return dateB - dateA;
                    });
                    res.render("users/users-update", {
                        publicTasks,
                        user,
                        errorMessage,
                        username,
                        email,
                    });
                }
            ).lean();
        }
    }
});

// READ – DELETE USER ACCOUNT
router.get("/:id/delete", async (req, res) => {
    const user = await UsersModel.findById(req.params.id).lean();
    res.render("users/users-delete", {
        user,
    });
});

// POST – DELETE USER ACCOUNT
router.post("/:id/delete", async (req, res) => {
    await UsersModel.findByIdAndDelete(req.params.id);
    res.clearCookie("token");
    res.redirect("/");
});

module.exports = router;