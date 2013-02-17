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
var Constants = require('../config/constants.js');
module.exports = {

	// sortTiles: Array[Tile] -> Array[Tile]
	// Helper function to sort tiles
	sortTiles: function(tiles) {
		tiles.sort(function(a, b) { // (anonymous): Tile, Tile -> Number
			return a.row.charCodeAt(0) - b.row.charCodeAt(0);
		});
		tiles.sort(function(a, b) { // (anonymous): Tile, Tile -> Number
			if (a.row == b.row) {
				return parseInt(a.column) - parseInt(b.column);
			}
			else {
				return a.row.charCodeAt(0) - b.row.charCodeAt(0);
			}
		});
		return tiles;
	},

	// [public] makeSurroundingFor: Tile -> Array[Tile]
	// Get an array containing the tile objects that are immediately to the left,
	// right, top, and bottom of the given tile.
	makeSurroundingFour: function(position) {

		var leftRow = String.fromCharCode(position.row.charCodeAt(0) - 1);
		var rightRow = String.fromCharCode(position.row.charCodeAt(0) + 1);
		var topColumn = parseInt(position.column) - 1;
		var bottomColumn = parseInt(position.column) + 1;
		
		var aroundTile = [];
		
		if (leftRow >= Constants.ROWS_START && leftRow <= Constants.ROWS_END) {
			aroundTile.push({ row: leftRow, column: position.column });
		}
		if (topColumn >= Constants.COLUMNS_START && topColumn <= Constants.COLUMNS_END) {
			aroundTile.push({ row: position.row, column: topColumn });
		}
		if (rightRow >= Constants.ROWS_START && rightRow <= Constants.ROWS_END) {
			aroundTile.push({ row: rightRow, column: position.column });
		}
		if (bottomColumn >= Constants.COLUMNS_START && bottomColumn <= Constants.COLUMNS_END) {
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
	
	// [public] singleton: Acquire Tile -> Board
	// Add a singleton to the given board.
	singleton: function(acquire, position) {
	
		var board = acquire.getBoard();
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
		acquire.getPlayers()[0].removeTile(position);
		
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
	
	// getConnectedTiles: Array[Tile] Tile -> Array[Tile]
	// Given a tile, X, find all tiles that are connected to X.
	getConnectedTiles: function(tiles, position) {
		var alltiles = [];
		for (var i in tiles) {
			alltiles.push({
				row: tiles[i].row,
				column: tiles[i].column
			});
		}
		return module.exports.findConnectedTiles(alltiles, position);
	},
	
	// isDirectlyConnectedToHotel: Board, Array[Tile], Array[Tile], Tile -> Boolean
	// Is the given tile (or any of its connections) directly connected to a hotel?
	isDirectlyConnectedToHotel: function(board, connectedtiles, position) {
		var hoteltiles = board.flattenHotelTiles();
		for (var i in hoteltiles) {
			if (module.exports.isDirectlyConnected(position, hoteltiles[i]) ||
				module.exports.isDirectlyConnected(connectedtiles[0], hoteltiles[i])) {
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
		var connectedtiles = module.exports.getConnectedTiles(
			acquire.getBoard().getTiles(), position);
		if (connectedtiles.length != 1) {
			throw new Error("This hotel either: connects to too many singletons, or doesn't connect to any singletons");
		}
		
		if (module.exports.isDirectlyConnectedToHotel(acquire.getBoard(), connectedtiles, position)) {
			throw new Error("This hotel will connect to another hotel.");
		}
		
		var hotel = new Hotel(hotelName);
		
		hotel.addTiles(connectedtiles);
		hotel.addTile(position);
		acquire.getBoard().removeTiles(connectedtiles);

		var founder = acquire.getPlayers()[0];
		var certificate = new Stock(hotel, founder, Constants.FOUNDING_STOCK_AMT);
		hotel.addOwner(certificate);
		founder.addShare(certificate);
		
		acquire.getBoard().addHotel(hotel);
		acquire.getPlayers()[0].removeTile(position);
		
		return hotel;
	},
	
	// [public] growing: Board, Tile -> Board
	// Grow a hotel by placing a tile next to it.
	growing: function(acquire, tile) {
	
		var board = acquire.getBoard();
		var hotels = board.getHotels();
		var legalMove = false;
		var hotel;
		for (var h in hotels) {
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
			if (legalMove && !hotel) {
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
		acquire.getPlayers()[0].removeTile(tile);
		
		return board;
	},
	
	// getMergingHotels: Array[Hotel] Tile -> Array[Hotel]
	// Given a tile, what hotels would be involved in a merger
	// from placing a tile on that position?
	getMergingHotels: function(hotels, tile) {
		var merginghotels = [];
		var c4 = module.exports.makeSurroundingFour(tile);
		for (var h in hotels) {
			for (var i in c4) {
				if (hotels[h].hasTile(c4[i])) {
					merginghotels.push(hotels[h]);
				}
			}
		}
		return merginghotels;
	},
	
	// calculateShareholders: Array[Stock] -> { majority: Array[Stock], minority: Array[Stock] }
	// Calculate the shareholders of a hotel based on majority and minority rules
	calculateShareholders: function(shares) {
		var previousCount = null;
		var majorityShareholders = [];
		var minorityShareholders = [];
		var majority = true;
		for (var i in shares) {
			if (previousCount == null) {
				previousCount = shares[i].getCount();
			}
			if (parseInt(previousCount) > parseInt(shares[i].getCount())) {
				// now we're in the minority shareholders...
				if (majority) {
					majority = false;
					minorityShareholders.push(shares[i]);
				}
				else {
					break;
				}
			}
			else {
				if (majority) {
					majorityShareholders.push(shares[i]);
				}
				else {
					minorityShareholders.push(shares[i]);
				}
			}
			previousCount = shares[i].getCount();
		}
		return {
			majority: majorityShareholders,
			minority: minorityShareholders
		};
	},
	
	// distributeDividends: { majority: Array[Stock], minority: Array[Stock } -> (nothing)
	// Distribute dividends amongst majority and minority stockholders
	distributeDividends: function(shareholders) {
		if (shareholders.majority.length > 1) {
			for (var i in shareholders.majority) {
				var oldCash = parseInt(shareholders.majority[i].getOwner().cash);
				oldCash += parseInt(shareholders.majority[i].currentValue() * (Constants.MAJORITY_BONUS + Constants.MINORITY_BONUS) / shareholders.majority.length);
				shareholders.majority[i].getOwner().cash = oldCash;
			}
		}
		else {
			if (shareholders.majority.length == 1) {
				var oldCash = parseInt(shareholders.majority[0].getOwner().cash);
				oldCash += parseInt(shareholders.majority[0].currentValue() * Constants.MAJORITY_BONUS);
				shareholders.majority[0].getOwner().cash = oldCash;
			}
			else {
				throw new Error("Something went horribly wrong - there are somehow no majority shareholders");
			}

			for (var i in shareholders.minority) {
				var oldCash = parseInt(shareholders.minority[i].getOwner().cash);
				oldCash += parseInt(shareholders.minority[i].currentValue() * Constants.MINORITY_BONUS / shareholders.minority.length);
				shareholders.minority[i].getOwner().cash = oldCash;
			}
		}	
	},
	
	// mergeStockCertificates: Array[Hotel], HotelName -> (nothing)
	// Handles stock certificate merging in mergers
	mergeStockCertificates: function(merginghotels, acquirerName) {
		// Deal with the stock certificates...
		for (var h in merginghotels) {
			if (merginghotels[h].getName() != acquirerName) {
				var shares = merginghotels[h].getStock();
				shares.sort(function(a, b) {
					return b.getCount() - a.getCount();
				});
				
				var shareholders = module.exports.calculateShareholders(shares);
				module.exports.distributeDividends(shareholders);
			}
		}
	},
	
	// mergeHotelTiles: Array[Hotel], Hotel, Board -> (nothing)
	// Merge the tiles associated with hotels in a merger.
	mergeHotelTiles: function(merginghotels, acquirer, board) {
		for (var h in merginghotels) {
			if (merginghotels[h].getTiles().length >= Constants.HOTEL_SAFETY_LENGTH) {
				throw new Error("Safe hotels cannot be involved in a merger");
			}
			if (merginghotels[h].getName() != acquirer.getName()) {
				if (merginghotels[h].getTiles().length > acquirer.getTiles().length) {
					throw new Error("A smaller hotel is trying to acquire a bigger hotel.");
				}
			}
		}
		for (var h in merginghotels) {
			if (merginghotels[h].getName() != acquirer.getName()) {
				acquirer.addTiles(merginghotels[h].getTiles());
				board.removeHotel(merginghotels[h]);
			}
		}
	},
	
	// [public] merging: Acquire, Tile, HotelName -> Board
	// Merge two or more hotels.
	merging: function(acquire, tile, acquirerName) {
	
		var board = acquire.getBoard();
	
		if (!board.hasHotelName(acquirerName)) {
			throw new Error("Acquirer is not an in-play hotel.");
		}
		
		var hotels = board.getHotels();
		var merginghotels = module.exports.getMergingHotels(hotels, tile);
		
		if (merginghotels.length < 2) {
			throw new Error("Merger does not have enough hotels");
		}
		
		var acquirer = board.getHotelByName(acquirerName);
		
		module.exports.mergeHotelTiles(merginghotels, acquirer, board);
		module.exports.mergeStockCertificates(merginghotels, acquirerName);
		
		acquirer.addTile(tile);
		acquire.getPlayers()[0].removeTile(tile);
		
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
			for (var t in tiles) {
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
	
	// [public] mergeInspection: Array[Hotel] -> String
	mergeInspection: function(adjacentHotels) {
		var xml = "<merging ";
		adjacentHotels.sort(function(a, b) {
			return b.getTiles().length - a.getTiles().length;
		});
		for (var a in adjacentHotels) {
			if (adjacentHotels[a].getTiles().length >= Constants.HOTEL_SAFTEY_LENGTH) {
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
			return module.exports.mergeInspection(adjacentHotels);
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
	}
};