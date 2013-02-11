var Stock = require('./Certificate');

module.exports = function(name) {

	this.cash = 6000; // Number
	this.name = name; // String
	this.tiles = []; // Array of Tile
	this.stock = []; // Array of Certificate
	
	this.generateXML = function(stock) {
		var xml = '<player name="' + this.name + '" cash="' + this.cash + '">\r\n';
		
		this.stock.sort(function(a, b) {
			return a.getHotel().getName().charCodeAt(0) - b.getHotel().getName().charCodeAt(0);
		});
		for (var i in this.stock) {
			xml += this.stock[i].generateXML();
		}
		
		for (var i in this.tiles) {
			xml += '<tile column="' + this.tiles[i].column + '" row="' + this.tiles[i].row + '" />\r\n';
		}
		
		xml += '</player>\r\n';
		return xml;
	}
	
	this.addTile = function(tile) {
		this.tiles.push(tile);
	}
	
	// [public] Tiles[] -> Boolean
	// Returns true if this player contains any of the given tiles
	this.hasTiles = function(tiles) {
		for (var i in tiles) {
			for (var j in this.tiles) {
				if(tiles[i].row == this.tiles[j].row && tiles[i].column == this.tiles[j].column){
					return true;
				}
			}
		}
		return false;
	}
	
	this.removeTile = function(tile) {
		for (var i in this.tiles) {
			if (this.tiles[i].row == tile.row && this.tiles[i].column == tile.column) {
				this.tiles.splice(i, 1);
			}
		}
	}
	
	this.addShare = function(certificate) {
		for (var s in this.stock) {
			if (this.stock[s].getHotel().getName() == certificate.getHotel().getName()) {
				return;
			}
		}
		this.stock.push(certificate);
	}
	
	this.getName = function() {
		return name;
	}
}