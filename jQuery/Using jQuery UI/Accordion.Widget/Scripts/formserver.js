﻿var http = require("http");
var querystring = require("querystring");
var url = require("url");
var port = 8084;

var flowerData = {
   aster: { price: 2.99, stock: 10, plural: "Asters" },
   daffodil: { price: 1.99, stock: 10, plural: "Daffodils" },
   rose: { price: 4.99, stock: 2, plural: "Roses" },
   peony: { price: 1.50, stock: 3, plural: "Peonies" },
   primula: { price: 3.12, stock: 20, plural: "Primulas" },
   snowdrop: { price: 0.99, stock: 5, plural: "Snowdrops" },
   carnation: { price: 0.50, stock: 1, plural: "Carnations" },
   lily: { price: 1.20, stock: 2, plural: "Lillies" },
   orchid: { price: 10.99, stock: 5, plural: "Orchids" }
};

http.createServer(function (req, res) {
   console.log("[200 OK] " + req.method + " to " + req.url);

   function writeResponse(request, response, responseData, jsonp) {
      var jsonData = null;
      if (request.url === "/stockcheck") {
         for (var flower in responseData) {
            if (responseData.hasOwnProperty(flower)) {
               if (flowerData[flower].stock >= responseData[flower]) {
                  jsonData = true;
               } else {
                  jsonData = "We only have " + flowerData[flower].stock + " "
                     + flowerData[flower].plural + " in stock";
               }
               break;
            }
         }
         jsonData = JSON.stringify(jsonData);
      } else {
         var totalCount = 0;
         var totalPrice = 0;
         for (var item in responseData) {
            if (responseData.hasOwnProperty(item)) {
               if (item !== "_" && responseData[item] > 0) {
                  var itemNum = Number(responseData[item]);
                  totalCount += itemNum;
                  totalPrice += (itemNum * flowerData[item].price);
               } else {
                  delete responseData[item];
               }
            }
         }
         responseData.totalItems = totalCount;
         responseData.totalPrice = totalPrice.toFixed(2);

         jsonData = JSON.stringify(responseData);
         if (jsonp) {
            jsonData = jsonp + "(" + jsonData + ")";
         }
      }
      response.writeHead(200, "OK", {
         "Content-Type": jsonp ? "text/javascript" : "application/json",
         "Access-Control-Allow-Origin": "*"
      });
      response.write(jsonData);
      response.end();
   }

   if (req.method === "OPTIONS") {
      res.writeHead(200, "OK", {
         "Access-Control-Allow-Headers": "Content-Type",
         "Access-Control-Allow-Methods": "*",
         "Access-Control-Allow-Origin": "http://localhost:" + port
      });
      res.end();

   } else if (req.method === "POST") {
      var dataObj = new Object();
      var contentType = req.headers["content-type"];
      var fullBody = "";

      if (contentType) {
         if (contentType.indexOf("application/x-www-form-urlencoded") > -1) {
            req.on("data", function (chunk) { fullBody += chunk.toString(); });
            req.on("end", function () {
               var dBody = querystring.parse(fullBody);
               writeResponse(req, res, dBody,
                  url.parse(req.url, true).query["callback"]);
            });
         } else {
            req.on("data", function (chunk) { fullBody += chunk.toString(); });
            req.on("end", function () {
               dataObj = JSON.parse(fullBody);
               var dprops = new Object();
               for (var i = 0; i < dataObj.length; i++) {
                  dprops[dataObj[i].name] = dataObj[i].value;
               }
               writeResponse(req, res, dprops);
            });
         }
      }
   } else if (req.method === "GET") {
      var data = url.parse(req.url, true).query;
      writeResponse(req, res, data, data["callback"]);
   }

}).listen(port);
console.log("Ready on port " + port);