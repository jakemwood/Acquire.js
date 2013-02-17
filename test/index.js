var assert = require("assert");
suite('Acquire', function() {

	var Acquire = require("../lib-cov/Acquire");
	var Player = require('../lib-cov/Player');
	var Hotel = require('../lib-cov/Hotel');
	var Stock = require('../lib-cov/Certificate');
	var Board = require('../lib-cov/Board');
	var RuleChecker = require('../lib-cov/RuleChecker');
	
	var game;
		
	setup(function() {
		game = new Acquire();
	});
	
	test('player', function() {
		
		var p = new Player('Jim');
		
		p.addTile({ column: 1, row: 'A' });
		
		assert.equal(p.hasTiles([]), false);
		assert.equal(p.hasTiles([ { column: 1, row: 'A' } ]), true);
		
	});
	
	test('hotels', function() {
	
		assert.throws(function() {
			return new Hotel("Test");
		}, 'Not a valid hotel name: Test');
		
		var hotel = new Hotel("American");
		hotel.addTile({ row: "A", column: 1 });
		assert.deepEqual(hotel.getTiles(), [ { row: 'A', column: 1 } ]);
		
		hotel.addTiles([ { row: "A", column: 2 }, { row: "B", column: 2 } ]);
		assert.deepEqual(hotel.getTiles(), [
			{ row: 'A', column: 1 },
			{ row: 'A', column: 2 },
			{ row: 'B', column: 2 }
		]);
		
		assert.equal(hotel.hasTile({ row: 'A', column: 1 }), true);
		assert.equal(hotel.hasTile({ row: 'C', column: 1 }), false);
		
		assert.equal(hotel.getColor(), 'red');
		hotel = new Hotel('Continental');
		assert.equal(hotel.getColor(), 'blue');
		hotel = new Hotel('Festival');
		assert.equal(hotel.getColor(), 'green');
		hotel = new Hotel('Imperial');
		assert.equal(hotel.getColor(), 'yellow');
		hotel = new Hotel('Sackson');
		assert.equal(hotel.getColor(), 'purple');
		hotel = new Hotel('Tower');
		assert.equal(hotel.getColor(), 'brown');
		hotel = new Hotel('Worldwide');
		assert.equal(hotel.getColor(), 'orange');
	});
	
	test('board', function() {
		
		var board = new Board();
		assert.equal(board.hasAnyTiles([ { row: 'A', column: 1 } ]), false);
		assert.equal(board.hasTile({ row: 'A', column: 1 }), false);
		
		board.addTile({ row: 'A', column: 1 });
		assert.equal(board.hasTile({ row: 'A', column: 1 }), true);
		assert.equal(board.hasAnyTiles([ { row: 'A', column: 1 } ]), true);
		
		assert.throws(function() {
			board.addTile({ row: 'A', column: 1 });
		}, 'This tile already exists');
		
		assert.throws(function() {
			board.addTile({ row: 'Z', column: 27 });
		}, 'Outside of the board area');
		assert.throws(function() {
			board.addTile({ row: 'Z', column: 10 });
		}, 'Outside of the board area');
		
		board.addTile({ row: 'C', column: 1 });
		board.addTile({ row: 'B', column: 3 });
		
		assert.equal(board.generateXML(), '<board>\r\n<tile column="1" row="A" />\r\n<tile column="3" row="B" />\r\n<tile column="1" row="C" />\r\n</board>');
		
		game.setBoard(board);
		assert.deepEqual(game.getBoard(), board);
	});
	
	test('stock certificates', function() {
		var hotel = new Hotel('American');
		var owner = new Player('Jake');
		var share = new Stock(hotel, owner, 1);
		
		assert.equal(owner.generateXML(), '<player name="Jake" cash="6000">\r\n</player>\r\n');
		
		assert.deepEqual(share.getHotel(), hotel);
		assert.deepEqual(share.getOwner(), owner);
		assert.equal(share.getCount(), 1);
		assert.equal(share.hasOwnerHotel(owner, hotel), true);
		
		share.increaseCount();
		assert.equal(share.getCount(), 2);
		
		share.setCount(3);
		assert.equal(share.getCount(), 3);
		
		assert.equal(share.generateXML(), '<share name="American" count="3" />\r\n');
		
		assert.equal(hotel.getName(), "American");
		hotel.addTile({ row: "A", column: 1 });
		hotel.addTile({ row: "B", column: 2 });
		
		assert.equal(share.currentValue(), 300);
	});
	
	test('rule checker', function() {
		
		assert.deepEqual(RuleChecker.makeSurroundingFour({ row: 'A', column: 1 }), [
			{ row: 'B', column: 1 },
			{ row: 'A', column: 2 }
		]);
		assert.deepEqual(RuleChecker.makeSurroundingFour({ row: 'C', column: 3 }), [
			{ row: 'B', column: 3 },
			{ row: 'C', column: 2 },
			{ row: 'D', column: 3 },
			{ row: 'C', column: 4 }
		]);
		
		assert.deepEqual(RuleChecker.findConnectedTiles([
			{ row: 'B', column: 1 },
			{ row: 'B', column: 2 },
			{ row: 'C', column: 2 },
			{ row: 'D', column: 2 },
			{ row: 'D', column: 3 },
			{ row: 'F', column: 11 },
			{ row: 'F', column: 10 }
		], { row: 'B', column: 1 }), [
			{row:"B",column:1},
			{row:"D",column:3},
			{row:"D",column:2},
			{row:"C",column:2},
			{row:"B",column:2}
		]);
		
		assert.equal(RuleChecker.isDirectlyConnected({ row: 'A', column: 1 }, { row: 'B', column: 1 }), true);
		assert.equal(RuleChecker.isDirectlyConnected({ row: 'A', column: 1 }, { row: 'C', column: 1 }), false);
		
		var b = game.getBoard();
		
		// Board now has a singleton tile at A1
		
		var p = new Player('Jake');
		p.tiles = [
			{ row: 'A', column: 2 },
			{ row: 'B', column: 2 },
			{ row: 'B', column: 3 }];
		game.addPlayer(p);
		
		assert.equal(RuleChecker.inspect(b, { row: 'A', column: 1 }), '<singleton />');
		assert.deepEqual(RuleChecker.singleton(game, { row: 'A', column: 1 }).getTiles(), [ { row: 'A', column: 1 } ]);
		assert.deepEqual(b.getTiles(), [ { row: 'A', column: 1 } ]);
		
		assert.equal(RuleChecker.inspect(b, { row: 'A', column: 2 }), '<founding />');
		
		var american = RuleChecker.foundHotel(game, "American", { row: 'A', column: 2 })
		
		assert.equal(p.stock.length, 1);
		assert.equal(game.getPlayers()[0].stock.length, 1);
		
		// American is A1 and A2
		
		// Try to add Festival which will take A3 and A4
		var h = new Hotel('Festival');
		h.addTile({ row: 'A', column: 3 });
		h.addTile({ row: 'A', column: 4 });
		b = game.getBoard();
		assert.throws(function() {
			b.addHotel(h);
		}, 'This hotel will touch another hotel.');
		
		assert.equal(game.getBoard().getHotels()[0].getTiles().length, 2);
		assert.equal(RuleChecker.inspect(b, { row: 'B', column: 2 }), '<growing name="American" />');
		
		RuleChecker.growing(game, { row: 'B', column: 2 });
		assert.equal(american.hasTile({ row: 'B', column: 2 }), true);
		
		assert.throws(function() {
			RuleChecker.growing(game, { row: 'D', column: 5 });
		}, 'Cannot grow this hotel - given piece is not adjacent to an existing hotel');
		
		var james = game.newPlayer('James');
		james.tiles = [
			{ row: 'B', column: 4 },
			{ row: 'B', column: 5 },
			{ row: 'C', column: 5 },
			{ row: 'C', column: 6 },
			{ row: 'C', column: 7 }
		]
		
		// Switch to Jim
		game.nextPlayer();
		
		// Place 4B as a singleton...
		RuleChecker.singleton(game, { row: 'B', column: 4 });
		assert.equal(game.getBoard().hasTile({ row: 'B', column: 4 }), true);
		
		RuleChecker.foundHotel(game, "Continental", { row: 'B', column: 5 });
		assert.equal(game.getBoard().hasHotelName('Continental'), true);
		
		assert.deepEqual(game.getBoard().getHotelByName('Continental').getTiles(), 
			[{row:"B",column:4},{row:"B",column:5}]);
				
		assert.equal(RuleChecker.inspect(game.getBoard(), { row: 'B', column: 3 }), '<merging acquirer="American" acquired1="Continental"  />');
		
		RuleChecker.merging(game, { row: 'B', column: 3 }, "American");
		
		// American should now be the only hotel...
		assert.equal(game.getBoard().getHotels().length, 1);
		assert.equal(game.getBoard().getHotels()[0].getName(), "American");
		
		// Jim should have received $4,000 for successfully being acquired
		assert.equal(game.getPlayers()[0].cash, 10000);
	});
	
	test('playing the game', function() {
	
		// Acquire class is initialized on the setup
		
		// Add a player called "Jake"
		var p = game.newPlayer("Jake");
		assert.equal(game.getPlayers().length, 1);
		assert.equal(game.getPlayers()[0].getName(), "Jake");
		assert.equal(game.getPlayers()[0].tiles.length, 6); // a player should receive 6 random tiles...
		
		// Try placing their first tile...
		game.placeTile(p.tiles[0]);
		assert.equal(p.tiles.length, 5); // player has placed a tile, so they should now have 5...
		assert.equal(game.getBoard().getTiles().length, 1);
		
		// For testing: reset the tiles
		game.getBoard().tiles = [];
		game.getPlayers()[0].tiles = [];
		
		// Create a new player called James
		var p = new Player("James");
		assert.equal(p.tiles.length, 0);
		game.addPlayer(p);
		assert.equal(game.getPlayers().length, 2);
		
		// player tiles are randomized, so we're going to forcbily
		// override them for testing...
		p.tiles = [
			{ row: 'A', column: 1 },
			{ row: 'A', column: 2 },
			{ row: 'A', column: 3 },
			{ row: 'A', column: 4 },
			{ row: 'A', column: 5 }
		];
		assert.equal(p.tiles.length, 5);
		
		// Move from Jake to James as the current player...
		game.nextPlayer();
		
		// The first player should now be James...
		assert.equal(game.getPlayers()[0].getName(), "James");
		
		// Place A1 as a singleton...
		game.placeTile({ row: 'A', column: 1 });
		assert.equal(game.getBoard().getTiles().length, 2);
		assert.equal(game.getBoard().hasTile({ row: 'A', column: 1 }), true);
		
		// Place A2 to found American...
		game.placeTile({ row: 'A', column: 2 }, "American");
		
		// So the game should now have a hotel...
		assert.equal(game.getBoard().getHotels().length, 1);
		// ...and Jim should have stock...
		assert.equal(game.getPlayers()[0].stock.length, 1);
		// ...and the hotel should have stock...
		assert.equal(game.getBoard().getHotels()[0].getStock().length, 1);
		
		// Next player...
		game.nextPlayer();
		assert.equal(game.getPlayers()[0].getName(), "Jake");
		
		// Can Jake buy stock in American?
		game.buyStock('American');
		assert.equal(game.getPlayers()[0].stock.length, 1);
		assert.equal(game.getPlayers()[0].stock[0].getHotel().getName(), "American");
		assert.equal(game.getPlayers()[0].stock[0].getCount(), 1);
		assert.equal(game.getPlayers()[0].cash, 5700);
		assert.equal(game.getBoard().getHotels()[0].getStock().length, 2);
		
		assert.throws(function() {
			for (var x = 0; x < 26; x++) {
				game.buyStock('American');
			}
		}, 'Hotel has already allocated all its stock');
		
		
		// Adding a new player that already has A4.
		var sillyp = new Player("Megan");
		sillyp.addTile({ column: 4, row: 'A' });
		assert.throws(function() {
			game.addPlayer(sillyp);
		}, 'Another player already has this tile.');
		
		sillyp.removeTile({ column: 4, row: 'A' });
		sillyp.addTile({ column: 1, row: 'A' });
		
		// Go back to Jimbo...
		game.nextPlayer();
		
		// Place A4 onto the board as a singleton...
		game.placeTile({ row: 'A', column: 4 });
		sillyp.tiles = [ { column: 4, row: 'A' } ];
		assert.throws(function() {
			game.addPlayer(sillyp);
		}, 'Board already has this tile.');
		
		// Place A5 to found Continental...
		game.placeTile({ row: 'A', column: 5 }, "Continental");
		
		// Place A3 to merge them...
		game.placeTile({ row: 'A', column: 3 }, "Continental");
		
		// Jake should now have $3,000
		game.nextPlayer();
		assert.equal(game.getPlayers()[0].cash, 3000);

		game.getPlayers()[0].tiles.push({ row: 'B', column: 2 }); // CHEATER!
		game.placeTile({ row: 'B', column: 2 });
		assert.equal(game.getBoard().getHotels()[0].getTiles().length, 6);
		
		game.generateXML();
	});
});