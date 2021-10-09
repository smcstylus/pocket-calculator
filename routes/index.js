var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", {
    title: "Pocket Calculator",
    message: "Pocket Calculator",
    description:
      "A simple pocket calculator powered by CSS, HTML and JavaScript",
    useStaticVendors: req.app.get("env") === "development" || false,
  });
});

module.exports = router;
