var Stock = require('./Certificate');
var RuleChecker = require('./RuleChecker');
var Constants = require('../config/constants.js');
module.exports = function(name) {

	this.cash = Constants.CASH; // Number
	this.name = name; // String
	this.tiles = []; // Array of Tile
	this.stock = []; // Array of Certificate
	
	// [public] generateXML: (nothing) -> String
	// Generate the XML for this Player
	this.generateXML = function() {
		var xml = '<player name="' + this.name + '" cash="' + this.cash + '">\r\n';
		
		this.stock.sort(function(a, b) {
			return a.getHotel().getName().charCodeAt(0) - b.getHotel().getName().charCodeAt(0);
		});
		for (var i in this.stock) {
			if (this.stock[i].getCount() > 0)
				xml += this.stock[i].generateXML();
		}
		
		this.tiles = RuleChecker.sortTiles(this.tiles);
		for (var i in this.tiles) {
			xml += '<tile column="' + this.tiles[i].column + '" row="' + this.tiles[i].row + '" />\r\n';
		}
		
		xml += '</player>\r\n';
		return xml;
	}
	
	// [public] addTile: Tile -> (nothing)
	// Add a tile to this players list of tiles
	this.addTile = function(tile) {
		if (this.hasTile(tile)) {
			throw new Error("Player already has this tile");
		}
		this.tiles.push(tile);
	}
	
	// [public] hasTile: Tile -> Boolean
	// Returns true if this player has the given tile...
	this.hasTile = function(tile) {
		for (var j in this.tiles) {
			if(tile.row == this.tiles[j].row && tile.column == this.tiles[j].column){
				return true;
			}
		}
		return false;
	}
	
	// [public] Tiles[] -> Boolean
	// Returns true if this player contains any of the given tiles
	this.hasTiles = function(tiles) {
		for (var i in tiles) {
			if (this.hasTile(tiles[i])) {
				return true;
			}
		}
		return false;
	}
	
	// [public] removeTile: Tile -> (nothing)
	// Removes the given tile from the player's list of tiles
	this.removeTile = function(tile) {
		for (var i in this.tiles) {
			if (this.tiles[i].row == tile.row && this.tiles[i].column == tile.column) {
				this.tiles.splice(i, 1);
			}
		}
	}
	
	// [public] addShare: Stock -> (nothing)
	// Add a share to our list of stock certificates
	this.addShare = function(certificate) {
		for (var s in this.stock) {
			if (this.stock[s].getHotel().getName() == certificate.getHotel().getName()) {
				return;
			}
		}
		this.stock.push(certificate);
	}
	
	// [public] getName: (nothing) -> String
	// Get this player's name
	this.getName = function() {
		return name;
	}
}