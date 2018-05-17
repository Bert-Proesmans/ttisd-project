var http = require('http');
var fs = require('fs');
var express = require('express');
var WebSocketServer = require('websocket').server;

const hostname = 'localhost';
const port = 3000;


var server = http.createServer(function (req, res) {
  fs.readFile('demo.html', function (err, data) {
    res.writeHead(200, { 'Content-Type': 'text/html', 'Content-Length': data.length });
    res.write(data);
    res.end();
  });

  if(req.method == 'POST'){
    console.log("POST");
        var body = '';
        req.on('data', function (data) {
            body += data;
            console.log("Partial body: " + body);
        });
        req.on('end', function () {
            console.log("Body: " + body);
        });
        //res.writeHead(200, {'Content-Type': 'text/html'});
        //res.end('post received');

        req.on('error', function(data){
          console.log("ERROR");
        });
    }
}
);


server.listen(port, () => {
  console.log(`Listening on port ${port}`);
});



wsServer = new WebSocketServer({
  httpServer: server,
  // You should not use autoAcceptConnections for production
  // applications, as it defeats all standard cross-origin protection
  // facilities built into the protocol and the browser.  You should
  // *always* verify the connection's origin and decide whether or not
  // to accept it.
  autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

