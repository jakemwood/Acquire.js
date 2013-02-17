/*******************************************************************************
**
**	A C Q U I R E . J S
**
** A Node.js implementation of the Acquire board game!  Woohoo!
**
** Common data types are defined in "Data Types.txt"
**
*******************************************************************************/

// Import some open source / node.js modules
// =============================================================================
var xmlp = require('stablexml');
var XMLParser = new xmlp();

var XMLTypes = require('./lib/XMLTypeChecker');
var Acquire = require('./lib/Acquire');
var Player = require('./lib/Player');
var RuleChecker = require('./lib/RuleChecker');
var Board = require('./lib/Board');
var Hotel = require('./lib/Hotel');

// ********** TODO : CLEAN UP THIS FUNCTION
// convertXMLBoardToBoard: BoardXML -> { board: Board, hotels: Array[Hotel] }
// Converts an XMLResults representation of a game board to a true Board object
function convertXMLBoardToBoard(xml) {

	// First, verify that our input is actually a BoardXML
	if (!XMLTypes.BoardXML(xml)) {
		throw new Error("Given xml is not a valid board");
	}
	
	// Create a new board.
	var b = new Board();
	var hotels = [];
	
	// Create the hotels...
	for (var i in xml._) {
		if (xml._[i].tile) {
			// adding a tile
			var tile = xml._[i].tile;
			if (!XMLTypes.TileXML(tile)) {
				throw new Error("Given XML contains an invalid tile");
			}
			// tile is now of type TileXML
			b.addTile({ row: tile.$.row, column: tile.$.column });
		}
		else if (xml._[i].hotel) {
			// adding a hotel
			var hotelxml = xml._[i].hotel;
			
			if (!XMLTypes.HotelXML(hotelxml)) {
				throw new Error("Given XML contains an invalid hotel");
			}
			// hotelxml is now of type HotelXML
			
			var hotelxml;
			var addHotel = true;
			if (b.hasHotelName(hotelxml.$.name)) {
				hotel = b.getHotelByName(hotelxml.$.name);
				addHotel = false;
			}
			else {
				hotel = new Hotel(hotelxml.$.name);
			}
			
			if (hotelxml._) {
				if (hotelxml._.length < 2) {
					throw new Error("Given XML contains an illegal hotel (it does not have enough tiles to be a hotel");
				}
			
				for (var t in hotelxml._) {
					var tile = hotelxml._[t].tile;
					if (!XMLTypes.TileXML(tile)) {
						throw new Error("Given XML contains an invalid tile within a hotel");
					}
					hotel.addTile({ row: tile.$.row, column: tile.$.column });
				}
			}
			
			if (addHotel) {
				hotels.push(hotel);
			}
		}
		else {
			throw new Error("Given XML is not a valid board");
		}
	}
	
	return {
		board: b,
		hotels: hotels
	};
}

// buildPlayer: PlayerXML Acquire -> { player: Player, shares: Array[Share] }
function buildPlayer(xml, acquire) {
	
	var p = new Player(xml.$.name);
	p.cash = xml.$.cash;
	
	var shares = [];
	
	for (var i in xml._) {
		if (xml._[i].share) {
			if (XMLTypes.ShareXML(xml._[i].share)) {
				shares.push( { Player: p,
							HotelName: xml._[i].share.$.name,
							Shares: xml._[i].share.$.count });			
			}
			else {
				throw new Error("Invalid share xml tag given");
			}
		}
		else if (xml._[i].tile) {
			if (XMLTypes.TileXML(xml._[i].tile)) {
				p.addTile({
					column: xml._[i].tile.$.column,
					row: xml._[i].tile.$.row
				});
			}
			else {
				throw new Error("Invalid tile xml tag given");
			}
		}
		else {
			throw new Error("Invalid player tag given");
		}
	}
	
	return {
		player: p,
		shares: shares
	};
}

// buildAcquireFromState: StateXML -> Acquire
// Convert a state XML to an Acquire object
function buildAcquireFromState(state) {

	var acquire = new Acquire();
	var boardhotel;
	var shares = [];
	for (var i in state._) {
		var node = state._[i];
		if (node.board) {
			// build the board...
			boardhotel = convertXMLBoardToBoard(node.board);
			acquire.setBoard(boardhotel.board);
		}
		else if (node.player) {
			// add a player...
			var p = buildPlayer(node.player, acquire);
			acquire.addPlayer(p.player);
			shares = shares.concat(p.shares);
		}
	}
	for (var h in boardhotel.hotels) {
		var hotel = boardhotel.hotels[h];
		for (var s in shares) {
			if (shares[s].HotelName == hotel.getName()) {
				acquire.addShare(shares[s].Player, hotel, shares[s].Shares);
			}
		}
		acquire.getBoard().addHotel(hotel);
	}
	return acquire;
}

// processXML: String | Null, XMLResults | Null -> (nothing)
// Process incoming XML from stdin
function processXML(xmlerr, purexml) {
	for (var i in purexml) {
		try {
			var xmlresults = purexml[i];
			if (xmlresults.setup) {
				if (XMLTypes.SetupXML(xmlresults.setup)) {
				
					var a = new Acquire();
					for (i in xmlresults.setup.$) {
						a.newPlayer(xmlresults.setup.$[i]);
					}
					
					console.log(a.generateXML());
				}
				else {
					console.log("<error msg=\"Given XML contains an invalid Setup tag\" />");
				}
			}
			else if (xmlresults.place) {
				if (XMLTypes.PlaceXML(xmlresults.place)) {
					var tile = {
						row: xmlresults.place.$.row,
						column: xmlresults.place.$.column
					};
					var acquire = buildAcquireFromState(xmlresults.place._[0].state);
					acquire.placeTile(tile, xmlresults.place.$.hotel);
					console.log(acquire.generateXML());
				}
				else {
					console.log('<error msg="Given XML contains an invalid Place tag" />');
				}
			}
			else if (xmlresults.buy) {
				if (XMLTypes.BuyXML(xmlresults.buy)) {
					var acquire = buildAcquireFromState(xmlresults.buy._[0].state);
					for (var i in xmlresults.buy.$) {
						acquire.buyStock(xmlresults.buy.$[i]);
					}
					console.log(acquire.generateXML());
				}
				else {
					console.log('<error msg="Given XML contains an invalid Buy tag" />');
				}
			}
			else if (xmlresults.done) {
				if (XMLTypes.DoneXML(xmlresults.done)) {
					var acquire = buildAcquireFromState(xmlresults.done._[0].state);
					acquire.nextPlayer();
					console.log(acquire.generateXML());
				}
				else {
					console.log('<error msg="Given XML contains an invalid Done tag" />');
				}
			}
			else {
				console.log("unrecognized aip call");
			}
		}
		catch (ex) {
			console.log('<error msg="' + ex + '" />');
		}
	}
}

// Start listening from stdin
process.stdin.resume();
process.stdin.setEncoding('UTF-8');

// Attach an event listener to stdin for "data" event
process.stdin.on('data', function(chunk) {
	// (anonymous): String -> (nothing)
	// Anonymous function called when data is received from stdin
	try {
		XMLParser.parseXML(chunk, processXML);
	}
	catch (ex) {
		if (ex.message.indexOf('<impossible') == 0) {
			console.log(ex.message);
		}
		else {
			console.log("<error msg=\"" + ex.message.replace(/\n/g, ', ') + "\" />");
		}
	}
});
