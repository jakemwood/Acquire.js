// Hotel
// =====
// This file creates a "Hotel" module which can be imported
// into other node.js scripts and instantiated.
//
// See "Data Types.txt" for common data types.
// 
// The constructor will throw an exception if the given hotel
// name is not an acceptable hotel name.
//
// Example of code that might appear in acquire.js:
//
//	var Hotel = require('./Hotel.js');
//  var american = new Hotel('American');
//  ...
// 
// Contract for Hotel constructor input:
// name : HotelName
module.exports = function(name) {

	// Array of Tile
	var locations = [];
	
	// Verify that this is a valid hotel name...
	if (name != 'American' &&
		name != 'Continental' &&
		name != 'Festival' &&
		name != 'Imperial' &&
		name != 'Sackson' &&
		name != 'Tower' &&
		name != 'Worldwide') {
		throw new Error('Not a valid hotel name:' + name);
	}
	
	// [public] getName: (nothing) -> String
	// Get the name of this hotel
	this.getName = function() {
		return name;
	}
	
	// [public] getColor: (nothing) -> Color
	// Returns the color associated with this hotel.
	this.getColor = function() {
		switch (name) {
			case 'American':
				return 'red';
			case 'Continental':
				return 'blue';
			case 'Festival':
				return 'green';
			case 'Imperial':
				return 'yellow';
			case 'Sackson':
				return 'purple';
			case 'Tower':
				return 'brown';
			case 'Worldwide':
				return 'orange';
		}
	}
	
	// [public] addTile: Tile -> (nothing)
	// Add a position for this hotel...
	this.addTile = function(tile) {
		locations.push(tile);
	}
	
	// [public] addTiles: Array[Tile] -> (nothing)
	// Add a list of tiles to this hotel
	this.addTiles = function(tiles) {
		for (var i in tiles) {
			this.addTile(tiles[i]);
		}
	}
	
	// [public] getTiles: (nothing) -> Array[Tile]
	// Get the files for this hotel
	this.getTiles = function() {
		return locations;
	}
	
	// [public] hasTile: Tile -> Boolean
	// Returns true if has Tile
	this.hasTile = function(tile) {
		for (var i in locations) {
			if (locations[i].row == tile.row && locations[i].column == tile.column) {
				return true;
			}
		}
		return false;
	}
	
	var stock = [];
	
	this.addOwner = function(share) {
		var shares = 0;
		for (var s in stock) {
			shares += parseInt(stock[s].getCount());
		}
		if (parseInt(shares) + parseInt(share.getCount()) > 25) {
			throw new Exception("Hotel has already distributed all its shares");
		}
		for (var s in stock) {
			if (stock[s].getOwner().getName() == share.getOwner().getName()) {
				stock[s].setCount(parseInt(stock[s].getCount()) + parseInt(share.getCount()));
				return;
			}
		}
		stock.push(share);
	}	
}