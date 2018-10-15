'use strict';

function upperCaseFirst(string) {
	var strToUp = string.split(" ");
	for ( var i = 0; i < strToUp.length; i++ )
	{
		var j = strToUp[i].charAt(0).toUpperCase();
		strToUp[i] = j + strToUp[i].substr(1).toLowerCase();
	}
	return strToUp.join(" ");
}

module.exports = upperCaseFirst;