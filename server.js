const express = require('express'), app = express();
const http = require('http').Server(app);
const port = process.env.PORT || 3000;

app.use(function (req, res, next) {
	if (req.get('X-Forwarded-Proto') == 'https' || req.hostname == 'localhost')
		next();
	else if (req.get('X-Forwarded-Proto') != 'https' && req.get('X-Forwarded-Port') != '443')
		res.redirect('https://' + req.hostname + req.url);
});

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/public/index.html');
});

app.use(express.static(__dirname + '/public'));

http.listen(port, function () {
	console.log('Listening on port: ' + port);
});