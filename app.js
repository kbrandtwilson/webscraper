//https://kb.objectrocket.com/mongo-db/how-to-create-a-web-scraper-with-mongoose-nodejs-axios-and-cheerio-part-3-222
var express = require("express");
var mongoose = require("mongoose"); // Require Mongoose to store idioms in database
var axios = require("axios");
var cheerio = require("cheerio");
var Idiom = require("./models/idioms.js");

var PORT = process.env.PORT || 3000;

//db
var MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://admin:AdminPassword@cluster0-vgvu0.mongodb.net/idioms_db?retryWrites=true&w=majority";
mongoose.connect(MONGODB_URI);

// Initialize Express
var app = express();

// Configure middleware
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Make public a static folder
app.use(express.static("public"));

// Simple index route
app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname + "./public/index.html"));
});

var scrape = function (searchTerm) {
  var idioms = [];
  return axios
    .get("https://idioms.thefreedictionary.com/" + searchTerm)
    .then(function (response) {
      var $ = cheerio.load(response.data);

      var listItems = $("ul.idiKw li a").each(function (i, elem) {
        let obj = {
          idiom: $(elem).text(),
          link: "https://thefreedictionary.com/" + $(elem).attr("href"),
        };
        idioms.push(obj);
      });

      return idioms;
    });
  console.log(idioms);
};

app.post("/idioms/scrape/:searchTerm", function (req, res) {
  scrape(req.params.searchTerm)
    .then(function (foundIdioms) {
      console.log("scraped:");
      console.log(foundIdioms);
      // Save scraped Idioms
      foundIdioms.forEach(function (eachIdiom) {
        Idiom.create(eachIdiom)
          .then(function (savedIdiom) {
            // If saved successfully, print the new Idiom document to the console
            console.log(savedIdiom);
          })
          .catch(function (err) {
            // If an error occurs, log the error message
            console.log(err.message);
          });
      });

      res.json(foundIdioms);
    })
    .catch(function (err) {
      res.json(err);
    });
});

// Route for retrieving all idioms
app.get("/idioms", function (req, res) {
  // Find all Idioms
  Idiom.find({})
    .then(function (savedIdioms) {
      // If all Idioms are successfully found, send them back to the client
      res.json(savedIdioms);
    })
    .catch(function (err) {
      // If an error occurs, send the error back to the client
      res.json(err);
    });
});

// Route for retrieving idioms that have an entered string
app.get("/idioms/search/:searchTerm", function (req, res) {
  Idiom.find({ idiom: { $regex: req.params.searchTerm, $options: "i" } })
    .then(function (foundIdioms) {
      res.json(foundIdioms);
    })
    .catch(function (err) {
      res.json(err);
    });
});

// Route to drop all the idioms in the database
app.get("/idioms/drop", function (req, res) {
  Idiom.deleteMany({})
    .then(function (res) {
      res.json(res);
    })
    .catch(function (err) {
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function () {
  console.log("App listening on port " + PORT);
});
