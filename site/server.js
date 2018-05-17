var http = require('http');
var fs = require('fs');

const hostname = 'localhost';
const port = 3000;

http.createServer(function (req, res) {
  fs.readFile('demo.html', function (err, data) {
    res.writeHead(200, { 'Content-Type': 'text/html', 'Content-Length': data.length });
    res.write(data);
    res.end();
  });
}).listen(port, () => {
  console.log(`Listening on port ${port}`);
});