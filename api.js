const express = require("express");

const api = express();

api.get("/login", (req, res) => {
  res.send("Hello world");
});

module.exports = api;
