const express = require('express'), app = express();
const http = require('http').Server(app);
const port = process.env.PORT || 3000;

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/public/index.html');
});

app.use(express.static(__dirname + '/public'));

http.listen(port, function () {
	console.log('Listening on port: ' + port);
});