var Constants = require('../config/constants.js');

// buyShares: hotels[] cash -> (nothing)
// buys the shares of the first available hotel shares in alphabetical order
var buyShares = function(acquire) {
	var hotels = firstHotel(acquire.getBoard().getHotels());
	var cash = acquire.getPlayers()[0].cash;
	var sharesBought = 0;
	for (var i in hotels) {
		while (hotels[i].sharesAvailable() > 0 && sharesBought < Constants.SHARES_PER_PLAY) {
			try {
				acquire.buyStock(hotels[i].getName());
				sharesBought++;
			}
			catch(x) {
				return;
			}
		}
	}
}

// firstHotel: hotels[] cash -> hotels[]
// returns the first hotel in play in alphabetical order
var firstHotel = function (currentHotels) {
	currentHotels.sort(function(a, b) {
		return a.getName().charCodeAt(0) - b.getName().charCodeAt(0);
	});
	return currentHotels;
}

function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

var placeTile = function(acquire) {

	// Get the current player...
	var player = acquire.getPlayers()[0];
	
	// Sort their tiles...
	var tiles = acquire.sortTiles(player.tiles);
	var hotels = acquire.getAvailableHotels();
	
	var tileIndex = getRandomInt(0, tiles.length - 1);
	var hotelIndex = getRandomInt(0, hotels.length);
	
	// Place the first tile in the group...
	acquire.placeTile(tiles[tileIndex], acquire.getAvailableHotels()[hotelIndex]);
}

module.exports = {
	
	// makeMove: Acquire -> ???
	// Make a move based on an "ordered" strategy
	makeMove: function(acquire) {
		var tiles = acquire.sortTiles(acquire.getPlayers()[0].tiles);
		placeTile(acquire);
		buyShares(acquire);
		return acquire.generateXML();
	}
}