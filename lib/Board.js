// Board
// =====
// This file creates a "Board" module which can be imported
// into other node.js scripts and instantiated.
//
// See "Data Types.txt" for common data types.
//
// Example of code that might appear in acquire.js:
//
//	var Hotel = require('./Board.js');
//  var game = new Board();
//  ...
// 
var Constants = require('../config/constants.js');
var RuleChecker = require('./RuleChecker');
module.exports = function() {

	// Array of Tile
	var tiles = [];
	// Array of hotels
	var hotels = [];
	
	// [public] getTiles: (nothing) -> Array[Tile]
	// Returns a list of tiles
	this.getTiles = function() {
		return tiles;
	}
	
	// [public] hasTile: Tile -> Boolean
	// Does this board contain a tile?
	this.hasTile = function(tile) {
		var i = tiles.length;
		while (i--) {
			if (tiles[i].row == tile.row && tiles[i].column == tile.column) {
				return true;
			}
		}
		return false;
	}
	
	// [public] hasAnyTiles: Array[Tiles] -> Boolean
	// Does this contain at least one of the given tiles?
	this.hasAnyTiles = function(tiles) {
		for (var i in tiles) {
			if (this.hasTile(tiles[i])) {
				return true;
			}
		}
		return false;
	}
	
	// [public] addTile: Tile -> (nothing)
	// Adds an unoccupied tile to the board.
	this.addTile = function(tile) {
		if (this.hasTile(tile)) {
			throw new Error("This tile already exists");
		}
		if (tile.column >= Constants.COLUMNS_START &&
			tile.column <= Constants.COLUMNS_END &&
			tile.row >= Constants.ROWS_START &&
			tile.row <= Constants.ROWS_END) {
			/*var hoteltiles = this.flattenHotelTiles();
			for (var h in hoteltiles) {
				if (RuleChecker.isDirectlyConnected(tile, hoteltiles[h])) {
					throw new Error("Singleton tile is connected to a hotel");
				}
			}*/
			tiles.push(tile);
		}
		else {
			throw new Error("Invalid column given: " + tile.column);
		}
	}
	
	// [public] removeTile: Tile -> (nothing)
	// Removes a tile from the board
	this.removeTile = function(position) {
		if (!this.hasTile(position)){
			throw new Error("Tile not in Board");
		}
		for (var i in tiles) {
			if (tiles[i].row == position.row && tiles[i].column == position.column) {
				tiles.splice(i, 1);
			}
		}
	}
	
	// [public] removeTiles: Array[Tile] -> (nothing)
	// Remove a list of tiles from the board
	this.removeTiles = function(tiles) {
		for (var x in tiles) {
			this.removeTile(tiles[x]);
		}
	}
	
	// [public] hasHotel: Hotel -> Boolean
	// Does this hotel already exist?
	this.hasHotel = function(hotel) {
		var i = hotels.length;
		while (i--) {
			if (hotels[i].getName() == hotel.getName()) {
				return true;
			}
		}
		return false;
	}
	
	// [public] hasHotelName: String -> Boolean
	// Does this hotel already exist?
	this.hasHotelName = function(hotelName) {
		var i = hotels.length;
		while (i--) {
			if (hotels[i].getName() == hotelName) {
				return true;
			}
		}
		return false;
	}
	
	// [public] addHotel: Hotel -> (nothing)
	// Adds a hotel 
	this.addHotel = function(hotel) {
		if (this.hasHotel(hotel)) {
			throw new Error("This hotel is not available.");
		}
		var tiles = hotel.getTiles();
		for (var t in tiles) {
			var x = RuleChecker.getAdjacentHotels(this, tiles[t]);
			if (x.length > 0) {
				throw new Error("This hotel will touch another hotel: " + x[0].getName());
			}
		}
		if (hotel.getStock().length == 0) {
			throw new Error("A hotel must have stock before its added to the board.");
		}
		hotels.push(hotel);
	}
	
	// [public] removeHotel: Hotel -> (nothing)
	// Removes a hotel
	this.removeHotel = function(hotel) {
		if (!this.hasHotel(hotel)) {
			throw new Error("This hotel does not exist");
		}
		for (var h in hotels) {
			if (hotels[h].getName() == hotel.getName()) {
				hotels.splice(h, 1);
			}
		}
	}
	
	// [public] flattenHotelTiles: (nothing) -> Array[Tile]
	// Gets the list of all tiles associated with all hotels.
	this.flattenHotelTiles = function() {
		var ourtiles = [];
		for (var i in hotels) {
			var hoteltiles = hotels[i].getTiles();
			for (var t in hoteltiles) {
				ourtiles.push(hoteltiles[t]);
			}
		}
		return ourtiles;
	}
		
	// [public] getHotels: (nothing) -> Array[Hotel]
	// Returns a list of in-play hotels
	this.getHotels = function() {
		return hotels;
	}
	
	// [public] getHotelByName: HotelName -> Hotel
	// Get a hotel by its name
	this.getHotelByName = function(name) {
		for (var h in hotels) {
			if (hotels[h].getName() == name) {
				return hotels[h];
			}
		}
		throw new Error("Hotel could not be found");
	}
	
	// [public] hotelsHaveTile: Tile -> Boolean
	// Does any hotel on this board have the given tile?
	this.hotelsHaveTile = function(tile) {
		for (var h in hotels) {
			var tiles = hotels[h].getTiles();
			for (var t in tiles) {
				if (tiles[t].row == tile.row && tiles[t].column == tile.column) {
					return true;
				}
			}
		}
		return false;
	}
	
	// [public] generateXML: (nothing) -> String
	// Generates the XML representation of this board
	this.generateXML = function() {
		var xml = "<board>\r\n";
		
		tiles = RuleChecker.sortTiles(tiles);
		for (var i in tiles) {
			xml += "<tile column=\"" + tiles[i].column + "\" row=\"" + tiles[i].row + "\" />\r\n";
		}
		
		for (var i in hotels) {
			var hotel = hotels[i];
			xml += "<hotel label=\"" + hotel.getName() + "\">\r\n";
			
			var hotelTiles = RuleChecker.sortTiles(hotel.getTiles());
			for (var t in hotelTiles) {
				var tile = hotelTiles[t];
				xml += "<tile column=\"" + tile.column + "\" row=\"" + tile.row + "\" />\r\n";
			}
			
			xml += "</hotel>\r\n";
		}
		
		xml += "</board>";
		return xml;
	}
}