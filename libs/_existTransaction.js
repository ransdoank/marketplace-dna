'use strict';

let _foreach = require('./_foreach');

function checkExistTransaction(dataCheck,dataForcheck,_w){
	let tOf = false;
	if(_w.toLowerCase() == 'bukalapak'){// && dataCheck.marketPlace.transaction_id != '130619117581'){
		if(dataCheck.marketPlace.transaction_id){
			tOf = false;
			if(dataForcheck.length > 0){
				_foreach(dataForcheck, function (v1, k, obj) {
					if(v1){
						if(v1.transaction_id == dataCheck.marketPlace.transaction_id && v1.id == dataCheck.marketPlace.id){
							tOf = true;
						}
					}
				});
			}
		}
	}
	return tOf;
};

module.exports = checkExistTransaction;
