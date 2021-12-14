/**
 * Module dependencies.
 */

var express = require("express"),
  elasticsearch = require("elasticsearch"),
  url = require("url"),
  http = require("http"),
  app = express(),
  server = http.createServer(app),
  path = require("path"),
  logger = require("morgan"),
  methodOverride = require("method-override"),
  bodyParser = require("body-parser"),
  multer = require("multer"),
  errorHandler = require("errorhandler"),
  fs = require("fs");

//var connectionString = 'http://139.59.140.158:6700';
var connectionString =
  "http://w7ka132t3s:9g0sy72fso@kalorintest-6216991633.us-east-1.bonsaisearch.net";

console.info(connectionString);

let rawdata = fs.readFileSync("besin.json");
let besinler = JSON.parse(rawdata);

var client = new elasticsearch.Client({
  host: connectionString,
  log: "debug",
});

var _index = "egzersizler";
var _type = "egzersiz";

// configuration
app.set("port", process.env.PORT || 4000);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(logger("dev"));
app.use(methodOverride());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer());
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.get("/", function (req, res) {
  res.render("index", { result: "" });
});

function wait(ms) {
  var start = new Date().getTime();
  var end = start;
  while (end < start + ms) {
    end = new Date().getTime();
  }
}

app.get("/index", function (req, res) {
  client.indices.delete({ index: _index });

  client.indices.create(
    {
      index: _index,
      body: {
        settings: {
          analysis: {
            filter: {
              autocomplete_filter: {
                type: "edge_ngram",
                min_gram: 1,
                max_gram: 10,
              },
            },
            analyzer: {
              autocomplete: {
                type: "custom",
                tokenizer: "standard",
                filter: ["lowercase", "autocomplete_filter"],
              },
            },
          },
        },

        mappings: {
          properties: {
            id: {
              type: "text",
            },
            besin: {
              type: "text",
              analyzer: "autocomplete",
              search_analyzer: "standard",
            },
            marka: {
              type: "text",
              analyzer: "autocomplete",
              search_analyzer: "standard",
            },
          },
        },
      },
    },
    function (error, response) {
      if (error) throw error;

      console.log("CREATED INDEX");
    }
  );
});


app.get("/index_egzersiz", function (req, res) {
  client.indices.delete({ index: _index });

  client.indices.create(
    {
      index: _index,
      body: {
        settings: {
          analysis: {
            filter: {
              autocomplete_filter: {
                type: "edge_ngram",
                min_gram: 1,
                max_gram: 10,
              },
            },
            analyzer: {
              autocomplete: {
                type: "custom",
                tokenizer: "standard",
                filter: ["lowercase", "autocomplete_filter"],
              },
            },
          },
        },

        mappings: {
          properties: {
            id: {
              type: "text",
            },
            aktivite: {
              type: "text",
              analyzer: "autocomplete",
              search_analyzer: "standard",
            },
            kategori: {
              type: "text",
              analyzer: "autocomplete",
              search_analyzer: "standard",
            },
          },
        },
      },
    },
    function (error, response) {
      if (error) throw error;

      console.log("CREATED INDEX");
    }
  );
});

app.get("/insert", function (req, res) {
  let rawdata = fs.readFileSync("egzersizler.json");
  let besinler = JSON.parse(rawdata);

  var body = [];

  besinler.forEach(function (item) {
    body.push({ index: { _id: item.id } });
    body.push(item);
  });
  setTimeout(() => {
    client.bulk(
      {
        index: _index,
        body: body,
      },
      function (err, resp) {
        if (err) throw err;
        console.log("RES", resp);
        res.render("index", { result: "Indexing Completed!" });
      }
    );
  }, 5000);
});

app.get("/autocomplete", function (req, res) {
  client
    .search({
      index: _index,
      type: "_doc",
      body: {
        query: {
          multi_match: {
            type: "most_fields",
            query: req.query.q,
            fields: ["besin", "marka"],
          },
        },
        sort: [
          {
            _score: {
              order: "desc",
            },
          },
        ],
        from: "0",
        size: "10",
      },
    })
    .then(
      function (resp) {
        var results = resp.hits.hits.map(function (hit) {
          return hit._source.besin + " " + hit._source.marka;
        });

        res.send(results);
      },
      function (err) {
        console.trace(err.message);
        res.send({ response: err.message });
      }
    );
});

app.get("/search", function (req, res) {
  var body = {
    query: {
      bool: {
        must: {
          multi_match: {
            query: req.query.q,
            fields: [
              "first_name^100",
              "last_name^20",
              "country^5",
              "city^3",
              "language^10",
              "job_title^50",
            ],
            fuzziness: 1,
          },
        },
      },
    },
    aggs: {
      country: {
        terms: {
          field: "country.raw",
        },
      },
      city: {
        terms: {
          field: "city.raw",
        },
      },
      language: {
        terms: {
          field: "language.raw",
        },
      },
      job_title: {
        terms: {
          field: "job_title.raw",
        },
      },
      gender: {
        terms: {
          field: "gender",
        },
      },
    },
    suggest: {
      text: req.query.q,
      simple_phrase: {
        phrase: {
          field: "first_name",
          size: 1,
          real_word_error_likelihood: 0.95,
          max_errors: 0.5,
          gram_size: 2,
          direct_generator: [
            {
              field: "first_name",
              suggest_mode: "always",
              min_word_length: 1,
            },
          ],
          highlight: {
            pre_tag: "<b><em>",
            post_tag: "</em></b>",
          },
        },
      },
    },
  };

  var aggValue = req.query.agg_value;
  var aggField = req.query.agg_field;
  if (aggField) {
    var filter = {};
    filter[aggField] = aggValue;
    body["query"]["bool"]["filter"] = { term: filter };
  }

  client
    .search({
      index: _index,
      type: _type,
      body: body,
    })
    .then(
      function (resp) {
        res.render("search", { response: resp, query: req.query.q });
      },
      function (err) {
        console.trace(err.message);
        res.render("search", { response: err.message });
      }
    );
});

app.get("/about", function (req, res) {
  res.render("about");
});

// error handling middleware should be loaded after the loading the routes
if ("development" == app.get("env")) {
  app.use(errorHandler());
}

app.listen(app.get("port"), function () {
  console.log("Express server listening on port " + app.get("port"));
});
