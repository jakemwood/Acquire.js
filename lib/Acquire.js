var Board = require('./Board');
var Player = require('./Player');
var xmlp = require('stablexml');
var XMLParser = new xmlp();
var RuleChecker = require('./RuleChecker');
var Stock = require('./Certificate');

module.exports = function() {

	var players = []; // Array of Player
	var board = new Board(); // Board
	
	// [public] setBoard: Board -> (nothing)
	// Sets the board for this Acquire
	this.setBoard = function(b) {
		board = b;
	}
	
	this.getBoard = function() {
		return board;
	}
	
	this.getPlayers = function() {
		return players;
	}
	
	this.addShare = function(owner, hotelName, count) {
		var hotel = board.getHotelByName(hotelName);
		var certificate = new Stock(hotel, owner, count);
		hotel.addOwner(certificate);
		owner.addShare(certificate);
	}
	
	this.addStock = function(hotel) {
		for (var s in this.stock) {
			if (this.stock[s].getHotel().getName() == hotel.getName()) {
				this.stock[s].increaseCount();
				return;
			}
		}
		
		var certificate = new Stock(hotel, this, 1);
		this.stock.push(certificate);
	}
	
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
		var column = Math.round(Math.random() * (12 - 1) + 1);
		var row = Math.round(Math.random() * (9 - 1) + 1);
		return {
			row: String.fromCharCode(row + 64),
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
		
		var pieces = 6;
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
		parser.parseXML(RuleChecker.inspect(board, tile), function(err, results) {
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
				RuleChecker.singleton(ourboard, tile);
			}
			else if (results.founding) {
				// Found a hotel!
				RuleChecker.foundHotel(self, hotel, tile, players[0]);
			}
			else if (results.merging) {
				// Merge hotels!
				RuleChecker.merging(ourboard, tile, hotel);
			}
			else if (results.growing) {
				// Grow hotel!
				RuleChecker.growing(ourboard, tile);
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
	
	var CONTINENTAL_TOWER_PRICING = [{"41":1200}, {"31":1100}, {"21":1000}, {"11":900}, {"6":800}, {"5":700}, {"4":600}, {"3":500}, {"2":400}];
	var FESTIVAL_IMPERIAL_AMERICAN_PRICING = [ {"41":1100}, {"31":1000}, {"21":900}, {"11":800}, {"6":700}, {"5":600}, {"4":500}, {"3":400}, {"2":300} ];
	var WORLDWIDE_SACKSON_PRICING = [{"41":1000},{"31":900},{"21":800},{"11":700},{"6":600},{"5":500},{"4":400},{"3":300},{"2":200}];
	
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
		var hotelsize = board.getHotelByName(hotelname).getTiles().length;
		if(hotel.getName() == "Worldwide" || hotel.getName() == "Sackson"){
			return iterateHotelPrices(WORLDWIDE_SACKSON_PRICING, hotelsize);
		}
		else if(hotel.getName() == "Festival" || hotel.getName() ==	"Imperial" || hotel.getName() == "American"){
			return iterateHotelPrices(FESTIVAL_IMPERIAL_AMERICAN_PRICING, hotelsize);
		}
		else if(hotel.getName() == "Continental" || hotel.getName() == "Tower"){
			return iterateHotelPrices(CONTINENTAL_TOWER_PRICING, hotelsize);
		}
		else {
			throw new Error("Hotel name not found.");
		}
	}
	
	// [public] freeStock: Hotel -> (nothing)
	// Give the owner a free stock certificate to this hotel
	this.freeStock = function(hotel) {
		this.addShare(players[0], hotel.getName(), 1);
	}
	
	// [public] buyStock: HotelName -> (nothing)
	// Buy a stock on behalf of the current user
	this.buyStock = function(hotelName) {
		// calculate the price of the stock...
		// does the owner have enough money for it?
		// deduct the money from the owners account
		// call on freeStock
		var stockPrice = getHotelPrice(hotelName);
		
		if (parseInt(players[0].cash) < parseInt(stockPrice)) {
			throw new Error("Player does not have enough money to buy this share");
		}
		
		players[0].cash -= stockPrice;
		this.freeStock(board.getHotelByName(hotelName));
	}
}