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
var xml2js = require('xml2js');
var parser = new xml2js.Parser();

// Import our various modules/classes
// =============================================================================
var Hotel = require('./Hotel.js');
var Board = require('./Board.js');

// Import our data checkers
// =============================================================================
var XMLTypes = require('./XMLTypeChecker.js');
var RuleChecker = require('./RuleChecker.js');

// Start listening from stdin
process.stdin.resume();
process.stdin.setEncoding('UTF-8');

// convertXMLBoardToBoard: BoardXML -> Board
// Converts an XMLResults representation of a game board to a true Board object
function convertXMLBoardToBoard(xml) {

	// First, verify that our input is actually a BoardXML
	if (!XMLTypes.BoardXML(xml)) {
		throw new Error("Given xml is not a valid board");
	}
	
	// Create a new board.
	var b = new Board();
	
	// Create the hotels...
	for (var i in xml.hotel) {
	
		var hotelxml = xml.hotel[i];
		if (!XMLTypes.HotelXML(hotelxml)) {
			throw new Error("Given XML contains an invalid hotel");
		}
		// hotelxml is now of type HotelXML
		
		var hotel = new Hotel(hotelxml.$.label);
		if (hotelxml.tile.length < 3) {
			throw new Error("Given XML contains an illegal hotel (it does not have enough tiles to be a hotel");
		}
		
		for (var t in hotelxml.tile) {
			var tile = hotelxml.tile[t];
			if (!XMLTypes.TileXML(tile)) {
				throw new Error("Given XML contains an invalid tile within a hotel");
			}
			// tile is now of type TileXML
			hotel.addTile({ row: tile.$.row, column: tile.$.column });
		}
		b.addHotel(hotel);
	}
	
	// Parse the available tiles...
	for (var i in xml.tile) {
	
		var tile = xml.tile[i];
		if (!XMLTypes.TileXML(tile)) {
			throw new Error("Given XML contains an invalid tile");
		}
		// tile is now of type TileXML
		
		b.addTile({ row: tile.$.row, column: tile.$.column });
	}
	
	return b;
}

// getTileFromXML: XMLResults -> Tile
// Converts an XMLResults representation of a tile to a true tile
function getTileFromXML(xml) {
	if (xml.$) {
		if (xml.$.row && xml.$.column) {
			if (xml.$.row >= 'A' && xml.$.row <= 'I' &&
				xml.$.column >= 1 && xml.$.column <= 12) {
				return {
					row: xml.$.row,
					column: xml.$.column
				}
			}
			else {
				throw new Error("Given XML tile is not in the bounds of the board");
			}
		}
		else {
			throw new Error("Not a valid XML object with 'row' and 'column' attributes");
		}
	}
	else {
		throw new Error("Not a valid XML object with 'row' and 'column' attributes");
	}
}

// processXML: String | Null, XMLResults | Null -> (nothing)
// Process incoming XML from stdin
function processXML(xmlerr, xmlresults) {
	// If there's an error, there's no point in continuing
	if (xmlerr) {
		throw xmlerr;
	}
	if (xmlresults.query) {
		// Inspect an element...
		inspect(convertXMLBoardToBoard(xmlresults.query.board[0]),
			getTileFromXML(xmlresults.query));
	}
	else if (xmlresults.singleton) {
		// Place a singleton tile...
		singleton(convertXMLBoardToBoard(xmlresults.singleton.board[0]),
			getTileFromXML(xmlresults.singleton));
	}
	else if (xmlresults.growing) {
		// Grow a hotel...
		growing(convertXMLBoardToBoard(xmlresults.growing.board[0]),
			getTileFromXML(xmlresults.growing));
	}
	else if (xmlresults.founding) {
		// Found a hotel...
		founding(convertXMLBoardToBoard(xmlresults.founding.board[0]), 
			getTileFromXML(xmlresults.founding),
			xmlresults.founding.$.label);
	}
	else if (xmlresults.merging) {
		// Merge a hotel...
		merging(convertXMLBoardToBoard(xmlresults.merging.board[0]), 
			getTileFromXML(xmlresults.merging),
			xmlresults.merging.$.label);
	}
	else {
		throw new Error("Unrecognized API call");
	}
}

// inspect: Board, Tile -> (nothing)
// Perform the actions needed to perform an "inspect" request
function inspect(board, tile) {
	console.log(RuleChecker.inspect(board, tile));
}

// singleton: Board, Tile -> (nothing)
// perform the actions needed to perform a "singleton" request
function singleton(board, tile) {
	RuleChecker.singleton(board, tile);
	console.log(board.generateXML());
}

// growing: Board, Tile -> (nothing)
function growing(board, tile) {
	RuleChecker.growing(board, tile);
	console.log(board.generateXML());
}

// founding: Board, Tile, HotelName -> (nothing)
function founding(board, tile, name) {
	RuleChecker.foundHotel(board, name, tile);
	console.log(board.generateXML());
}

// merging: Board, HotelName -> (nothing)
function merging(board, tile, name) {
	RuleChecker.merging(board, tile, name);
	console.log(board.generateXML());
}

// Attach an event listener to stdin for "data" event
process.stdin.on('data', function(chunk) {
	// (anonymous): String -> (nothing)
	// Anonymous function called when data is received from stdin
	try {
		parser.parseString(chunk, processXML);
	}
	catch (ex) {
		console.log("<error msg=\"" + ex.message.replace(/\n/g, ', ') + "\" />");
	}
});
