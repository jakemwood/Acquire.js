// RuleChecker
// ==============
// This file creates an "RuleChecker" module which can be imported
// into other node.js scripts and instantiated.
//
// The RuleChecker contains methods to execute various types of moves
// on a board, as well as utility methods used throughout the program
// to help faciliate said moves.
//
// See "Data Types.txt" for common data types.
//
// Example of code that might appear in acquire.js:
//
//	var RuleChecker = require('./RuleChecker.js');
//  ...
//
var Hotel = require('./Hotel');
var Stock = require('./Certificate');

module.exports = {

	// [public] makeSurroundingFor: Tile -> Array[Tile]
	// Get an array containing the tile objects that are immediately to the left,
	// right, top, and bottom of the given tile.
	makeSurroundingFour: function(position) {

		var leftRow = String.fromCharCode(position.row.charCodeAt(0) - 1);
		var rightRow = String.fromCharCode(position.row.charCodeAt(0) + 1);
		var topColumn = parseInt(position.column) - 1;
		var bottomColumn = parseInt(position.column) + 1;
		
		var aroundTile = [];
		
		if (leftRow >= "A" && leftRow <= "I") {
			aroundTile.push({ row: leftRow, column: position.column });
		}
		if (topColumn >= 1 && topColumn <= 12) {
			aroundTile.push({ row: position.row, column: topColumn });
		}
		if (rightRow >= 'A' && rightRow <= 'I') {
			aroundTile.push({ row: rightRow, column: position.column });
		}
		if (bottomColumn >= 1 && bottomColumn <= 12) {
			aroundTile.push({ row: position.row, column: bottomColumn });
		}
		
		return aroundTile;
	},

	// [public] findConnectedTiles: Array[Tile], Tile -> Array[Tile]
	// Find all tiles connected to the given tile
	findConnectedTiles: function(tiles, position) {
		var connectedtiles = [];
		
		var c4 = module.exports.makeSurroundingFour(position);
		for (var i in c4) {
			for (var t in tiles) {
				if (tiles[t].row == c4[i].row && tiles[t].column == c4[i].column) {
					tiles.splice(t, 1);
					connectedtiles = connectedtiles.concat(module.exports.findConnectedTiles(tiles, c4[i]));
					connectedtiles.push(c4[i]);
				}
			}
		}
		
		return connectedtiles;
	},
	
	// [public] singleton: Board Tile -> Board
	// Add a singleton to the given board.
	singleton: function(board, position) {
	
		// First, check to make sure that this singleton does not touch
		// any hotel pieces.
		var hoteltiles = board.flattenHotelTiles();
		var c4 = module.exports.makeSurroundingFour(position);
		
		for (var ht in hoteltiles) {
			for (var x in c4) {
				if (c4[x].row == hoteltiles[ht].row &&
					c4[x].column == hoteltiles[ht].column) {
					throw new Error("The requested piece connects to a hotel.");	
				}
			}
		}
		
		board.addTile(position);
		
		return board;
	},
	
	// [public] isDirectoyConnected: Tile, Tile -> Boolean
	// Are these two tiles directly connected?
	isDirectlyConnected: function(a, b) {
		var c4 = module.exports.makeSurroundingFour(a);
		for (var i in c4) {
			if (b.row == c4[i].row && b.column == c4[i].column) {
				return true;
			}
		}
		return false;
	},
	
	// [public] foundHotel: Acquire HotelName Tile Player -> Hotel
	// Adds a hotel to the board at the given position 
	foundHotel: function(acquire, hotelName, position) {
		
		if (acquire.getBoard().hasHotelName(hotelName)) {
			throw new Error ("Hotel already exists.");
		}
		
		// Iterate through all the available tiles to find
		// anything that connects to the given hotel piece.
		var tiles = acquire.getBoard().getTiles();
		var alltiles = [];
		for (var i in tiles) {
			alltiles.push({
				row: tiles[i].row,
				column: tiles[i].column
			});
		}
		var connectedtiles = module.exports.findConnectedTiles(alltiles, position);
		
		if (connectedtiles.length != 1) {
			throw new Error("This hotel either: connects to too many singletons, or doesn't connect to any singletons");
		}
		
		var hoteltiles = acquire.getBoard().flattenHotelTiles();
		for (var i in hoteltiles) {
			if (module.exports.isDirectlyConnected(position, hoteltiles[i]) ||
				module.exports.isDirectlyConnected(connectedtiles[0], hoteltiles[i])) {
				throw new Error("This hotel will connect to another hotel");
			}
		}
		
		var hotel = new Hotel(hotelName);
		
		acquire.getBoard().addHotel(hotel);
		hotel.addTiles(connectedtiles);
		hotel.addTile(position);
		acquire.getBoard().removeTiles(connectedtiles);
		acquire.freeStock(hotel);
		
		return hotel;
	},
	
	// [public] growing: Board, Tile -> Board
	// Grow a hotel by placing a tile next to it.
	growing: function(board, tile) {
		var hotels = board.getHotels();
		var legalMove = false;
		var hotel;
		for (h in hotels) {
			var tiles = hotels[h].getTiles();
			for (var t in tiles) {
				if (module.exports.isDirectlyConnected(tile, tiles[t])) {
					// allow it!
					if (legalMove) {
						throw new Error("You are trying to merge hotels on a growing request.");
					}
					legalMove = true;
					break;
				}
			}
			if (legalMove) {
				hotel = hotels[h];
			}
		}
		
		if (!legalMove) {
			throw new Error("Cannot grow this hotel - given piece is not adjacent to an existing hotel");
		}
		
		if (hotel.hasTile(tile)) {
			throw new Error("Hotel already contains tile.");
		}
		
		hotel.addTile(tile);
		return board;
	},
	
	// [public] merging: Board, Tile, HotelName -> Board
	// Merge two or more hotels.
	merging: function(board, tile, acquirerName) {
	
		if (!board.hasHotelName(acquirerName)) {
			throw new Error("Acquirer is not an in-play hotel.");
		}
		
		var merginghotels = [];
		
		var c4 = module.exports.makeSurroundingFour(tile);
		var hotels = board.getHotels();
		for (var h in hotels) {
			for (var i in c4) {
				if (hotels[h].hasTile(c4[i])) {
					merginghotels.push(hotels[h]);
				}
			}
		}
		
		if (merginghotels.length < 2) {
			throw new Error("Merger does not have enough hotels");
		}
		
		var acquirer;
		for (var h in hotels) {
			if (hotels[h].getName() == acquirerName) {
				acquirer = hotels[h];
				break;
			}
		}
		
		for (var h in merginghotels) {
			if (merginghotels[h].getTiles().length >= 11) {
				throw new Error("Safe hotels cannot be involved in a merger");
			}
			if (merginghotels[h].getName() != acquirerName) {
				if (merginghotels[h].getTiles().length > acquirer.getTiles().length) {
					throw new Error("A smaller hotel is trying to acquire a bigger hotel.");
				}
				acquirer.addTiles(merginghotels[h].getTiles());
				board.removeHotel(merginghotels[h]);
			}
		}
		
		acquirer.addTile(tile);
		
		return board;
	},
	
	// [public] getAdjacentHotels: Board, Tile -> Array[Hotel]
	// Gets a list of hotels adjacent to a tile piece
	getAdjacentHotels: function(board, tile) {
	
		var adjacentHotels = [];
		
		// Calculate the list of adjacent hotels...
		var hotels = board.getHotels();
		for (var h in hotels) {
			var tiles = hotels[h].getTiles();
			for (t in tiles) {
				if (module.exports.isDirectlyConnected(tiles[t], tile)) {
					
					// Check to see if this hotel already exists in adjacentHotels...
					var addHotel = true;
					for (var a in adjacentHotels) {
						if (adjacentHotels[a].getName() == hotels[h].getName()) {
							addHotel = false;
							break;
						}
					}
					if (addHotel) {
						adjacentHotels.push(hotels[h]);
					}
				}
			}
		}
		
		return adjacentHotels;
	},
	
	// [public] inspect: Board, Tile -> String
	// Inspect the given tile for available move options
	inspect: function(board, tile) {
	
		// If we already have a tile in this spot, inspect should fail
		if (board.hasTile(tile) || board.hotelsHaveTile(tile)) {
			return "<impossible msg=\"A tile already exists in this spot.\" />";
		}
	
		// So what should we check for first...probably mergers
		// Check to see how many hotels are connected to the given piece.
		var tiles = board.getTiles();
		var copytiles = [];
		for (var i in tiles) {
			copytiles.push(tiles[i]);
		}
		var connectedTiles = module.exports.findConnectedTiles(copytiles, tile);
		var adjacentHotels = module.exports.getAdjacentHotels(board, tile);
		
		if (adjacentHotels.length == 1) {
			// If there's only one hotel adjacent to this tile, we can grow it.
			return "<growing name=\"" + adjacentHotels[0].getName() + "\" />";
		}
		else if (adjacentHotels.length > 1) {
			// If there is more than one hotel adjacent to this tile, we can merge them.
			var xml = "<merging ";
			adjacentHotels.sort(function(a, b) {
				return b.getTiles().length - a.getTiles().length;
			});
			for (var a in adjacentHotels) {
				if (adjacentHotels[a].getTiles().length >= 11) {
					xml = "<impossible msg=\"Safe hotels cannot be involved in a merger.\" ";
					break;
				}
				if (a == 0) {
					xml += 'acquirer="';
					xml += adjacentHotels[a].getName();
					xml += '" ';
				}
				else {
					xml += 'acquired' + a + '="';
					xml += adjacentHotels[a].getName();
					xml += '" ';
				}
			}
			xml += ' />';
			return xml;
		}
		else {
			// There are no adjacent hotels.  Is this tile already on the board as a singleton?
			if (connectedTiles.length == 1) {
				// If there are already two tiles down, placing the third can mean founding a hotel.
				return '<founding />';
			}
			else {
				return '<singleton />';
			}
		}
	/*
		// Check for singleton and founding...
		var connectedTiles = module.exports.findConnectedTiles(board.getTiles(), tile);
		if (connectedTiles.length >= 3) {
			return '<founding />';
		}
		
		if (board.hasTile(tile)) {
			return "<singleton />";
		}
		
		return "<impossible msg=\"No moves found.\" />";
		*/
		return "<error msg=\"I don't know how we made it here, but we did.\" />";
	}
};