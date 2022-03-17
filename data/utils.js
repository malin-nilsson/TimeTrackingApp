const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const hashPassword = (password) => {
  const hashValue = bcrypt.hashSync(password, 8);
  return hashValue;
};

const comparePassword = (password, hash) => {
  const correct = bcrypt.compareSync(password, hash);
  return correct;
};

const forceAuthorize = (req, res, next) => {
  const { token } = req.cookies;

  if (token && jwt.verify(token, process.env.JWTSECRET)) {
    const tokenData = jwt.decode(token, process.env.JWTSECRET);
    next();
  } else {
    res.sendStatus(401);
  }
};

const getUniqueFilename = (filename) => {
  const timestamp = Date.now();

  const extension = filename.split(".").pop();

  return `${timestamp}.${extension}`;
};

const validateTask = (task) => {
  let valid = true;
  valid = valid && task.category;
  valid = valid && task.description;
  valid = valid && task.hours;
  valid = valid && task.description.length > 0;
  return valid;
};

const validateUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_\.]+$/;
  return usernameRegex.test(username);
};

const validateEmail = (email) => {
  const validRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  return validRegex.test(email);
};

module.exports = {
    hashPassword,
    comparePassword,
    getUniqueFilename,
    validateTask,
    validateUsername,
    validateEmail,
    forceAuthorize,
};