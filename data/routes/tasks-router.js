const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const { UsersModel, TasksModel } = require("../models/Models.js");
const { validateTask } = require("../utils.js");

// ROUTES //

router.get("/", (req, res) => {
    res.status(404).render("not-found");
});

router.get("/:id/list", async (req, res) => {
    const user = await UsersModel.findById(req.params.id).lean();
    res.render("tasks/tasks-list", {
        user,
    });
});

// READ – SINGLE TASK
router.get("/:userid/:id/single", async (req, res) => {
    const user = await UsersModel.findById(req.params.userid).lean();
    const task = await TasksModel.findById(req.params.id).lean();
    const formDate = task.created.substring(0, 10);

    TasksModel.findOne(
        {
            _id: task,
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
                    res.render("tasks/tasks-single", {
                        publicTasks,
                        user,
                        tasks,
                        formDate,
                    });
                }
            ).lean();
        }
    ).lean();
});

// READ – UPDATE TASK
router.get("/:userid/:id/update", async (req, res) => {
    const user = await UsersModel.findById(req.params.userid).lean();
    const task = await TasksModel.findById(req.params.id).lean();

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
            res.render("tasks/tasks-update", {
                publicTasks,
                user,
                task,
            });
        }
    ).lean();
});

// POST - UPDATE TASK
router.post("/:userid/:id/update", async (req, res) => {
    const user = await UsersModel.findById(req.params.userid).lean();
    const task = await TasksModel.findById(req.params.id).lean();
    const date = new Date().toISOString();

    const updatedTask = {
        description: req.body.description,
        hours: req.body.hours,
        category: req.body.category,
        private: req.body.private === "on",
        created: date,
    };

    const validated = validateTask(updatedTask);

    if (validated) {
        await TasksModel.findByIdAndUpdate(
            {
                _id: req.params.id,
            },
            {
                description: req.body.description,
                category: req.body.category,
                hours: req.body.hours,
                created: date,
                private: req.body.private === "on",
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
                const errorMessage =
                    "Oops! Did you forget to fill something out?";
                res.render("tasks/tasks-update", {
                    errorMessage,
                    user,
                    publicTasks,
                    task,
                });
            }
        ).lean();
    }
});

// READ - DELETE TASK
router.get("/:userid/:id/delete", async (req, res) => {
    const user = await UsersModel.findById(req.params.userid).lean();
    const task = await TasksModel.findById(req.params.id).lean();

    TasksModel.findOne(
        {
            _id: task,
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
                    res.render("tasks/tasks-delete", {
                        publicTasks,
                        user,
                        tasks,
                    });
                }
            ).lean();
        }
    ).lean();

    // LÄGG TILL FUNKTIONALITET FÖR ATT TA BORT TASK
});

// POST – DELETE TASK
router.post("/:userid/:id/delete", async (req, res) => {
    const user = await UsersModel.findById(req.params.userid).lean();
    const task = await TasksModel.findByIdAndDelete(req.params.id).lean();
    res.redirect("/users/" + user._id + "/dashboard");
});

// READ – CREATE TASK
router.get("/:id/create", async (req, res) => {
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
            res.render("tasks/tasks-create", {
                publicTasks,
                user,
            });
        }
    ).lean();
});

// POST – CREATE TASK
router.post("/:id/create", async (req, res) => {
    const user = await UsersModel.findById(req.params.id).lean();
    const { category, description, hours, private } = req.body;
    const { token } = req.cookies;
    const date = new Date().toISOString();

    let task = {
        description: description,
        hours: hours,
        category: category,
    };

    if (validateTask(task)) {
        const newTask = new TasksModel({
            category: category,
            description: description,
            hours: hours,
            private: Boolean(private),
            created: date,
            user: {
                _id: user._id,
                username: user.username,
                profilePicture: user.profilePicture,
            },
        });
        await newTask.save();

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
                const errorMessage =
                    "Oops! Did you forget to fill something out?";
                res.render("tasks/tasks-create", {
                    errorMessage,
                    user,
                    publicTasks,
                });
            }
        ).lean();
    }
});

// READ – STUDY CATEGORY
router.get("/:id/category/study", async (req, res) => {
    const user = await UsersModel.findById(req.params.id).lean();

    TasksModel.find(
        {
            user: {
                _id: user._id,
                username: user.username,
                profilePicture: user.profilePicture,
            },
            category: "Study",
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
                    res.render("tasks/tasks-list", {
                        publicTasks,
                        user,
                        tasks,
                    });
                }
            ).lean();
        }
    ).lean();
});

// READ – WORK CATEOGORY
router.get("/:id/category/work", async (req, res) => {
    const user = await UsersModel.findById(req.params.id).lean();

    TasksModel.find(
        {
            user: {
                _id: user._id,
                username: user.username,
                profilePicture: user.profilePicture,
            },
            category: "Work",
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
                    res.render("tasks/tasks-list", {
                        publicTasks,
                        user,
                        tasks,
                    });
                }
            ).lean();
        }
    ).lean();
});

// READ – EXERCISE CATEOGORY
router.get("/:id/category/exercise", async (req, res) => {
    const user = await UsersModel.findById(req.params.id).lean();

    TasksModel.find(
        {
            user: {
                _id: user._id,
                username: user.username,
                profilePicture: user.profilePicture,
            },
            category: "Exercise",
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
                    res.render("tasks/tasks-list", {
                        publicTasks,
                        user,
                        tasks,
                    });
                }
            ).lean();
        }
    ).lean();
});

// READ – SOMETHING ELSE COOL CATEOGORY
router.get("/:id/category/other", async (req, res) => {
    const user = await UsersModel.findById(req.params.id).lean();

    TasksModel.find(
        {
            user: {
                _id: user._id,
                username: user.username,
                profilePicture: user.profilePicture,
            },
            category: "Something else cool",
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
                    res.render("tasks/tasks-list", {
                        publicTasks,
                        user,
                        tasks,
                    });
                }
            ).lean();
        }
    ).lean();
});

module.exports = router;