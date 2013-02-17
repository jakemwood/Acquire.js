var fs = require('fs');
var express = require('express');
var app = express();

var Strategy = require('../lib/ordered.js');
var Acquire = require('../lib/Acquire.js');

var game = new Acquire();

var james = game.newPlayer('James');
var jake = game.newPlayer('Jake');

// Start listening from stdin
process.stdin.resume();
process.stdin.setEncoding('UTF-8');

var tagsToReplace = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;'
};

function replaceTag(tag) {
    return tagsToReplace[tag] || tag;
}

function safe_tags_replace(str) {
    return str.replace(/[&<>]/g, replaceTag);
}

var all_html = '';
// Attach an event listener to stdin for "data" event
app.get('/', function(req, res) {
	Strategy.makeMove(game);
	
	// render the board as an html page...
	var html = "<html><head><style type='text/css'>table { border-collapse:collapse; } table,th, td { border: 1px solid black; }</style><body>";
	html += "<p><a href='/'>Make Move!</a></p>";
	
	var this_html = "<table>";
	
	for (var x = 0; x < 9; x++) {
		this_html += '<tr>';
		for (var y = 0; y < 12; y++) {
			this_html += '<td width="50" height="50"';
			
			var row = String.fromCharCode(x+65);
			var column = y + 1;
			var tile = game.getTile({ row: row, column: column })
			if (tile.singleton) {
				this_html += ' bgcolor="#ccc"';
			}
			else if (tile.hotel) {
				this_html += ' bgcolor="' + tile.hotel + '"';
			}
			
			this_html += '>';
			this_html += column + row;
			this_html += '</td>';
		}
		this_html += '</tr>';
	}
	this_html += '</table>';
	
	var players = game.getPlayers();
	this_html += '<table cellspacing="5">';
	for (var i = 0; i < players.length; i++) {
		this_html += '<tr>';
		this_html += "<td height='50'>" + players[i].name + '</td>';
		for (var u = 0; u < players[i].tiles.length; u++) {
			this_html += "<td width='50' height='50' bgcolor='#ccc'>" + players[i].tiles[u].column + players[i].tiles[u].row + "</td>";
		}
		this_html += '</tr>';
	}
	this_html += '</table>';
	
	this_html += '<pre>' + safe_tags_replace(game.generateXML()) + '</pre>';
	
	all_html = this_html + all_html;
	
	html += this_html;
	html += '</body></html>';
	
	res.send(html);
});

app.listen(process.ENV.PORT || 9000);