// var fs = require('fs');
// const fastcsv = require("fast-csv");
// const MongoClient = require('mongodb').MongoClient;
// const url = "mongodb+srv://bridgette-liu:8ormoreyouWhore!@cluster0.sgmfn.mongodb.net/?retryWrites=true&w=majority";

// function main() 
// {
//     let stream = fs.createReadStream("companies.csv");
//     let csvData = [];
//     let csvStream = fastcsv
//     .parse()
//     .on("data", function(data) {
//         csvData.push({
//         company: data[0],
//         ticker: data[1]
//         });
//     })
//     .on("end", function() {
//         // remove the first line: header
//         csvData.shift();
//         console.log('help');
//         console.log(csvData);
//         console.log('me');
//         MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true, native_parser:true}, function(err, db) {
//             if (db) {
//                 if(err) { return console.log(err); }
            
//                 var dbo = db.db("stock_ticker");
//                 var collection = dbo.collection('equities');
                
//                 console.log("here");
//                 collection.insertMany(csvData, (err, res) => {
//                     if (err) throw err;
//                     console.log(`Inserted: ${res.insertedCount} rows`);
//                     db.close();
//                 });
//             }
//             else {
//                 console.log("oops");
//             }
//             console.log("Success!");
//         });
//     });
//     stream.pipe(csvStream);
// }

// main();

const MongoClient = require("mongodb").MongoClient;
const csvParser = require("csv-parser");
const readline = require("readline");
const fs = require("fs");
const path = require("path");

// connection string
const url =
  "mongodb+srv://bridgette-liu:KbwY0KGeNLy67Lab@cluster0.ksk0v6y.mongodb.net/?retryWrites=true&w=majority";

// File with data to fill database with
const dataFile = "companies.csv";

// main driver functions to open connection to mongo db to start filling db.
function main() {
  MongoClient.connect(url, { useUnifiedTopology: true }, (err, database) => {
    if (err) {
      console.log("Connection to Mongo err: " + err);
      return;
    }

    // get database and collection object
    var dbo = database.db("stock_ticker");
    var collection = dbo.collection("equities");

    console.log("Success connecting to DB!! :)");

    parseWithCSVParser(collection, database);
  });
}

// read from companies.csv file and insert to database
function parseWithCSVParser(coll, db) {
  var dataArr = [];
  fs.createReadStream(path.join(__dirname, "", dataFile))
    .on("error", function () {
      console.log(`An error ocurred while reading file :(`);
    })
    .pipe(csvParser())
    .on("data", function (row) {
      var newData = objectWithCustomKeys(row);
      dataArr.push(newData);
    })
    .on("end", function () {
      coll.insertMany(dataArr, (err, res) => {
        if (err) throw err;
        console.log(`Inserted ${res.insertedCount} documents`);
        db.close();
      });
    });
}

// Returns an object to be inserted to database with custom key fields.
function objectWithCustomKeys(rowObj) {
  return { name: rowObj.Company, ticker: rowObj.Ticker };
}

main();