'use strict';
let _foreach = require('./_foreach');
let regionDefault = { //self.default.region
	province : [],
	city : [],
	districts : [],
	provinceName : [],
	cityName : [],
	districtsName : []
};

function regionExtract(dataRegion){
    console.log('_extractRegion')
	if(dataRegion){
		if(dataRegion.districts.length > 0 && dataRegion.province.length > 0 && dataRegion.city.length > 0){
			_foreach(dataRegion.province, function (val, key, obj){
				if(val.province_id){
					regionDefault.province.push(val);
					_foreach(dataRegion.city, function (val1, key1, obj1){
						if(val1.province_id == val.province_id){
							regionDefault.city.push(val1);
							_foreach(dataRegion.districts, function (val2, key2, obj2){
								if(val2.province_id == val1.province_id && val2.city_id == val1.city_id){
									regionDefault.districts.push(val2);
								}
							});
						}
					});
				}
			});
			if(regionDefault.province.length > 0){
				_foreach(regionDefault.province, function (v, k, o){
					if(v.province){
						regionDefault.provinceName.push(v.province.toLowerCase());
					}
				});
			}
			if(regionDefault.city.length > 0){
				_foreach(regionDefault.city, function (v, k, o){
					if(v.city_name){
						regionDefault.cityName.push(v.city_name.toLowerCase());
					}
				});
			}
			if(regionDefault.districts.length > 0){
				_foreach(regionDefault.districts, function (v, k, o){
					if(v.subdistrict_name){
						regionDefault.districtsName.push(v.subdistrict_name.toLowerCase());
					}
				});
			}
		}else{
		   console.log('err :: Region not define!'); 
		}
		return regionDefault;
	}
};

module.exports = regionExtract;