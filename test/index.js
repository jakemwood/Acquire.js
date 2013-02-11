var assert = require("assert");
suite('Acquire', function() {

	var Acquire = require("../lib-cov/Acquire");
	var Player = require('../lib-cov/Player');
	var Hotel = require('../lib-cov/Hotel');
	var Stock = require('../lib-cov/Certificate');
	var Board = require('../lib-cov/Board');
	
	var game;
		
	setup(function() {
		game = new Acquire();
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
	});
	
	test('stock certificates', function() {
		var hotel = new Hotel('American');
		var owner = new Player('Jake');
		var share = new Stock(hotel, owner, 1);
		
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
	
	test('playing the game', function() {
		var p = game.newPlayer("Jake");
		
		assert.equal(game.getPlayers().length, 1);
		assert.equal(game.getPlayers()[0].getName(), "Jake");
		assert.equal(game.getPlayers()[0].tiles.length, 6); // a player should receive 6 random tiles...
		
		game.placeTile(p.tiles[0]);
		assert.equal(p.tiles.length, 5); // player has placed a tile, so they should now have 5...
		
		var p = new Player("James");
		assert.equal(p.tiles.length, 0);
		
		game.addPlayer(p);
	});
});