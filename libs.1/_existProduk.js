'use strict';

let _foreach = require('./_foreach');

function checkExistProduk(dataCheck,dataForcheck,_w){
    console.log('_existProduk '+_w)
	let tOf = false;
	if(_w.toLowerCase() == 'bukalapak'){
		if(dataCheck.marketPlace.id_produk){
			tOf = false;
			if(dataForcheck.length > 0){
				_foreach(dataForcheck, function (v1, k, obj) {
					if(v1.id_produk == dataCheck.marketPlace.id_produk){
						tOf = true;
					}
				});
			}
		}
	}
	return tOf;
};

module.exports = checkExistProduk;
