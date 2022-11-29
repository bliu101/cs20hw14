var http = require("http");
var url = require("url");
var path = require("path");
var fs = require("fs");
var qs = require("querystring");
const MongoClient = require("mongodb").MongoClient;

// connection string
const mongoUrl = "mongodb+srv://bridgette-liu:KbwY0KGeNLy67Lab@cluster0.ksk0v6y.mongodb.net/?retryWrites=true&w=majority";

const server = http.createServer((req, res) => {
  // create filepath for any page
  var filePath = path.join(__dirname,
    req.url === "/" ? "index.html" : req.url
  );

  console.log(filePath);

  // Ensure correct content type is picked
  var contentType = getContType(filePath);

  if (req.url == "/result") {
    res.writeHead(200, { "Content-Type": "text/html" });
    pdata = "";
    req
      .on("data", (data) => {
        pdata += data.toString();
      })
      .on("end", () => {
        pdata = qs.parse(pdata);

        var type = pdata["input_type"];
        var target = pdata["user_input"];
        console.log(`User put in ${target} for ${type}.`);

        connectAndDisplay(target, type, res);
      });
  } else {
    fs.readFile(filePath, function (err, content) {
      if (err) {
        // alert('error page');
        display404Page(err, res);
      } else {
        //   alert('content page');
        displayCurrentContent(content, contentType, res);
      }
    });
  }
});

// the port in a variable using environment variable;
const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Server running on port ${port}`));

// Returns the string for Content-Type given a files path.
function getContType(filePath) {
  var ext = path.extname(filePath);
  switch (ext) {
    case ".html":
      return "text/html";
    case ".js":
      return "text/javascript";
    case ".css":
      return "text/css";
    default:
      return "text/html";
  }
}

// displays error page when user attempts to view non page on server
function display404Page(err, res) {
  if (err.code == "ENOENT") {
    // Display 404 page
    fs.readFile(path.join(__dirname, "public", "404.html"), (err, content) => {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(content, "utf8");
    });
  }
}

// Takes the response from server and displays content.
function displayCurrentContent(content, contentType, res) {
  res.writeHead(200, { "Content-Type": contentType });
  res.end(content, "utf8");
}

// Query the database and display information requested
async function connectAndDisplay(target, type, res) {
  var t = "";

  MongoClient.connect(
    mongoUrl,
    { useUnifiedTopology: true },
    async (err, database) => {
      if (err) {
        console.log("Connection to Mongo err: " + err);
        return;
      }

      // get database and collection object
      var dbo = database.db("stock_ticker");
      var collection = dbo.collection("equities");

      try {
        theQuery = "";
        queryOptions = "";
        if (type == "company") {
          theQuery = { name: target };
          queryOptions = {
            sort: { name: 1 },
            projection: { _id: 0, name: 1, ticker: 1 },
          };
          t += `<h2>Company: ${target} has ticker: </h2><br>`;
        } else if (type == "ticker") {
          theQuery = { ticker: target };
          queryOptions = {
            sort: { name: 1 },
            projection: { _id: 0, name: 1, ticker: 1 },
          };
          t += `<h2>Companies with ticker code ${target} are: </h2><br>`;
        }

        var result = await collection.find(theQuery, queryOptions).toArray();

        if (result.length === 0) {
          console.log(`No results found`);
          t += `No results found.`;
        } else {
          result.forEach(function (curr) {
            console.log(`${curr.name} has ticker ${curr.ticker}`);
            t += `${curr.name} (${curr.ticker})<br>`;
          });
        }
      } finally {
        res.end(t);
        database.close();
      }
    }
  );
}