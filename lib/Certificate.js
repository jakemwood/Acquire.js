/*
	{
		owner: Owner
		hotel: Hotel
		count: Number
	}
*/
var Constants = require('../config/constants.js');

// [Public] Hotel Player -> Certificate
module.exports = function(hotel, owner, count) {
	
	if (count > Constants.SHARES_MAX) {
		throw new Error("This is too many shares for a hotel");
	}
	
	// [private] iterateHotelPrices: Array[Pricing] Number -> Number
	// Get the price for a share of the given hotel
	var iterateHotelPrices = function(pricing, stockNum) {
		for(var i in pricing) {
			var pricer = pricing[i];
			var price = Object.keys(pricer)[0];
			if(parseInt(price) <= parseInt(stockNum)){
				return parseInt(pricer[price]);
			}
		}
		throw new Error("Certificate has " + stockNum + " stock out. Can not computer a price.");
	}
	
	// [public] currentValue: (nothing) -> Number
	// Get the price of this share
	this.currentValue = function() {
		var existingStock = hotel.getTiles().length;
		if(hotel.getName() == "Worldwide" || hotel.getName() == "Sackson"){
			return iterateHotelPrices(Constants.WORLDWIDE_SACKSON_PRICING, existingStock);
		}
		else if(hotel.getName() == "Festival" || hotel.getName() ==	"Imperial" || hotel.getName() == "American"){
			var p = iterateHotelPrices(Constants.FESTIVAL_IMPERIAL_AMERICAN_PRICING, existingStock);
			return p;
		}
		else if(hotel.getName() == "Continental" || hotel.getName() == "Tower"){
			return iterateHotelPrices(Constants.CONTINENTAL_TOWER_PRICING, existingStock);
		}
		throw new Error("Hotel name " + hotel.getName() + " not found.");
	}	
	
	// [public] generateXML: (nothing) -> String
	// Generate an XML representation of this Certificate
	this.generateXML = function() {
		return '<share name="' + hotel.getName() + '" count="' + count + '" />\r\n';
	}
	
	// [public] getHotel: (nothing) -> Hotel
	// Return the hotel associated with this share
	this.getHotel = function() {
		return hotel;
	}
	
	// [public] getOwner: (nothing) -> Player
	// Return the owner associated with this share
	this.getOwner = function() {
		return owner;
	}
	
	// [public] hasOwnerHotel: Player, Hotel -> Boolean
	// Does this share associate with the given player and hotel?
	this.hasOwnerHotel = function(p_owner, p_hotel) {
		return (owner.name == p_owner.name &&
			hotel.getName() == p_hotel.getName());
	}
	
	// [public] getCount: (nothing) -> Number
	// Return the number of shares this certificate represents
	this.getCount = function() {
		return count;
	}
	
	// [public] increaseCount
	// Increase the number of shares this certificate represents by one
	this.increaseCount = function() {
		count++;
	}
	
	// [public] setCount: Number -> (nothing)
	// Set the number of shares this certificate represents
	this.setCount = function(c) {
		count = c;
	}
}