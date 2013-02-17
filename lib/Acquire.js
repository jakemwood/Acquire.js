var Board = require('./Board');
var Player = require('./Player');
var xmlp = require('stablexml');
var XMLParser = new xmlp();
var RuleChecker = require('./RuleChecker');
var Stock = require('./Certificate');

var Constants = require('../config/constants.js');

module.exports = function() {

	var players = []; // Array of Player
	var board = new Board(); // Board
	
	// [public] setBoard: Board -> (nothing)
	// Sets the board for this Acquire
	this.setBoard = function(b) {
		board = b;
	}
	
	// [public] getBoard: (nothing) -> Board
	// Get the board for this Acquire
	this.getBoard = function() {
		return board;
	}
	
	// [public] getPlayers: (nothing) -> Array[Player]
	// Get the list of players for this game
	this.getPlayers = function() {
		return players;
	}
	
	// [public] addShare: Player Hotel Number -> (nothing)
	// Give owner count shares in hotelName.
	this.addShare = function(owner, hotel, count) {
		var certificate = new Stock(hotel, owner, count);
		hotel.addOwner(certificate);
		owner.addShare(certificate);
	}
	
	// [public] addShareByNameAndCount: Board HotelName Count -> (nothing)
	// Add shares in bulk (useful for loading the initial state)
	this.addShareByNameAndCount = function(board, hotelName, count) {
		for (var s in this.stock) {
			if (this.stock[s].getHotel().getName() == hotelName) {
				this.stock[s].setCount(count);
				return;
			}
		}
		var certificate = new Stock(board.getHotelByName(hotelName), this, count);
		certificate.setCount(count);
		this.stock.push(certificate);
	}
	
	// [private] generateRandomTile: (nothing) -> Tile
	// Create a random tile
	var generateRandomTile = function() {
		var column = Math.round(Math.random() * (Constants.COLUMNS - 1) + 1);
		var row = Math.round(Math.random() * (Constants.ROWS - 1) + 1);
		return {
			row: String.fromCharCode(row + Constants.ASCII_START),
			column: column
		};
	}
	
	// [private] playersHaveTile: Tile -> Boolean
	// Do any players have this tile?
	var playersHaveTile = function(tile) {
		var playerTiles = [];
		for (var i in players) {
			playerTiles = playerTiles.concat(players[i].tiles);
		}
		for (var i in playerTiles) {
			if (playerTiles[i].row == tile.row && playerTiles[i].column == tile.column)
				return true;
		}
		return false;
	}
	
	// [public] newPlayer: String -> Player
	// Add a player to the game
	this.newPlayer = function(name) {
		var p = new Player(name);
		players.push(p);
		
		var pieces = Constants.INIT_PIECES;
		while (pieces--) {
			var tile = generateRandomTile();
			while (playersHaveTile(tile) || board.hasTile(tile)) {
				tile = generateRandomTile();
			}
			p.addTile(tile);
		}
		
		return p;
	}
	
	// [public] addPlayer: Player -> (nothing)
	// Adds a player to the game	
	this.addPlayer = function(player) {
		for(var i in players) {
			if(players[i].hasTiles(player.tiles)){
				throw new Error ("Another player already has this tile.")
			}
		}
		if(board.hasAnyTiles(player.tiles)) {
			throw new Error ("Board already has this tile.")
		}
		for (var i in player.tiles) {
			if (board.hotelsHaveTile(player.tiles[i])) {
				throw new Error("A hotel already has a tile owned by the new player.");
			}
		}
		players.push(player);
		
	};
	
	// [public] generateXML: (nothing) -> AcquireXML
	// Generate the XML to output
	this.generateXML = function() {
		var xml = '<state>\r\n';
		xml += board.generateXML() + '\r\n';
		
		for (var i in players) {
			xml += players[i].generateXML();
		}
		
		xml += '</state>';
		return xml;
	}
	
	// [public] placeTile: Tile (HotelName | null) -> (nothing)
	// The current player places a tile.
	this.placeTile = function(tile, hotel) {
		var parser = new xmlp();
		var ourboard = board;
		var self = this;
		var xml = RuleChecker.inspect(board, tile);
		parser.parseXML(xml, function(err, results) {
			if (results.length == 1) {
				results = results[0];
			}
			var playerTiles = players[0].tiles;
			var acceptableMove = false;
			for (var i in playerTiles) {
				if (playerTiles[i].row == tile.row && playerTiles[i].column == tile.column) {
					acceptableMove = true;
					break;
				}
			}
			if (!acceptableMove) {
				throw new Error("Player does not have this tile");
			}
			if (results.singleton) {
				// Place a singleton!
				RuleChecker.singleton(self, tile);
			}
			else if (results.founding) {
				// Found a hotel!
				RuleChecker.foundHotel(self, hotel, tile, players[0]);
			}
			else if (results.merging) {
				// Merge hotels!
				RuleChecker.merging(self, tile, hotel);
			}
			else if (results.growing) {
				// Grow hotel!
				RuleChecker.growing(self, tile);
			}
			else {
				throw new Error(xml);
			}
			
			players[0].removeTile(tile);
		});	
	};
	
	// [public] nextPlayer: (nothing) -> (nothing)
	// Rotate the players so it's the next player's turn.
	this.nextPlayer = function() {
	
		// Give the current player a new piece...
		var tile = generateRandomTile();
		while (playersHaveTile(tile) || board.hasTile(tile)) {
			tile = generateRandomTile();
		}
		players[0].addTile(tile);
		
		var append = players.splice(0, 1);
		players = players.concat(append);
	}
	
	// [private] iterateHotelPrices: Array[Pricing] Number -> Number
	// Get the price for a hotel given number of shares.
	var iterateHotelPrices = function(pricing, stockNum) {
		for(var i in pricing) {
			var pricer = pricing[i];
			var price = Object.keys(pricer)[0];
			if(parseInt(price) <= stockNum){
				return pricer[price];
			}
		}
		throw new Error("Certificate has " + stockNum + " stock out. Can not computer a price.");
	}
	
	// [private] getHotelPrice: HotelName -> Number
	// Get the share price of a hotel
	var getHotelPrice = function(hotelname) {
		if (!board.hasHotelName(hotelname)) {
			throw new Error("This hotel is not on the board");
		}
		var hotel = board.getHotelByName(hotelname);
		var hotelsize = hotel.getTiles().length;
		if(hotelname == "Worldwide" || hotelname == "Sackson"){
			return iterateHotelPrices(Constants.WORLDWIDE_SACKSON_PRICING, hotelsize);
		}
		else if(hotelname == "Festival" || hotelname ==	"Imperial" || hotelname == "American"){
			return iterateHotelPrices(Constants.FESTIVAL_IMPERIAL_AMERICAN_PRICING, hotelsize);
		}
		else if(hotelname == "Continental" || hotelname == "Tower"){
			return iterateHotelPrices(Constants.CONTINENTAL_TOWER_PRICING, hotelsize);
		}
		else {
			throw new Error("Hotel name not found.");
		}
	}
	
	// [private] freeStock: Acquire Hotel -> (nothing)
	// Give the owner a free stock certificate to this hotel
	var freeStock = function(self, hotel) {
		self.addShare(players[0], hotel, Constants.FOUNDING_STOCK_AMT);
	}
	
	// [public] buyStock: HotelName -> (nothing)
	// Buy a stock on behalf of the current user
	this.buyStock = function(hotelName) {
		var stockPrice = getHotelPrice(hotelName);
		
		if (parseInt(players[0].cash) < parseInt(stockPrice)) {
			throw new Error("Player does not have enough money to buy this share");
		}
		
		players[0].cash -= stockPrice;
		freeStock(this, board.getHotelByName(hotelName));
	}
}