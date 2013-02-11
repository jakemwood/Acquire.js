/*
	{
		owner: Owner
		hotel: Hotel
		count: Number
	}
*/
// [Public] Hotel Player -> Certificate
module.exports = function(hotel, owner, count) {

	// Constants:
	var CONTINENTAL_TOWER_PRICING = { "41":1200, "31":1100, "21":1000, "11":900, "6":800, "5":700, "4":600, "3":500, "2":400};
	var FESTIVAL_IMPERIAL_AMERICAN_PRICING = { "41":1100, "31":1000, "21":900, "11":800, "6":700, "5":600, "4":500, "3":400, "2":300};
	var WORLDWIDE_SACKSON_PRICING = { "41":1000, "31":900, "21":800, "11":700, "6":600, "5":500, "4":400, "3":300, "2":200};
	
	if (count > 25) {
		throw new Error("This is too many shares for a hotel");
	}
	
	this.currentValue = function() {
		var existingStock = hotel.getTiles().length;
		if(hotel.getName() == "Worldwide" || hotel.getName() == "Sackson"){
			return iterateHotelPrices(WORLDWIDE_SACKSON_PRICING, existingStock);
		}
		else if(hotel.getName() == "Festival" || hotel.getName() ==	"Imperial" || hotel.getName() == "American"){
			return iterateHotelPrices(FESTIVAL_IMPERIAL_AMERICAN_PRICING, existingStock);
		}
		else if(hotel.getName() == "Continental" || hotel.getName() == "Tower"){
			return iterateHotelPrices(CONTINENTAL_TOWER_PRICING, existingStock);
		}
		throw new Error("Hotel name " + hotel.getName() + " not found.");
	}	
	
	var iterateHotelPrices = function(pricing, stockNum) {
		for(var i in pricing) {
				if(parseInt(i) <= stockNum){
					return pricing[i];
				}
			}
		throw new Error("Certificate has " + stockNum + " stock out. Can not computer a price.");
	}
	
	this.generateXML = function() {
		return '<share name="' + hotel.getName() + '" count="' + count + '" />\r\n';
	}
	
	this.getHotel = function() {
		return hotel;
	}
	
	this.getOwner = function() {
		return owner;
	}
	
	this.hasOwnerHotel = function(p_owner, p_hotel) {
		return (owner.name == p_owner.name &&
			hotel.getName() == p_hotel.getName());
	}
	
	this.getCount = function() {
		return count;
	}
	
	this.increaseCount = function() {
		count++;
	}
	
	this.setCount = function(c) {
		count = c;
	}
}