function rolemembershipModify(feature,UID){
	/* origin*/
	let parentUID = 'local:'+UID+'_ParentMember';
	let checkExist = false;
	let membershipData = '';
	let keymembership = 'local:membership';
	let categoryPayment = '';
	clientRedis.get(parentUID, function (error, result) {
		if (result) {
			console.log('GET '+parentUID+' -> exist');
			checkExist = true;
			membershipData = JSON.parse(result);
		}else{
			console.log('GET '+parentUID+' -> not exist');
		}
		if(checkExist == false){
			let dataIdentity  = self.allData.users[UID].identity;
			let membership_ = getDataByKey(dataIdentity,'membership');
			membershipData = {
				membership:membership_
			}
			clientRedis.set(parentUID, JSON.stringify(membershipData), redis.print);
			clientRedis.expireat(parentUID, parseInt((+new Date)/1000) + 86400);
			
			checkExist = false;
			clientRedis.get(keymembership, function (error, result) {
				if (result) {
					console.log('GET '+keymembership+' -> exist');
					checkExist = true;
					categoryPayment = JSON.parse(result);
				}else{
					console.log('GET '+keymembership+' -> not exist');
				}
				if(checkExist == false){
					let paymentDb = db.ref('payment/category/');
					paymentDb.once("value", function(snapshot) {
						let all_payment = snapshot.val();
						categoryPayment = getDataByKey(all_payment,'category');
						clientRedis.set(keymembership, JSON.stringify(categoryPayment), redis.print);
						clientRedis.expireat(keymembership, parseInt((+new Date)/1000) + 86400);

						let getDataAccess = getDataByKeyVal(categoryPayment,'name',membershipData.membership);
						if(getDataAccess){
							let hakAkses = getDataAccess.feature_list[feature].access;
							if(hakAkses=='true'){
								return 'unlimited';
							}else{
								return hakAkses;
							}
						}else{
							console.log('else');
							return false;
						}
					});
				}else{
					let getDataAccess = getDataByKeyVal(categoryPayment,'name',membershipData.membership);
					if(getDataAccess){
						let hakAkses = getDataAccess.feature_list[feature].access;
						if(hakAkses=='true'){
							return 'unlimited';
						}else{
							return hakAkses;
						}
					}else{
						console.log('else');
						return false;
					}
				}

			});
		}else{
			checkExist = false;
			clientRedis.get(keymembership, function (error, result) {
				if (result) {
					console.log('GET '+keymembership+' -> exist');
					checkExist = true;
					categoryPayment = JSON.parse(result);
				}else{
					console.log('GET '+keymembership+' -> not exist');
				}
				if(checkExist == false){
					let paymentDb = db.ref('payment/category/');
					paymentDb.once("value", function(snapshot) {
						let all_payment = snapshot.val();
						categoryPayment = getDataByKey(all_payment,'category');
						clientRedis.set(keymembership, JSON.stringify(categoryPayment), redis.print);
						clientRedis.expireat(keymembership, parseInt((+new Date)/1000) + 86400);

						let getDataAccess = getDataByKeyVal(categoryPayment,'name',membershipData.membership);
						if(getDataAccess){
							let hakAkses = getDataAccess.feature_list[feature].access;
							if(hakAkses=='true'){
								return 'unlimited';
							}else{
								return hakAkses;
							}
						}else{
							console.log('else');
							return false;
						}
					});
				}else{
					let getDataAccess = getDataByKeyVal(categoryPayment,'name',membershipData.membership);
					if(getDataAccess){
						let hakAkses = getDataAccess.feature_list[feature].access;
						if(hakAkses == 'true'){
							return 'unlimited';
						}else{
							return hakAkses;
						}
					}else{
						console.log('else');
						return false;
					}
				}
			});
		}
	});
};
function rolemembershipModifyNew(){
    /* new */
	let checkExist = false;
	let keymembership = 'local:membership';
	let categoryPayment = '';

	if(self.access){
		_foreach(self.allData.marketPlaceUser, function (v, k, o) {
			if(v.identity){
				self.access[k] = {};
				if(v.identity.membership){
					self.access[k] = {
						id:k,
						membership:v.identity.membership,
						access:{}
					};
				}
			}
		});
		if(self.access){
			clientRedis.get(keymembership, function (error, result) {
				if (result) {
					console.log('GET '+keymembership+' -> exist');
					checkExist = true;
					categoryPayment = JSON.parse(result);
				}else{
					console.log('GET '+keymembership+' -> not exist');
				}
				if(checkExist == false){
					paymentDb.once("value", function(snapshot) {
						let all_payment = snapshot.val();
						categoryPayment = getDataByKey(all_payment,'category');
						clientRedis.set(keymembership, JSON.stringify(categoryPayment), redis.print);
						clientRedis.expireat(keymembership, parseInt((+new Date)/1000) + 86400);

						_foreach(self.access, function (v, k, o) {
							if(v.membership){
								let getDataAccess = getDataByKeyVal(categoryPayment,'name',v.membership);
								if(getDataAccess){
									_foreach(getDataAccess.feature_list, function (v1, k1, o1) {
										if(v1){
											if(v1.access == true){
												self.access[k].access[k1] = 'unlimited';
											}else{
												self.access[k].access[k1] = v1.access;
											}
											
										}
									});
								}
							}
						});
					});
				}else{
					_foreach(self.access, function (v, k, o) {
						if(v.membership){
							let getDataAccess = getDataByKeyVal(categoryPayment,'name',v.membership);
							if(getDataAccess){
								_foreach(getDataAccess.feature_list, function (v1, k1, o1) {
									if(v1){
										if(v1.access == true){
											self.access[k].access[k1] = 'unlimited';
										}else{
											self.access[k].access[k1] = v1.access;
										}
										
									}
								});
							}
						}
					});
				}

			});
		}
    }
};