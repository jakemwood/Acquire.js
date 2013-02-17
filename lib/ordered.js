var Constants = require('../config/constants.js');
var xmlp = require('stablexml');
var parser = new xmlp();

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
				break;
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

var placeTileHelper = function(acquire, i) {
	console.log("PLACE TILE AT INDEX " + i);

	// Get the current player...
	var player = acquire.getPlayers()[0];
	
	// Sort their tiles...
	var tiles = acquire.sortTiles(player.tiles);
	
	console.log("Inspect tile: " + JSON.stringify(tiles[i]));
	var xml = acquire.inspectTile(tiles[i]);

	var parser = new xmlp();
	parser.parseXML(xml, function(err, results) {
		if (err)
			console.log("XML ERROR: " + err);
		else
			console.log(results);
		var hotelName;
		hotelName = acquire.getAvailableHotels()[0];
		if (results[0].merging) {
			hotelName = results[0].merging.$.acquirer;
		}
		else if (results[0].growing) {
			hotelName = results[0].growing.$.name;
		}
		
		try {
			// Place the first tile in the group...
			acquire.placeTile(tiles[i], hotelName);
			return;
		}
		catch (ex) {
			if (i + 1 >= player.tiles.length) {
				throw new Error("Exhausted all tile possibilities");
			}
			placeTileHelper(acquire, i + 1);
		}
	});
}

// placeTile: acquire -> (nothing)
// places a tile for the AI
var placeTile = function(acquire) {
	placeTileHelper(acquire, 0);
}

module.exports = {
	
	// makeMove: Acquire -> ???
	// Make a move based on an "ordered" strategy
	makeMove: function(acquire) {
		var tiles = acquire.sortTiles(acquire.getPlayers()[0].tiles);
		placeTile(acquire);
		buyShares(acquire);
		acquire.nextPlayer();
		return acquire.generateXML();
	}
}