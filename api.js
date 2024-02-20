const express = require("express");
const cors = require("cors");

const api = express();
api.use(express.static(__dirname + "/public"));
api.use(cors({}));

api.get("/login", (req, res) => {
  res.send("Hello world");
});

module.exports = api;
