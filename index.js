'use strict';
let qs = require('querystring');

let express = require('express');
let https = require('https');
let http = require('http');
let request = require('request');
let path = require('path');
let fs = require('fs');

// ext module
let _existTransaction = require('./libs/_existTransaction');
let _foreach = require('./libs/_foreach');
let _replaceText = require('./libs/_replaceText');
let _upperCaseFirst = require('./libs/_upperCaseFirst');
let _extractRegion = require('./libs/_region');
let _saveOrder = require('./libs/_orderSave');
let _existProduk = require('./libs/_existProduk');


// let useragent = require('express-useragent');
// db
let admin = require('firebase-admin');
let serviceAccount = '';// require(__dirname +'/db/database-pos-firebase-adminsdk-kxrn0-be13a9eb0c.json');
let databaseURL = '';// https://database-pos.firebaseio.com devinvent-28bf9.firebase.com

let db = '';

// create redis
var redis = require('redis');
var clientRedis = redis.createClient(); // this creates a new clientRedis
// clientRedis = redis.createClient(port, host);
let self = {};
let redisOption = {
	key:'',
	key2:'',
	val:'',
	status:''
};
let timerGet = {
	timeC : 0,
	status : false,
	lData : 0
};
let timerGet1 = {
	timeC : 0,
	status : false,
	lData : 0
};
let timerGet2 = {
	timeC : 0,
	status : false,
	lData : 0
}
let PORT = 8000;
let regionDefault = { //self.default.region
	province : [],
	city : [],
	districts : [],
	provinceName : [],
	cityName : [],
	districtsName : []
};
// Express & Middleware
let app = express();
let bodyParser = require('body-parser');

app.use(bodyParser.json());

let options = {
	key: '',
	cert: '',
	ca: ''
};
let access_data = {
	key:'',
	met:''
};

let usersDataDb = '';
let allDataCustomer = '';
let localMap = '';
let paymentDb = '';

let dirReplace = ''; // set __dirname

exports._setOption = function(params){
	options.key = params.key;
	options.cert = params.cert;
	options.ca = params.ca;
	//console.log('_setOption');
};

exports._setDirname = function(a){
	dirReplace = a;
	//console.log('_setDirname');
};

exports._setRedisOption = function(b){
	redisOption.key = b.key;
	redisOption.key2 = b.key2;
	redisOption.val = b.val;
	redisOption.status = b.status;
  	//console.log('_setRedisOption');
};

exports._setDataBase = function(c){
	serviceAccount = require(c.serviceAcc);
	databaseURL = c.databaseURL;
  	//console.log('_setDataBase');
};

exports._setDataAccess = function(d){
	access_data.key = d.key;
	access_data.met = d.met;
  	//console.log('_setDataAccess');
};


let INDEX = path.join(dirReplace, '/index.html');

// SocketIO
let server = '';//https.createServer(options, app);
let io = '';//require('socket.io')(server);
let connections = [];
let botStatusServer = true;

//set active listener
exports._setactivePort = function(){
	//console.log('_setactivePort');
	// db setting
	admin.initializeApp({
		credential: admin.credential.cert(serviceAccount),
		databaseURL: databaseURL
	});

	db = admin.database();

	// let test = db.ref("api/checkBot/facebook");
	// self.testData = test;
	usersDataDb = db.ref('users');
	allDataCustomer = db.ref('customer');
	localMap = db.ref('localMap');
	paymentDb = db.ref('payment');

	// let testDelete = db.ref('users/MsaXytEmXDNMHhrcwnYpoPJ3Pdy1/order');
	// testDelete.set('');
	// redis
	clientRedis.on('connect', function() {
		//console.log('clientRedis connected');
	});

	clientRedis.on('error', function (err) {
		//console.log('clientRedis something went wrong ' + err);
	});

	server = https.createServer(options, app);
	io = require('socket.io')(server);
	
	server.listen(PORT, function(req,res){
		//console.log("listening @ port:",PORT);
	});

};

//GET Routes
app.use(express.static(dirReplace + '/public'));

app.get('/',function(req,res){
	// res.sendFile(INDEX);}
	viewDataCallbcak('marketplace-dna work',req,res);
});



function viewDataCallbcak(data,req,res){
	self.updateRedis = { call : false, status : ''};
	timerGet1.get = 1;
	timerGet1.status = true;
	setTimeout(function getData(){
		if(timerGet1.get > 0){
			if(timerGet1.status == true && self.updateRedis.call == false){
				updateRedistCron(self.allData);
				timerGet1.status = false;
				setTimeout(getData, 0);
			}else{
				setTimeout(getData, 0);
			}
		}else{
			res.send(data);
		}
	},0);
};

app.get('/marketPlaceJobsApi', function(req,res){
  let _paramsData = JSON.stringify(req.query);
  self._paramsData = JSON.parse(_paramsData);
  if(self._paramsData.pass && self._paramsData.met && self._paramsData.uri){
  	let dataAwal = {//qs.stringify({
  		pass: self._paramsData.pass,
  		met: self._paramsData.met
  	};//);
	//console.log('marketPlaceJobsApi :: ');
	  getData(req,res,'get',self._paramsData.uri,dataAwal,'allData');
	  
  }else{
	//console.log('err marketPlaceJobsApi :: ');
	self.redis = { key:redisOption.key, key2:redisOption.key2, val:redisOption.val, status:redisOption.status};
	self.access = {};
	viewDataCallbcak('marketplace-dna work',req,res);
  }
});

function getData(req,res,met,baseUrl,dataPost,where){
	if(met == 'get'){
		self.redis = { key:redisOption.key, key2:redisOption.key2, val:redisOption.val, status:redisOption.status};
		self.access = {};
		generateLocalMap();
		let checkExist = false;
		let dataTmpRedis = '';
		clientRedis.get(self.redis.key, function (error, result) {
			if (result) {
				//console.log('GET '+self.redis.key+' -> exist');
					dataTmpRedis = JSON.parse(result);
					checkExist = true;//false;//
					self.redis.status = 'update';
			}else{
				//console.log('GET '+self.redis.key+' -> not exist');
				self.redis.status = 'create';
			}
			if(checkExist == true){
				if(dataPost.pass == access_data.key && dataPost.met == access_data.met){
					//console.log('GET '+self.redis.key+' checkExist -> exist '+where);
					rolemembershipModify(dataTmpRedis.marketPlaceUser);
					routeCalback(req,res,dataTmpRedis,where);
				}else{
					//console.log('wrong access!');
					viewDataCallbcak('error',req,res);
				}
			}else{
				//console.log('GET '+self.redis.key+' checkExist -> not exist');
				if(dataPost.pass == access_data.key && dataPost.met == access_data.met){
					let tmp_dataMarket = {};
					let tmp_dataCustomer = {};
					let allDataUsers_tmp = {};
					let alldataCustomer = {};
					usersDataDb.once("value", function(snapshot) {
						//console.log('val data get users')
						allDataUsers_tmp = snapshot.val();
						_foreach(allDataUsers_tmp, function (v, k, obj) {
							if(v.marketplace){
								tmp_dataMarket[k] = v;
								if(!v.kategoriProduk){
									tmp_dataMarket[k]['kategoriProduk'] = {};
									allDataUsers_tmp[k]['kategoriProduk'] = {};
								}
								if(!v.produk){
									tmp_dataMarket[k]['produk'] = {};
									allDataUsers_tmp[k]['produk'] = {};
								}		
							}
						});

						allDataCustomer.once('value', function(snapshot){
							alldataCustomer = snapshot.val();
							tmp_dataCustomer = filter_customer(alldataCustomer);

							if(alldataCustomer && allDataUsers_tmp){
								let postData = {
									users : allDataUsers_tmp,
									customers : tmp_dataCustomer,
									marketPlaceUser : tmp_dataMarket
								};
								rolemembershipModify(tmp_dataMarket);//req,res);
								// res.send(postData);
								routeCalback(req,res,postData,where);
							}else{
								//console.log('wrong access!');
								viewDataCallbcak('error',req,res);
							}
						});
					});
				}else{
					//console.log('wrong access!');
					viewDataCallbcak('error',req,res);
				}

				// request.get({
				// 	headers: {'content-type': 'application/x-www-form-urlencoded'},
				// 	url: baseUrl+'?'+dataPost,
				// 	body: dataPost
				// }, function(error, response, body){
				// 	if(!error){
				// 		let _returns = response.body;
				// 		let feedback = {};
				// 		timerGet.timeC = 1;
				// 		timerGet.status = true;
				// 		setTimeout(function allData(){
				// 			if(timerGet.timeC > 0){
				// 				if(timerGet.status == true){
				// 					if(_returns){
				// 						feedback = JSON.parse(_returns);
				// 						timerGet.timeC = 0;
				// 						timerGet.timeC = false;
				// 					}else{
				// 						timerGet.timeC++;
				// 					}
				// 					setTimeout(allData,0);
				// 				}else{
				// 					setTimeout(allData,0);
				// 				}
				// 			}else{
				// 				//console.log('getData '+feedback.existdbRedistCron)
				// 				routeCalback(req,res,feedback.self_data,where);
				// 			}
				// 		},0);
				// 	}else{
				// 		//console.log('err getData -> '+where+' :: '+error);
				// 		viewDataCallbcak('error',req,res);
				// 	}
				// });
			}			
		});
	}
};

function routeCalback(req,res,feedback,where){
	if(where == 'allData'){
		if(feedback){
			self.allData = feedback;
			self.redis.val = feedback;
			// rolemembershipModify(req,res);
			// res.send(self);
			// return;
			generateAllDataMarket(req,res);
		}else{
			//console.log('err routeCalback allData')
			viewDataCallbcak('error',req,res);
		}
	}else{
		//console.log('error routeCalback')
		viewDataCallbcak('error',req,res);
	}
};

let callTime = {
	getProdukSale : false,
	getProdukNotSale : false,
	getTransaction : false,
	getTransactionSellerFailed : false,
	getTransactionSellerSuccess : false,
	getCustomerBL : false
};

function generateAllDataMarket(req,res){
	self.default = {// self.acc = {
		id : [],
		data : {}
	};
	self.getdata = {};

	if(self.allData){
		if(self.allData.marketPlaceUser){
			let data = self.allData.marketPlaceUser;
			_foreach(data, function (val, prop, obj) {
				if(val.marketplace){
					self.default.id.push(prop);
					self.default.data[prop] = {};

					if(val.identityBisnis){
						self.default.data[prop].brand = {};
						_foreach(val.identityBisnis, function (val1, prop1, obj1) {
							if(val1){
								self.default.data[prop][prop1] = {};
								_foreach(val1, function (val2, prop2, obj2) {
									if(val2.marketPlace){
										self.default.data[prop][prop1][prop2] = val2;
									}
								});	
							}
						});
					}else{
						//console.log('err :: tidak ada brand '+prop)
						self.default.data[prop].brand = {};
						_foreach(val.supplier, function (val1, prop1, obj1) {
							if(val1){
								_foreach(val1, function (val2, prop2, obj2) {
									if(val2){
										self.default.data[prop].brand[prop2] = val2;
									}
								});
							}
						});
					}

					if(val.produk){
						self.default.data[prop].produk = {}
						self.default.data[prop].produkList = [];
						let x = 0;
						_foreach(val.produk, function (val1, prop1, obj1) {
							if(val1){
								x++;
								if(val1.marketPlace){
									self.default.data[prop].produk[prop1] = val1;
									self.default.data[prop].produkList.push({
										id:prop1,
										data_detail:val1,
										id_produk:val1.marketPlace.id_produk
									});
								}
							}
						});
						if(x == 0 ){
							self.allData.users[prop].produk = {};
							self.allData.marketPlaceUser[prop].produk = {};
							//console.log('err :: tidak ada produk')
						}
					}

					if(val.kategoriProduk){
						self.default.data[prop].kategoriProduk = {};
						let tmpCheckExistKtg = [];
						_foreach(val.kategoriProduk, function (val1, prop1, obj1) {
							if(val1){
								self.default.data[prop].kategoriProduk[prop1] = val1;
								tmpCheckExistKtg.push({[prop1] : val1});
							}
						});
						if(tmpCheckExistKtg.length == 0){
							self.allData.users[prop].kategoriProduk = {};
							self.allData.marketPlaceUser[prop].kategoriProduk = {};
							//console.log('err :: tidak ada kategoriProduk')
						}
					}

					if(val.marketplace){
						_foreach(val.marketplace, function (val1, prop1, obj1) {
							if(val1){
								self.default.data[prop]['account'+prop1] = [];
								self.default.data[prop]['produkImport'+prop1] = [];
								self.default.data[prop]['transaksiImport'+prop1] = [];
								self.default.data[prop]['customerImport'+prop1] = [];
								_foreach(val1, function (val2, prop2, obj2) {
									if(prop2 == 'produkImport' || prop2 == 'transaksiImport' || prop2 == 'customerImport'){
										if(prop2 == 'produkImport'){
											_foreach(val2, function (val3, prop3, obj3) {
												if(val3){
													self.default.data[prop]['produkImport'+prop1].push(val3);
												}
											});
										}else if(prop2 == 'transaksiImport'){
											_foreach(val2, function (val3, prop3, obj3) {
												if(val3){
													self.default.data[prop]['transaksiImport'+prop1].push(val3);
												}
											});
										}else if(prop2 == 'customerImport'){
											_foreach(val2, function (val3, prop3, obj3) {
												if(val3){
													self.default.data[prop]['customerImport'+prop1].push(val3);
												}
											});
										}

									}else{
										self.default.data[prop]['account'+prop1].push(val2);
									}
								});
								
								if(self.default.data[prop]['account'+prop1].length == 0){
									self.default.data[prop]['account'+prop1] = [];
									self.allData.users[prop].marketplace[prop1] = {};
									self.allData.marketPlaceUser[prop].marketplace[prop1] = {};
									//console.log('err :: account '+prop1)
								}

								if(self.default.data[prop]['produkImport'+prop1].length == 0){
									self.default.data[prop]['produkImport'+prop1] = [];
									self.allData.users[prop].marketplace[prop1]['produkImport'] = {};
									self.allData.marketPlaceUser[prop].marketplace[prop1]['produkImport'] = {};
									//console.log('err :: produkImport '+prop1)
								}
								
								if(self.default.data[prop]['transaksiImport'+prop1].length == 0){
									self.default.data[prop]['transaksiImport'+prop1] = [];
									self.allData.users[prop].marketplace[prop1]['transaksiImport'] = {};
									self.allData.marketPlaceUser[prop].marketplace[prop1]['transaksiImport'] = {};
									//console.log('err :: transaksiImport '+prop1)
								}
								
								if(self.default.data[prop]['customerImport'+prop1].length == 0){
									self.default.data[prop]['customerImport'+prop1] = [];
									self.allData.users[prop].marketplace[prop1]['customerImport'] = {};
									self.allData.marketPlaceUser[prop].marketplace[prop1]['customerImport'] = {};
									//console.log('err :: customerImport '+prop1)
								}
							}
						});
					}
				}

			});

			if(self.default.id.length > 0){
				timerGet.timeC = 0;//self.default.id.length;//1;
				timerGet.status = true;
				timerGet.lData = 0;
				
				setTimeout(function allData(){
					if(self.default.id[timerGet.timeC]){

						let id = self.default.id[timerGet.timeC];
						callTime.getProdukSale = false;//true;//
						callTime.getProdukNotSale = false;//true;//
						callTime.getTransaction = false;

						if(self.default.data[id].accountbukalapak){

							if(self.default.data[id].accountbukalapak.length > 0){
							// ambil data per account
								timerGet.lData = 0;
								setTimeout(function getDataAccoun(){
									if(timerGet.lData < self.default.data[id].accountbukalapak.length){
										if(self.default.data[id].accountbukalapak[timerGet.lData]){
											//get data produk
											let dataTmpAcc = self.default.data[id].accountbukalapak[timerGet.lData];

											if(callTime.getProdukSale == false && callTime.getProdukNotSale == false && callTime.getTransaction == false){
												let dataAccBukalapak = true;
												self.getdata[dataTmpAcc.i] = {};
												setTimeout(function dataSale(){
													if(dataAccBukalapak == true){
														dataAccBukalapak = false;
														getProdukSaleNotsale(dataTmpAcc,'getProdukNotSale','bukalapak',id);
														setTimeout(dataSale,0);
													}else{
														if(callTime.getProdukNotSale == true){
															setTimeout(getDataAccoun,0);
														}else{
															setTimeout(dataSale,0);
														}
													}
												},0);
											}else if(callTime.getProdukSale == false && callTime.getProdukNotSale == true && callTime.getTransaction == false){
												let dataAccBukalapak1 = true;
												setTimeout(function dataSale(){
													if(dataAccBukalapak1 == true){
														dataAccBukalapak1 = false;
														getProdukSaleNotsale(dataTmpAcc,'getProdukSale','bukalapak',id);
														setTimeout(dataSale,0);
													}else{
														if(callTime.getProdukSale == true){
															setTimeout(getDataAccoun,0);
														}else{
															setTimeout(dataSale,0);
														}
													}
												},0);
											}else if(callTime.getProdukSale == true && callTime.getProdukNotSale == true && callTime.getTransaction == false){
												let dataAccBukalapak2 = true;
												// run transaaction only
												self.getdata[dataTmpAcc.i] = {};

												self.getdata[dataTmpAcc.i].getTransaction = {};
												setTimeout(function dataSale(){
													if(dataAccBukalapak2 == true){
														dataAccBukalapak2 = false;
														getTransactionSellerFailedSuccessCustomer(dataTmpAcc,'getTransaction','bukalapak',id);
														setTimeout(dataSale,0);
													}else{
														if(callTime.getTransaction == true){
															setTimeout(getDataAccoun,0);
														}else{
															setTimeout(dataSale,0);
														}
													}
												},0);
											}else if(callTime.getProdukSale == true && callTime.getProdukNotSale == true && callTime.getTransaction == true){
												timerGet.lData++;
												callTime.getProdukSale = false;//true;//
												callTime.getProdukNotSale = false;//true;//
												callTime.getTransaction = false;
												setTimeout(getDataAccoun,0);
											}
										}else{
											timerGet.lData++;
											setTimeout(getDataAccoun,0);
										}
									}else{
										timerGet.timeC++;
										setTimeout(allData,0);
									}
								},0);

							}else{
								timerGet.status = false;
								timerGet.timeC++;
								setTimeout(allData,0);
							}
						}else{
							timerGet.status = false;
							timerGet.timeC++;
							setTimeout(allData,0);
						}						
					}else{
						//console.log('finis all load');
						viewDataCallbcak(self,req,res);
					}
				},0);
			}else{
				//console.log('err :: data users marketPlaceUser '+self.default.id.length);
				viewDataCallbcak(self,req,res);
			}
		}else{
			//console.log('err :: self data marketPlaceUser 0')
			viewDataCallbcak('error',req,res);
		}
	}else{
		//console.log('err generateAllDataMarket')
		viewDataCallbcak('error',req,res);
	}
};

function getProdukSaleNotsale(dataTmpAcc,c,_w,UID){
	//console.log('ada call '+c);//,dataTmpAcc,_w,UID)
	// self.getdata[dataTmpAcc.i][c] = [];
	let allData = [];
	timerGet1.get = 1;
	timerGet1.status = true;
	setTimeout(function getData(){
		if(timerGet1.get > 0){
			if(timerGet1.status == true){
				let dataPost = {//qs.stringify({
					pass: self._paramsData.pass,
					met: self._paramsData.met,
					u : dataTmpAcc.i,
					p : dataTmpAcc.t,
					c : c,
					d : timerGet1.get,
					_w : _w
				};//);
				// //console.log('get_ '+_w+' '+c+' '+dataPost);
				// request.get({
				// 	headers: {'content-type': 'application/x-www-form-urlencoded'},
				// 	url: self._paramsData.uri+'2?'+dataPost,
				// 	body: dataPost
				// },
				// //console.log( self._paramsData.uri+'3')
				request.get({
					headers: {'content-type': 'application/json'},
					url: self._paramsData.uri+'3',
					json: { 'json' : dataPost },
					timeout:0
				}, function(error, response, body){
					if(!error && response.body){
						let _returns =  response.body;//JSON.parse(response.body);
						let feedback = [];
						if(_returns.status == true && _returns.data){
							// //console.log(_w+' '+_returns.data.length)
							if(_returns.data.length > 0){
								feedback = _replaceText(_returns.data);
							}

						}

						if(feedback.length > 0 && feedback.length <= 50){
							for (let i = 0; i < feedback.length; i++) {
								allData.push(feedback[i]);
							}

							timerGet1.status = true;
							timerGet1.get++;
						}else{
							timerGet1.status = false;
							timerGet1.get = 0;
						}
					}else{
						if(timerGet1.get == 2){
							//console.log('error call '+c+' '+_w+' : '+dataTmpAcc.i);
						}
						timerGet1.status = false;
						timerGet1.get = 0;
					}
				});
				timerGet1.status = false;
				setTimeout(getData, 0);
			}else{
				setTimeout(getData, 0);
			}
		}else{
			if(c == 'getProdukSale'){
				if(allData.length > 0){
					generateProduk('produk',dataTmpAcc.i,c,_w,allData,UID);
				}else{
					callTime.getProdukSale = true;
				}
			}
			if(c == 'getProdukNotSale'){
				if(allData.length > 0 ){
					generateProduk('produk',dataTmpAcc.i,c,_w,allData,UID);
				}else{
					callTime.getProdukNotSale = true;
				}
			}

		}
	},0);
};
function getTransactionSellerFailedSuccessCustomer(dataTmpAcc,c,_w,UID){
	self.getdata[dataTmpAcc.i][c].allTransaction = [];
	self.getdata[dataTmpAcc.i][c].pending = [];
	self.getdata[dataTmpAcc.i][c].addressed = [];
	self.getdata[dataTmpAcc.i][c].payment_chosen = [];
	self.getdata[dataTmpAcc.i][c].confirm_payment = [];
	self.getdata[dataTmpAcc.i][c].paid = [];
	self.getdata[dataTmpAcc.i][c].delivered = [];
	self.getdata[dataTmpAcc.i][c].received = [];
	self.getdata[dataTmpAcc.i][c].remitted = [];
	self.getdata[dataTmpAcc.i][c].rejected = [];
	self.getdata[dataTmpAcc.i][c].cancelled = [];
	self.getdata[dataTmpAcc.i][c].expired = [];
	self.getdata[dataTmpAcc.i][c].refunded = [];
	
	timerGet1.get = 1;
	timerGet1.status = true;
	setTimeout(function getData(){
		if(timerGet1.get > 0){
			if(timerGet1.status == true){

				let dataPost = {
					pass: self._paramsData.pass,
					met: self._paramsData.met,
					u : dataTmpAcc.i,
					p : dataTmpAcc.t,
					c : c,
					d : timerGet1.get,
					_w : _w
				};
				request.get({
					headers: {'content-type': 'application/json'},
					url: self._paramsData.uri+'3',
					json: { 'json' : dataPost }
				},
				function(error, response, body){
					if(!error && response.body){
						let _returns =  response.body;
						
						let feedback = [];
						if(_returns.status == true && _returns.data){
							if(_returns.data.length > 0){
								feedback = _replaceText(_returns.data);
							}
						}

						if(feedback.length > 0 && feedback.length <= 50){
							for (let i = 0; i < feedback.length; i++) {
								self.getdata[dataTmpAcc.i][c].allTransaction.push(feedback[i]);
								if(feedback[i].state){
									if(feedback[i].state == 'pending'){
										self.getdata[dataTmpAcc.i][c].pending.push(feedback[i]);
									}else if(feedback[i].state == 'addressed'){
										self.getdata[dataTmpAcc.i][c].addressed.push(feedback[i]);
									}else if(feedback[i].state == 'payment_chosen'){
										self.getdata[dataTmpAcc.i][c].payment_chosen.push(feedback[i]);
									}else if(feedback[i].state == 'confirm_payment'){
										self.getdata[dataTmpAcc.i][c].confirm_payment.push(feedback[i]);
									}else if(feedback[i].state == 'paid'){
										self.getdata[dataTmpAcc.i][c].paid.push(feedback[i]);
									}else if(feedback[i].state == 'delivered'){
										self.getdata[dataTmpAcc.i][c].delivered.push(feedback[i]);
									}else if(feedback[i].state == 'received'){
										self.getdata[dataTmpAcc.i][c].received.push(feedback[i]);
									}else if(feedback[i].state == 'remitted'){
										self.getdata[dataTmpAcc.i][c].remitted.push(feedback[i]);
									}else if(feedback[i].state == 'rejected'){
										self.getdata[dataTmpAcc.i][c].rejected.push(feedback[i]);
									}else if(feedback[i].state == 'cancelled'){
										self.getdata[dataTmpAcc.i][c].cancelled.push(feedback[i]);
									}else if(feedback[i].state == 'expired'){
										self.getdata[dataTmpAcc.i][c].expired.push(feedback[i]);
									}else if(feedback[i].state == 'refunded'){
										self.getdata[dataTmpAcc.i][c].refunded.push(feedback[i]);
									}
								}
							};

							timerGet1.status = true;
							timerGet1.get++;
						}else{
							timerGet1.status = false;
							timerGet1.get = 0;
						}
					}else{
						if(timerGet1.get == 2){
							//console.log('err :: '+c+' '+_w+' : '+dataTmpAcc.i);
						}
						timerGet1.status = false;
						timerGet1.get = 0;
					}
				});
				timerGet1.status = false;
				setTimeout(getData, 0);
			}else{
				setTimeout(getData, 0);
			}
		}else{
			if(c == 'getTransaction'){
				/** callTime.getTransaction = true;
				pemecahan customer, transaksi berhasil, transaksi gagal & produk;
				getTransactionSellerFailed
				getTransactionSellerSuccess
				getCustomerBL
				call extractor transaksion **/
				if(self.getdata[dataTmpAcc.i][c]){
					if(self.getdata[dataTmpAcc.i][c].allTransaction.length > 0){
						extractTransaction(dataTmpAcc,c,_w,UID);
					}else{
						callTime.getTransaction = true;
					}
				}else{
					callTime.getTransaction = true;
				}
			}
		}
	},0);
};

// generate data produk
function generateProduk(a,id,c,_w,allData,UID, dataHasilSeleksi,idMarket){
	//console.log('all data '+allData.length+' a '+a+' _w '+_w)
	let feedback = [];
	let brandGet = {
		idBrend : '',
		email : '',
		username : ''
	};
	let idsuplier = '';
	let jenis = '';
	let getProfile = true;
	let timeLokal = 0;
	let tOf = false;

	if(a == 'produk'){
		self.getdata[id][c] = [];
		self.getdata[id].dataBrand = [];
	}else if(a == 'transaksi'){
		// self.regulasiData.dataList = [];
		// allData = self.regulasiData.allData;
		self.getdata[id][c] = [];
		self.getdata[id].dataBrand = [];
	}

	if(self.default.data[UID].brand){
		_foreach(self.default.data[UID].brand, function (v, k, obj) {
			if(v.marketPlace){
				if(v.marketPlace.id == id && v.marketPlace.marketPlace == _w){
					getProfile = false;
					brandGet.idBrend = k;
					brandGet.email = v.marketPlace.email;
					brandGet.username = v.marketPlace.username;
					idsuplier = '';
					jenis = 'stok_sendiri';
					self.getdata[id].dataBrand.push({[k]:v});
				}
			}
		});
	}
	
	if(getProfile == false && allData.length > 0){
		timerGet1.get = 1;
		timerGet1.status = true;

		setTimeout(function prodDelay(){
			if(timerGet1.get > 0){
				if(timerGet1.status == true && timeLokal == 0){
					timeLokal++;
					timerGet1.status = false;
					let k = timerGet1.get-1;
					let v = allData[k];

					if(v){
						if(v.id){
							let jenisProduct = '';
							let grosir = '';
							let status = 'gudang';
							let varianData = [];
							let varianDataTmp = [];
							let desacVp = '';

							if(v.desc){
								desacVp = v.desc;
							}
							if(v.condition){
								if(v.condition.toLowerCase() == 'new'){
									jenisProduct = 'produk_baru';
								}else if(v.condition.toLowerCase() == 'used'){
									jenisProduct = 'produk_bekas';
								}
							}
							if(v.wholesale){
								if(v.wholesale.length > 0){
									grosir = [];
									let mxP = 1;
									for (let i = 0; i < v.wholesale.length; i++) {
										if(mxP <= 4){
											if(v.wholesale[i+1]){
												grosir.push({
													max: parseInt(v.wholesale[i+1].lower_bound) -1,
													min: parseInt(v.wholesale[i].lower_bound),
													harga: v.wholesale[i].price,
												});
												mxP++;
											}
										}
									}
								}
							}
							if(v.for_sale){
								status = "active";
							}
							if(v.product_sku){
								if(v.product_sku.length > 0 ){
									_foreach(v.product_sku, function (vPprodSku, kPprodSku, obj) {
										varianData.push({
											katalog: vPprodSku.images,
											sku: v.id.toUpperCase()+'-V'+kPprodSku+'-'+vPprodSku.sku_name,
											harga_beli: vPprodSku.price,
											harga_jual_normal: vPprodSku.price,
											harga_jual_reseller: vPprodSku.price,
											description: vPprodSku.variant_name,
											stok: [{
												date: new Date(),
												description: "stok awal",
												status: true,
												statusOrder: false,
												statusStok: "stok_tersedia",
												stokIn: vPprodSku.stock,
												stokOut: 0,
												updateID: UID,
											}]
										});
										varianDataTmp.push({
											sku_origin:vPprodSku.variant_name,
											sku_replace: v.id.toUpperCase()+'-V'+kPprodSku+'-'+vPprodSku.sku_name
										});
									});
								}else{
									varianData.push({
										katalog: v.images,
										sku: v.id.toUpperCase()+'-V'+k+'-'+0,
										harga_beli: v.price,
										harga_jual_normal: v.price,
										harga_jual_reseller: v.price,
										description: "",
										stok: [{
											date: new Date(),
											description: "stok awal",
											status: true,
											statusOrder: false,
											statusStok: "stok_tersedia",
											stokIn: v.stock,
											stokOut: 0,
											updateID: UID,
										}]
									});
									varianDataTmp.push({
										sku_origin:v.id,
										sku_replace: v.id.toUpperCase()+'-V'+k+'-'+0
									});
								}
							}
							if(varianData.length > 0){
								feedback.push({
									berat: v.weight,
									grosir: grosir,
									idBrend: brandGet.idBrend,
									idParentUser : UID,
									idStaffInput: UID,
									idsuplier: idsuplier,
									jenis: jenis,
									jenisProduct : jenisProduct,
									kategori: v.category,
									keterangan: desacVp,
									nama: v.name,
									status: status,
									diskon: 0,
									marketPlace:{
										idSeller:id,
										username:brandGet.username,
										email:brandGet.email,
										id_produk:v.id,
										varian:varianDataTmp,
										name: _w
									},
									diskonType: '',
									varian: varianData
								});
							}
						}
						timerGet1.get++;
					}else{
						//console.log('prod else set')
						timerGet1.get = 0;
					}
					setTimeout(prodDelay, 0);
				}else{
					if(allData[timerGet1.get-1]){
						if(timeLokal < 100){
							timeLokal++;
						}else{
							timerGet1.status = true;
							timeLokal = 0;
						}
					}else{
						timerGet1.get = 0;
					}
					
					setTimeout(prodDelay, 0);
				}
			}else{
				if(feedback.length > 0){
					if(a == 'produk'){
						//check produk exist on database
						_foreach(feedback, function (v, k, obj) {
							if(v.marketPlace.id_produk){
								tOf = _existProduk(v,self.default.data[UID]['produkImport'+_w],_w);//checkExistProduk
								if(tOf == false){
									self.getdata[id][c].push(v);
								}
							}
						});
						
						if(self.getdata[id][c].length > 0 ){
							//console.log('ada data baru '+id+' di '+_w+' loaded! '+c);
							if(c == 'getProdukSale'){
								checkKtg(self.getdata[id][c],a,UID,c,_w);
							}
							if(c == 'getProdukNotSale'){
								checkKtg(self.getdata[id][c],a,UID,c,_w);
							}
						}else{
							//console.log('Tidak ada data baru '+id+' di '+_w+' loaded! '+c);
							if(c == 'getProdukSale'){
								callTime.getProdukSale = true;
							}
							if(c == 'getProdukNotSale'){
								callTime.getProdukNotSale = true;
							}
						}
					}else if(a == 'transaksi'){
						// self.regulasiData.dataList = feedback;
						_foreach(feedback, function (v, k, obj) {
							if(v.marketPlace.id_produk){
								tOf = _existProduk(v,self.default.data[UID]['produkImport'+_w],_w);//checkExistProduk
								if(tOf == false){
									self.getdata[id][c].push(v);
								}
							}
						});
						if(self.getdata[id][c].length > 0 ){
							//console.log('ada data baru '+id+' di '+_w+' loaded! '+c);
							checkKtg(self.getdata[id][c],a,UID,c,_w, dataHasilSeleksi,idMarket);
						}else{
							//console.log('Tidak ada data baru '+id+' di '+_w+' loaded! '+c);
							checkKtg(self.getdata[id][c],a,UID,c,_w, dataHasilSeleksi,idMarket);
							// synceProdukMarketPlaceInvent(dataHasilSeleksi,UID,_w,idMarket);
						}
					}
				}else{
					if(a == 'produk'){
						//console.log(id+' tidak mempunyai data produk di '+_w+'!'+ a);
						if(c == 'getProdukSale'){
							callTime.getProdukSale = true;
						}
						if(c == 'getProdukNotSale'){
							callTime.getProdukNotSale = true;
						}
					}else if(a == 'transaksi'){
						//console.log(id+' tidak mempunyai data produk di '+_w+'!'+ a);
						checkKtg(self.getdata[id][c],a,UID,c,_w, dataHasilSeleksi,idMarket);
						// self.regulasiData.dataList = feedback;
					}
				}
			}
		},0);
	}else{
		//console.log('err get brand '+id);
		if(a == 'produk'){
			//console.log(id+' err ::  '+_w+'!'+ a);
			if(c == 'getProdukSale'){
				callTime.getProdukSale = true;
			}
			if(c == 'getProdukNotSale'){
				callTime.getProdukNotSale = true;
			}
		}else if(a == 'transaksi'){
			//console.log(id+' err ::  '+_w+'!'+ a);
			checkKtg(self.getdata[id][c],a,UID,c,_w, dataHasilSeleksi,idMarket);
		}
	}
};

// check kategori
function checkKtg(data,where,UID,c,_w, dataHasilSeleksi,idMarket){
	//console.log('checkKtg '+data.length+', condition '+c);
	let ktg = [];
	let ktgArr = [];
	let ktgUpload = [];
	let uniqueNames =  [];
	// let tmpCheckExistKtg = [];
	if(data.length > 0){
		_foreach(data, function (v, k, obj) {
			if(v.kategori){
				ktg.push(v.kategori);
			}
		});
	}

	ktg = unique_array(ktg);

	if(self.default.data[UID].kategoriProduk){
		_foreach(self.default.data[UID].kategoriProduk, function (v, k, obj) {
			if(v.kategori){
				ktgArr.push(v.kategori.toLowerCase());
				// tmpCheckExistKtg.push(v.kategori.toLowerCase());
			}
		});
	}

	ktgArr = unique_array(ktgArr);

	if(ktg.length > 0){
		for(var i = 0; i < ktg.length; i++){
			// if(ktgArr.length > 0){
			if(ktgArr.indexOf(ktg[i].toLowerCase()) === -1){
				ktgUpload.push({
					kategori: ktg[i]
				});
			}
		};
	}
	if(ktgUpload.length > 0 ){
		//console.log('ada ktg baru '+ktgUpload.length)
		// timerGet1.get = 1;
		// timerGet1.status = true;
		// let x = 0;
		let tmpPlus3 = true;
		let tmpLength3 = ktgUpload.length;
		let tmpIndex3 = 1;
		setTimeout(function getData(){
			if(tmpIndex3 > 0){
				if(tmpPlus3 == true && ktgUpload[tmpIndex3-1]){
					/*let dataConverUp = ktgUpload[timerGet1.get-1];//JSON.stringify(ktgUpload[timerGet1.get-1]);
					let dataPost = {
						pass: self._paramsData.pass,
						met: self._paramsData.met,
						u : UID,
						p : '',
						c : 'newKtg',
						d : dataConverUp,
						_w : 'importKategori'
					};
					request.get({
						headers: {'content-type': 'application/json'},
						url: self._paramsData.uri+'3',
						json: { 'json' : dataPost }
					},
					function(error, response, body){
						self.produkPost.kategori.push(dataConverUp);
						if(!error && response.body){
							let _returns =  response.body;
							x++;
							if(_returns.status == true && (timerGet1.get-1) < ktgUpload.length){
								self.default.data[UID].kategoriProduk[_returns.data] = ktgUpload[timerGet1.get-1];
								self.allData.users[UID].kategoriProduk[_returns.data] = ktgUpload[timerGet1.get-1];
								self.allData.marketPlaceUser[UID].kategoriProduk[_returns.data] = ktgUpload[timerGet1.get-1];
								timerGet1.status = true;
								timerGet1.get++;
							}else{
								if((timerGet1.get-1) < ktgUpload.length){
									timerGet1.status = true;
									timerGet1.get++;
								}else{
									timerGet1.status = false;
									timerGet1.get = 0;
								}
							}
						}else{
							timerGet1.status = false;
							timerGet1.get = 0;
						}
					});*/
					tmpPlus3 = false;
					let newKtglink = usersDataDb.child(UID+'/kategoriProduk');
					let tmpKtg = newKtglink.push();
					tmpKtg.set(ktgUpload[tmpIndex3-1]);
					tmpKtg.once("child_added").then(snapKtgNew => {
						self.produkPost.kategori.push(ktgUpload[tmpIndex3-1]);
						self.default.data[UID].kategoriProduk[tmpKtg.key] = ktgUpload[tmpIndex3-1];
						self.allData.users[UID].kategoriProduk[tmpKtg.key] = ktgUpload[tmpIndex3-1];
						self.allData.marketPlaceUser[UID].kategoriProduk[tmpKtg.key] = ktgUpload[tmpIndex3-1];
						// tmpPlus3 = true;
						// tmpIndex3++;
						if((tmpIndex3-1) < tmpLength3){
							tmpPlus3 = true;
							tmpIndex3++;
						}else{
							tmpPlus3 = false;
							tmpIndex3 = 0;
						}
					});
					setTimeout(getData, 0);
				}else{
					if(!ktgUpload[tmpIndex3-1]){
						tmpPlus3 = false;
						tmpIndex3 = 0;
						setTimeout(getData, 0);
					}else{
						setTimeout(getData, 0);
					}
				}
			}else{
				//console.log(ktgUpload.length+' kategori baru upload');
				if(c == 'transaksi'){
					saveContinue(data,where,UID,c,_w, dataHasilSeleksi,idMarket);
				}else{
					saveContinue(data,where,UID,c,_w);
				}
			}
		},0);
	}else{
		//console.log('tidak ada ktg baru')
		if(c == 'transaksi'){
			return	saveContinue(data,where,UID,c,_w, dataHasilSeleksi,idMarket);
		}else{
			saveContinue(data,where,UID,c,_w);
		}
	}
};


// function unique
function unique_array(arr) {
	// if (!Array.isArray(arr)) {
	//   throw new TypeError('array-unique expects an array.');
	// }
  
	var len = arr.length;
	var i = -1;
  
	while (i++ < len) {
	  var j = i + 1;
  
	  for (; j < arr.length; ++j) {
		if (arr[i] === arr[j]) {
		  arr.splice(j--, 1);
		}
	  }
	}
	return arr;
};

function updateRedistCron(data){
	let checkExist = false;
	if(self.redis){
		clientRedis.get(self.redis.key, function (error, result) {
			if (result) {
				//console.log('GET '+self.redis.key+' -> exist');
					// self.redis.val = JSON.parse(result);
					// self.allData = JSON.parse(result);
					checkExist = true;
			}else{
				//console.log('GET '+self.redis.key+' -> not exist');
			}
			if(checkExist == false){
				if(self.redis.status == 'create' && data){
					//console.log('create redis');
					clientRedis.set(self.redis.key, JSON.stringify(data), redis.print);//JSON.stringify(self.redis.val), redis.print);
					clientRedis.expireat(self.redis.key, parseInt((+new Date)/1000) + 86400);
					self.redis.status = 'update';
					self.redis.val = data;
				}
			}else{
				if(self.redis.status == 'update' && data){
					//console.log('update redis');
					clientRedis.set(self.redis.key, JSON.stringify(data), redis.print);
					clientRedis.expireat(self.redis.key, parseInt((+new Date)/1000) + 86400);
					self.redis.val = data;
				}
			}
		});
		timerGet1.get = 0;
	}else{
		timerGet1.get = 0;
	}
};

function saveContinue(data,where,UID,c,_w, dataHasilSeleksi,idMarket){
	if(data.length > 0){

		_foreach(data, function (v, k, obj) {
			if(v.kategori){
				if(self.default.data[UID].kategoriProduk){
					_foreach(self.default.data[UID].kategoriProduk, function (v1, k1, obj1) {
						if(v1.kategori.toLowerCase() == v.kategori.toLowerCase()){
							v.kategori = k1;
						}
					});
				}
			}
		});
		
		timerGet1.get = 1;
		timerGet1.status = true;
		let produkPostStatus = true;
		setTimeout(function getData(){
			if(timerGet1.get > 0){
				if(timerGet1.status == true && data[timerGet1.get-1]){
					produkPostStatus = _existProduk(data[timerGet1.get-1],self.default.data[UID]['produkImport'+_w],_w);
					if(produkPostStatus == false && (timerGet1.get-1) < data.length){
						timerGet1.status = false;
						// let dataConverUp = data[timerGet1.get-1];
						// let dataProduk = '';
						// if(self.allData.users[UID].produk){
						// 	dataProduk = self.allData.users[UID].produk;
						// }
						/*let dataPost = {
							pass: self._paramsData.pass,
							met: self._paramsData.met,
							u : UID,
							p : dataProduk,
							c : 'newProduk',
							d : dataConverUp,
							_w : 'import_produk',
							access : self.access[UID].access
						};
						request.get({
							headers: {'content-type': 'application/json'},
							url: self._paramsData.uri+'3',
							json: { 'json' : dataPost }
						}, function(error, response, body){
							if(!error && response.body){
								let _returns =  response.body;
								self.produkPost.produk.push(dataConverUp);
								if(_returns.status == true && (timerGet1.get-1) < data.length){
									if(_returns.updateProduk ){
										self.default.data[UID].produk[_returns.updateProduk] = data[timerGet1.get-1];
										self.allData.users[UID].produk[_returns.updateProduk] = data[timerGet1.get-1];
										self.allData.marketPlaceUser[UID].produk[_returns.updateProduk] = data[timerGet1.get-1];
										self.default.data[UID].produkList.push({
											id:_returns.updateProduk,
											data_detail:data[timerGet1.get-1],
											id_produk:data[timerGet1.get-1].marketPlace.id_produk
										});
									}
									if(_returns.updateMarket ){
										if(!self.allData.users[UID].marketplace[_w].produkImport){
											self.allData.users[UID].marketplace[_w].produkImport = {};
										}
										if(!self.allData.marketPlaceUser[UID].marketplace[_w].produkImport){
											self.allData.marketPlaceUser[UID].marketplace[_w].produkImport = {};
										}
										if(data[timerGet1.get-1].marketPlace){
											self.default.data[UID]['produkImport'+_w].push(data[timerGet1.get-1].marketPlace);
										}
										self.allData.users[UID].marketplace[_w].produkImport[_returns.updateMarket] = data[timerGet1.get-1].marketPlace;
										self.allData.marketPlaceUser[UID].marketplace[_w].produkImport[_returns.updateMarket] = data[timerGet1.get-1].marketPlace;
									}				
									timerGet1.status = true;
									timerGet1.get++;
								}else{
									if((timerGet1.get-1) < data.length){
										timerGet1.status = true;
										timerGet1.get++;
									}else{
										timerGet1.status = false;
										timerGet1.get = 0;
									}
								}
								y++;
							}else{
								timerGet1.status = false;
								timerGet1.get = 0;
							}
						});*/

						// check roles accses
						let dataProduk = '';
                        let access =  self.access[UID].access.Produk;
                        let access2 = self.access[UID].access.Promo;
                        let accessRole = false;
                        let countobj = 0;
                        let countobj2 = 0;
						let countLimit = 0;
						let existTableOrder = false;
						if(self.allData.users[UID].produk){
							dataProduk = self.allData.users[UID].produk;
							_foreach(dataProduk,function (v, k, o) {
								if(v.kategori){
									if(v.kategori == '-L123456-KategoriPromo'){
                                        countobj2++;
                                    }else{
                                        countobj++;
                                    }
								}
							});
							existTableOrder = true;
                        }else{
							self.allData.users[UID].produk = {};
						}

						if(data[timerGet1.get-1].kategori == '-L123456-KategoriPromo'){
                            countLimit = access2;
                            if((access2 > countobj2 && access2 != false) || access2 == "unlimited"){
                                accessRole = true;
                            }
                        }else{
                            countLimit = access;
                            if((access > countobj && access != false) || access == "unlimited"){
                                accessRole = true;
                            }
                        }

						// //console.log('produk save access : '+access+', access2 : '+access+', accessRole : '+accessRole+', countobj : '+countobj)
						if(accessRole == true){
							let newProdlink = usersDataDb.child(UID+'/produk');
							let tmpProd = newProdlink.push();
							tmpProd.set(data[timerGet1.get-1]);
							tmpProd.once("child_added").then(feedbackAdd0 => {
								self.produkPost.produk.push(data[timerGet1.get-1]);
								self.default.data[UID].produk[tmpProd.key] = data[timerGet1.get-1];
								self.allData.users[UID].produk[tmpProd.key] = data[timerGet1.get-1];
								self.allData.marketPlaceUser[UID].produk[tmpProd.key] = data[timerGet1.get-1];
								self.default.data[UID].produkList.push({
									id:tmpProd.key,
									data_detail:data[timerGet1.get-1],
									id_produk:data[timerGet1.get-1].marketPlace.id_produk
								});
								let newProdImportlink = usersDataDb.child(UID+'/marketplace/'+data[timerGet1.get-1].marketPlace.name+'/produkImport');
								let tmpProdImport = newProdImportlink.push();
								tmpProdImport.set(data[timerGet1.get-1].marketPlace);
								tmpProdImport.once("child_added").then(feedbackAdd1 => {
									if(!self.allData.users[UID].marketplace[_w].produkImport){
										self.allData.users[UID].marketplace[_w].produkImport = {};
									}
									if(!self.allData.marketPlaceUser[UID].marketplace[_w].produkImport){
										self.allData.marketPlaceUser[UID].marketplace[_w].produkImport = {};
									}
									if(data[timerGet1.get-1].marketPlace){
										self.default.data[UID]['produkImport'+_w].push(data[timerGet1.get-1].marketPlace);
									}
									self.allData.users[UID].marketplace[_w].produkImport[tmpProdImport.key] = data[timerGet1.get-1].marketPlace;
									self.allData.marketPlaceUser[UID].marketplace[_w].produkImport[tmpProdImport.key] = data[timerGet1.get-1].marketPlace;
									
									if((timerGet1.get-1) < data.length){
										timerGet1.status = true;
										timerGet1.get++;
									}else{
										timerGet1.status = false;
										timerGet1.get = 0;
									}
								});
							});
						}else{
							if((timerGet1.get-1) < data.length){
								timerGet1.status = true;
								timerGet1.get++;
							}else{
								timerGet1.status = false;
								timerGet1.get = 0;
							}
						}			
						// timerGet1.status = false;
					}else{
						timerGet1.get++;
						timerGet1.status = true;
						//console.log('id_produk exist')
					}
					setTimeout(getData, 0);
				}else{
					if(!data[timerGet1.get-1]){
						timerGet1.status = false;
						timerGet1.get = 0;
						setTimeout(getData, 0);
					}
					setTimeout(getData, 0);
				}
			}else{
				// saveContinue(data,where,UID,c);
				//console.log(data.length+' '+c+' baru uploaded -> ');
				if(c == 'getProdukSale'){
					callTime.getProdukSale = true;
				}
				if(c == 'getProdukNotSale'){
					callTime.getProdukNotSale = true;
				}
				if(c == 'transaksi'){
					//console.log('save continue---------------------------------------------'+c)
					synceProdukMarketPlaceInvent(dataHasilSeleksi,UID,_w,idMarket);
				}
			}
		},0);
	
	}else{
		if(c == 'getProdukSale'){
			callTime.getProdukSale = true;
		}
		if(c == 'getProdukNotSale'){
			callTime.getProdukNotSale = true;
		}
		if(c == 'transaksi'){
			//console.log('save continue---------------------------------------------'+c)
			synceProdukMarketPlaceInvent(dataHasilSeleksi,UID,_w,idMarket);
		}
	}
};

self.produkPost = {produk:[],kategori:[],transaksi:{}};

function extractTransaction(idMarket,c,_w,UID){
	let dataHasilSeleksi = [];
	let idGet = idMarket.i;
	// params
	let allTransaction = self.getdata[idGet][c].allTransaction;
	let pending = self.getdata[idGet][c].pending;
	let addressed = self.getdata[idGet][c].addressed;
	let payment_chosen = self.getdata[idGet][c].payment_chosen;
	let confirm_payment = self.getdata[idGet][c].confirm_payment;
	let paid = self.getdata[idGet][c].paid;
	let delivered = self.getdata[idGet][c].delivered;
	let received = self.getdata[idGet][c].received;
	let remitted = self.getdata[idGet][c].remitted;
	let rejected = self.getdata[idGet][c].rejected;
	let cancelled = self.getdata[idGet][c].cancelled;
	let expired = self.getdata[idGet][c].expired;
	let refunded = self.getdata[idGet][c].refunded;
	
	callTime.getTransactionSellerFailed = false;
	callTime.getTransactionSellerSuccess = false;
	callTime.getCustomerBL = false;

	self.getdata[idGet]['getTransactionSellerFailed'] = {valid:[],notValid:[]};//[];
	self.getdata[idGet]['getTransactionSellerSuccess'] = {valid:[],notValid:[]};
	self.getdata[idGet]['getTransactionBuyerFailed'] = {valid:[],notValid:[]};
	self.getdata[idGet]['getTransactionBuyerSuccess'] = {valid:[],notValid:[]};
	self.getdata[idGet]['getCustomerBL'] = [];

	let getTransactionSellerFailed = [];
	let getTransactionSellerSuccess = [];
	let getTransactionBuyerFailed = [];
	let getTransactionBuyerSuccess = [];
	let getCustomerBL = [];
	
	if(pending.length > 0){
		_foreach(pending, function (v, k, obj) {
			if(v){
				getTransactionSellerFailed.push(v);
			}
		});
	}
	if(addressed.length > 0){
		_foreach(addressed, function (v, k, obj) {
			if(v){
				// getTransactionSellerFailed.push(v);
			}
		});
	}
	if(payment_chosen.length > 0){
		_foreach(payment_chosen, function (v, k, obj) {
			if(v){
				getTransactionBuyerFailed.push(v);
			}
		});
	}
	if(confirm_payment.length > 0){
		_foreach(confirm_payment, function (v, k, obj) {
			if(v){
				getTransactionSellerFailed.push(v);
				getTransactionBuyerFailed.push(v);
				getCustomerBL.push(v);
			}
		});
	}
	if(paid.length > 0){
		_foreach(paid, function (v, k, obj) {
			if(v){
				getTransactionSellerSuccess.push(v);
				getTransactionBuyerSuccess.push(v);
				getCustomerBL.push(v);
			}
		});
	}
	if(delivered.length > 0){
		_foreach(delivered, function (v, k, obj) {
			if(v){
				getTransactionSellerSuccess.push(v);
				getTransactionBuyerSuccess.push(v);
				getCustomerBL.push(v);
			}
		});
	}
	if(received.length > 0){
		_foreach(received, function (v, k, obj) {
			if(v){
				getTransactionSellerSuccess.push(v);
				getTransactionBuyerSuccess.push(v);
				getCustomerBL.push(v);
			}
		});
	}
	if(remitted.length > 0){
		_foreach(remitted, function (v, k, obj) {
			if(v){
				getTransactionSellerSuccess.push(v);
				getTransactionBuyerSuccess.push(v);
				getCustomerBL.push(v);
			}
		});
	}
	if(rejected.length > 0){
		_foreach(rejected, function (v, k, obj) {
			if(v){
				getTransactionSellerFailed.push(v);
				getTransactionBuyerFailed.push(v);
				getCustomerBL.push(v);
			}
		});
	}
	if(cancelled.length > 0){
		_foreach(cancelled, function (v, k, obj) {
			if(v){
				getTransactionSellerFailed.push(v);
				getTransactionBuyerFailed.push(v);
				getCustomerBL.push(v);
			}
		});
	}
	if(expired.length > 0){
		_foreach(expired, function (v, k, obj) {
			if(v){
				getTransactionSellerFailed.push(v);
				getTransactionBuyerFailed.push(v);
				getCustomerBL.push(v);
			}
		});
	}
	if(refunded.length > 0){
		_foreach(refunded, function (v, k, obj) {
			if(v){
				getTransactionSellerFailed.push(v);
				getTransactionBuyerFailed.push(v);
				getCustomerBL.push(v);
			}
		});
	}

	// self.getdata[idGet]['getTransactionSellerFailed'] = getTransactionSellerFailed;
	// self.getdata[idGet]['getTransactionSellerSuccess'] = getTransactionSellerSuccess;
	// self.getdata[idGet]['getTransactionBuyerFailed'] = getTransactionBuyerFailed;
	self.getdata[idGet]['getTransactionBuyerSuccess'] = getTransactionBuyerSuccess;
	self.getdata[idGet]['getCustomerBL'] = getCustomerBL;

	
	
	if(getTransactionSellerFailed.length > 0){
		callTime.getTransactionSellerFailed = true;
	}
	if(getTransactionSellerSuccess.length > 0){
		callTime.getTransactionSellerSuccess = true;
	}
	if(getCustomerBL.length > 0){
		callTime.getCustomerBL = true;
	}


	timerGet2.get = 0;
	// all false
	if(callTime.getTransactionSellerFailed == false && callTime.getTransactionSellerSuccess == false && callTime.getCustomerBL == false){
		timerGet2.get = 0;
	}
	// all true
	if(callTime.getTransactionSellerFailed == true && callTime.getTransactionSellerSuccess == true && callTime.getCustomerBL == true){
		timerGet2.get = 3;
	}

	if(callTime.getTransactionSellerFailed == true && callTime.getTransactionSellerSuccess == false && callTime.getCustomerBL == false){
		// hanya getTransactionSellerFailed
		timerGet2.get = 1;
	}
	if(callTime.getTransactionSellerFailed == false && callTime.getTransactionSellerSuccess == true && callTime.getCustomerBL == false){
		// hanya getTransactionSellerSuccess
		timerGet2.get = 2;
	}
	if(callTime.getTransactionSellerFailed == false && callTime.getTransactionSellerSuccess == false && callTime.getCustomerBL == true){
		// hanya getCustomerBL
		timerGet2.get = 3;
	}

	if(timerGet2.get > 0 ){
		timerGet2.status = true;
		setTimeout(function pushTransaction(){
			if(timerGet2.status == true){
				timerGet2.status = false;
				if(timerGet2.get == 3){
					// execute getCustomerBL
					if(callTime.getCustomerBL == true){
						if(getCustomerBL.length > 0){
							dataHasilSeleksi = [];
							_foreach(getCustomerBL, function(v, k, o){
								dataHasilSeleksi.push({
									customer : {
										add:v.consignee.address,
										identity:{
											address:{
												city:{
													id:'',
													name:v.consignee.city
												},
												districts:{
													id:'',
													name:v.consignee.area
												},
												postalcode:v.consignee.post_code,
												province:{
													id:'',
													name:v.consignee.province
												},
												street:v.consignee.address
											},
											contact:{
												email:v.buyer.email,
												facebookName:'',
												instagram:'',
												lineID:'',
												phone:v.consignee.phone
											},
											alamat:v.consignee.address,
											namaToko:v.buyer.name,
											nama: v.buyer.name,
											phone:v.consignee.phone,
											date:new Date(),
											gender:'',
											idParentUser:UID,
											idStaffInput:UID,
											kategori:'Pelanggan',
											username:v.buyer.username,
											id:v.buyer.id
										},
										username:v.buyer.username,
										ktg:'Pelanggan',
										status: 'none'
									}
								});
							});

							self.produkPost.transaksi[idGet+'_cus'] = [];
							
							if(dataHasilSeleksi.length > 0){
								extractCustomerTransaction(dataHasilSeleksi,'getCustomerBL',UID,_w,idMarket);
							}else{
								timerGet2.get--;
								timerGet2.status = true;
							}
						}else{
							timerGet2.get--;
							timerGet2.status = true;
						}
						//console.log('done getCustomerBL');
					}else{
						timerGet2.get--;
						timerGet2.status = true;
					}
				}else if(timerGet2.get == 2){
					// execute getTransactionSellerSuccess
					if(callTime.getTransactionSellerSuccess == true){
						if(getTransactionSellerSuccess.length > 0){
							dataHasilSeleksi = [];
							_foreach(getTransactionSellerSuccess, function (v, k, obj) {
								if(v){
									let pemesanan = {};
									if(v.amount_details.length > 0){
										pemesanan = {
											asuransi: 0,
											biayaLain: {
												key: '',
												val: 0,
											},
											diskon: {
												key:'',
												money:0,
												percent:0
											},
											grandTotal:0,
											jumlahBarang:0,
											jumlahBobot:0,
											jumlahItem:0,
											ongkir:0,
											subTotal:0,
											tglOrder:{
												date:v.created_at,
												tmpDate:'' 
											}
										};
										_foreach(v.amount_details, function (v1, k1, obj1) {
											if(v1.name == 'Harga Total Belanja'){
												if(v1.amount){
													pemesanan.subTotal = v1.amount
												}
											}else if(v1.name == 'Biaya Kurir'){
												if(v1.amount){
													pemesanan.ongkir = v1.amount
												}
											}else if(v1.name == 'Biaya Asuransi'){
												if(v1.amount){
													pemesanan.asuransi = v1.amount
												}
											}else if(v1.name == 'Kode Pembayaran'){
												if(v1.amount){
													if(pemesanan.biayaLain.val){
														pemesanan.biayaLain.val = pemesanan.biayaLain.val + v1.amount;
														pemesanan.biayaLain.key = pemesanan.biayaLain.key+' & '+v1.name;
													}else{
														pemesanan.biayaLain.val = v1.amount;
														pemesanan.biayaLain.key = v1.name;
													}
												}
											}else if(v1.name == 'Biaya Administrasi'){
												if(v1.amount){
													if(pemesanan.biayaLain.val){
														pemesanan.biayaLain.val = pemesanan.biayaLain.val + v1.amount;
														pemesanan.biayaLain.key = pemesanan.biayaLain.key+' & '+v1.name;
													}else{
														pemesanan.biayaLain.val = v1.amount;
														pemesanan.biayaLain.key = v1.name;
													}
												}
											}else if(v1.name == 'Tip untuk Pelapak'){
												if(v1.amount){
													if(pemesanan.biayaLain.val){
														pemesanan.biayaLain.val = pemesanan.biayaLain.val + v1.amount;
														pemesanan.biayaLain.key = pemesanan.biayaLain.key+' & '+v1.name;
													}else{
														pemesanan.biayaLain.val = v1.amount;
														pemesanan.biayaLain.key = v1.name;
													}
												}
											}else if(v1.name == 'Diskon Metode Pembayaran'){
												let diskTmp = 0;
												if(v1.amount < 0){
													diskTmp = 0 - parseInt(v1.amount);
												}else{
													diskTmp = v1.amount;
												}
												if(diskTmp){
													if(pemesanan.diskon.money){
														pemesanan.diskon.key = 'rp';
														let disTmp = parseInt(pemesanan.diskon.money)+parseInt(diskTmp);
														pemesanan.diskon.money = disTmp;
														pemesanan.diskon.percent = (parseInt(disTmp) / parseInt(pemesanan.subTotal)) * 100;
													}else{
														pemesanan.diskon.key = 'rp';
														pemesanan.diskon.money = diskTmp,
														pemesanan.diskon.percent = (parseInt(diskTmp) / parseInt(pemesanan.subTotal)) * 100;
													}
												}
											}else if(v1.name == 'Potongan Voucher'){
												let diskTmp = 0;
												if(v1.amount < 0){
													diskTmp = 0 - parseInt(v1.amount);
												}else{
													diskTmp = v1.amount;
												}
												if(diskTmp){
													if(pemesanan.diskon.money){
														pemesanan.diskon.key = 'rp';
														let disTmp = parseInt(pemesanan.diskon.money)+parseInt(diskTmp);
														pemesanan.diskon.money = disTmp;
														pemesanan.diskon.percent = (parseInt(disTmp) / parseInt(pemesanan.subTotal)) * 100;
													}else{
														pemesanan.diskon.key = 'rp';
														pemesanan.diskon.money = diskTmp,
														pemesanan.diskon.percent = (parseInt(diskTmp) / parseInt(pemesanan.subTotal)) * 100;
													}
												}
											}else if(v1.name == 'Potongan Ongkir Pembeli Prioritas'){
												let diskTmp = 0;
												if(v1.amount < 0){
													diskTmp = 0 - parseInt(v1.amount);
												}else{
													diskTmp = v1.amount;
												}
												if(diskTmp){
													if(pemesanan.diskon.money){
														pemesanan.diskon.key = 'rp';
														let disTmp = parseInt(pemesanan.diskon.money)+parseInt(diskTmp);
														pemesanan.diskon.money = disTmp;
														pemesanan.diskon.percent = (parseInt(disTmp) / parseInt(pemesanan.subTotal)) * 100;
													}else{
														pemesanan.diskon.key = 'rp';
														pemesanan.diskon.money = diskTmp,
														pemesanan.diskon.percent = (parseInt(diskTmp) / parseInt(pemesanan.subTotal)) * 100;
													}
												}
											}else if(v1.name == 'Total Pembayaran'){
												let dmpTmp = (pemesanan.subTotal + pemesanan.asuransi + pemesanan.biayaLain.val +pemesanan.ongkir)-(pemesanan.diskon.money);
												if(v1.amount == dmpTmp){
													pemesanan.grandTotal = v1.amount;
												}else{
													pemesanan.grandTotal = dmpTmp;
												}
											}
										});
									}
									if(pemesanan.grandTotal && v.seller.id == idGet){
										let dmpTot = (pemesanan.subTotal + pemesanan.asuransi + pemesanan.biayaLain.val +pemesanan.ongkir)-(pemesanan.diskon.money);
										
										dataHasilSeleksi.push({
											status :{
												bayar:'',
												lacak:'',
												orderVia:'Website',
												produk:'',
												proses:'',
												resi:''
											},
											ongkir:{
												addAsal:'',
												addTujuan:'',
												asal:'',
												berat:'',
												description:'',
												estimasi:'',
												harga:'',
												name_jasa:'',
												paket_jasa:'',
												resi:'',
												statusOngkir:'',
												tujuan:''
											},
											loyalty:{
												point:0
											},
											note: v.buyer_notes,
											total:{
												pemesanan : pemesanan,
												pembayaran : [{
													bankAccount:{
														idBank:'',
														namaBank:'',
														namaCabang:'',
														name:'Virtual account '+_w.toLowerCase(),
														noAkun:''
													},
													bayarVia:'bank',
													cashBack:0,
													idStaffInput:UID,
													sisaBayar:0,
													statusBayar:'',
													tglBayar:{
														date:new Date(v.state_changes.paid_at),
														tmpDate:''
													},
													totalBayar:v.payment_amount
												}],
												orderVia:{
													account:'http://www.'+_w.toLowerCase()+'.com/u/'+v.buyer.username,
													link:'Website'
												}
											},
											originOther:{
												paymentMethod : v.payment_method,
												paymentName : v.payment_method_name,
												paymentDate : v.state_changes.paid_at,
												paymentAmount : v.payment_amount,
												paymentRemit : v.remit_amount,
												paymentRefount : v.refund_amount,
					
												ship : v.courier,
												shipService : v.shipping_service,
												shipping_code : v.shipping_code,
												shipping_history : v.shipping_history,
												shipping_fee : v.shipping_fee,
												shipChoice : v.buyer_logistic_choice,
												shipDelivered : (v.state_changes.delivered_at || ''),
												shipReceived : (v.state_changes.received_at || ''),
												shipBobot: v.total_weight,
					
												created : v.created_at,
												virtual : v.virtual,
												note : v.buyer_notes,
												created_on : v.created_on,
												tagihan : dmpTot,
												status : v.state
											},
											customer : {
												add:v.consignee.address,
												identity:{
													address:{
														city:{
															id:'',
															name:v.consignee.city
														},
														districts:{
															id:'',
															name:v.consignee.area
														},
														postalcode:v.consignee.post_code,
														province:{
															id:'',
															name:v.consignee.province
														},
														street:v.consignee.address
													},
													contact:{
														email:v.buyer.email,
														facebookName:'',
														instagram:'',
														lineID:'',
														phone:v.consignee.phone
													},
													alamat:v.consignee.address,
													namaToko:v.buyer.name,
													nama: v.buyer.name,
													phone:v.consignee.phone,
													date:new Date(),
													gender:'',
													idParentUser:UID,
													idStaffInput:UID,
													kategori:'Pelanggan',
													username:v.buyer.username,
													id:v.buyer.id
												},
												username:v.buyer.username,
												ktg:'Pelanggan',
												status: 'none'
											},
											supplier : v.seller,
											produk : v.products,
											marketPlace:{
												url:'https://www.bukalapak.com/payment/transactions/'+v.id,
												id:v.id,
												invoice:v.invoice,
												transaction_id:v.transaction_id
											},
					
										});
									}
								}
							});
							//console.log(getTransactionSellerSuccess.length+' getTransactionSellerSuccess data dataHasilSeleksi '+dataHasilSeleksi.length);
							if(dataHasilSeleksi.length > 0){
								let dataNotValidOrValid = {
									valid:[],
									notValid:[]
								};
								
								_foreach(dataHasilSeleksi, function (v, k, obj) {
									if(v){
										if(v.produk.length > 0){
											_foreach(v.produk, function (vProd, kProd, obj1){
												if(vProd.id){
													let cSama = false;
													if(self.default.data[UID].produkList.length > 0){
														_foreach(self.default.data[UID].produkList, function (vLp, kLp, obj2){
															if(vLp.id_produk == vProd.id){
																cSama = true;
																dataNotValidOrValid.valid.push(vProd);
															}
														});
													}
													if(cSama == false){
														dataNotValidOrValid.notValid.push(vProd);
													}
												}
											});
										}
									}
								});

								self.produkPost.transaksi[idGet+'_orderCus'] = [];
								
								self.getdata[idGet]['getTransactionSellerSuccess'] = dataNotValidOrValid;
								generateProdukTransaction(dataNotValidOrValid,dataHasilSeleksi,UID,_w,idMarket);
							}else{
								//console.log('else getTransactionSellerSuccess')
								// callTime.getTransaction = true;
								timerGet2.get--;
								timerGet2.status = true;
							}
						}else{
							timerGet2.get--;
							timerGet2.status = true;
						}
						//console.log('done getTransactionSellerSuccess');
					}else{
						timerGet2.get--;
						timerGet2.status = true;
					}
				}else if(timerGet2.get == 1){
					// execute getTransactionSellerFailed
					if(callTime.getTransactionSellerFailed == true){
						if(getTransactionSellerFailed.length > 0){
							dataHasilSeleksi = [];
							_foreach(getTransactionSellerFailed, function (v, k, obj) {
								if(v){
									let pemesanan = {};
									if(v.amount_details.length > 0){
										pemesanan = {
											asuransi: 0,
											biayaLain: {
												key: '',
												val: 0,
											},
											diskon: {
												key:'',
												money:0,
												percent:0
											},
											grandTotal:0,
											jumlahBarang:0,
											jumlahBobot:0,
											jumlahItem:0,
											ongkir:0,
											subTotal:0,
											tglOrder:{
												date:v.created_at,
												tmpDate:'' 
											}
										};
										_foreach(v.amount_details, function (v1, k1, obj1) {
											if(v1.name == 'Harga Total Belanja'){
												if(v1.amount){
													pemesanan.subTotal = v1.amount
												}
											}else if(v1.name == 'Biaya Kurir'){
												if(v1.amount){
													pemesanan.ongkir = v1.amount
												}
											}else if(v1.name == 'Biaya Asuransi'){
												if(v1.amount){
													pemesanan.asuransi = v1.amount
												}
											}else if(v1.name == 'Kode Pembayaran'){
												if(v1.amount){
													if(pemesanan.biayaLain.val){
														pemesanan.biayaLain.val = pemesanan.biayaLain.val + v1.amount;
														pemesanan.biayaLain.key = pemesanan.biayaLain.key+' & '+v1.name;
													}else{
														pemesanan.biayaLain.val = v1.amount;
														pemesanan.biayaLain.key = v1.name;
													}
												}
											}else if(v1.name == 'Biaya Administrasi'){
												if(v1.amount){
													if(pemesanan.biayaLain.val){
														pemesanan.biayaLain.val = pemesanan.biayaLain.val + v1.amount;
														pemesanan.biayaLain.key = pemesanan.biayaLain.key+' & '+v1.name;
													}else{
														pemesanan.biayaLain.val = v1.amount;
														pemesanan.biayaLain.key = v1.name;
													}
												}
											}else if(v1.name == 'Tip untuk Pelapak'){
												if(v1.amount){
													if(pemesanan.biayaLain.val){
														pemesanan.biayaLain.val = pemesanan.biayaLain.val + v1.amount;
														pemesanan.biayaLain.key = pemesanan.biayaLain.key+' & '+v1.name;
													}else{
														pemesanan.biayaLain.val = v1.amount;
														pemesanan.biayaLain.key = v1.name;
													}
												}
											}else if(v1.name == 'Diskon Metode Pembayaran'){
												let diskTmp = 0;
												if(v1.amount < 0){
													diskTmp = 0 - parseInt(v1.amount);
												}else{
													diskTmp = v1.amount;
												}
												if(diskTmp){
													if(pemesanan.diskon.money){
														pemesanan.diskon.key = 'rp';
														let disTmp = parseInt(pemesanan.diskon.money)+parseInt(diskTmp);
														pemesanan.diskon.money = disTmp;
														pemesanan.diskon.percent = (parseInt(disTmp) / parseInt(pemesanan.subTotal)) * 100;
													}else{
														pemesanan.diskon.key = 'rp';
														pemesanan.diskon.money = diskTmp,
														pemesanan.diskon.percent = (parseInt(diskTmp) / parseInt(pemesanan.subTotal)) * 100;
													}
												}
											}else if(v1.name == 'Potongan Voucher'){
												let diskTmp = 0;
												if(v1.amount < 0){
													diskTmp = 0 - parseInt(v1.amount);
												}else{
													diskTmp = v1.amount;
												}
												if(diskTmp){
													if(pemesanan.diskon.money){
														pemesanan.diskon.key = 'rp';
														let disTmp = parseInt(pemesanan.diskon.money)+parseInt(diskTmp);
														pemesanan.diskon.money = disTmp;
														pemesanan.diskon.percent = (parseInt(disTmp) / parseInt(pemesanan.subTotal)) * 100;
													}else{
														pemesanan.diskon.key = 'rp';
														pemesanan.diskon.money = diskTmp,
														pemesanan.diskon.percent = (parseInt(diskTmp) / parseInt(pemesanan.subTotal)) * 100;
													}
												}
											}else if(v1.name == 'Potongan Ongkir Pembeli Prioritas'){
												let diskTmp = 0;
												if(v1.amount < 0){
													diskTmp = 0 - parseInt(v1.amount);
												}else{
													diskTmp = v1.amount;
												}
												if(diskTmp){
													if(pemesanan.diskon.money){
														pemesanan.diskon.key = 'rp';
														let disTmp = parseInt(pemesanan.diskon.money)+parseInt(diskTmp);
														pemesanan.diskon.money = disTmp;
														pemesanan.diskon.percent = (parseInt(disTmp) / parseInt(pemesanan.subTotal)) * 100;
													}else{
														pemesanan.diskon.key = 'rp';
														pemesanan.diskon.money = diskTmp,
														pemesanan.diskon.percent = (parseInt(diskTmp) / parseInt(pemesanan.subTotal)) * 100;
													}
												}
											}else if(v1.name == 'Total Pembayaran'){
												let dmpTmp = (pemesanan.subTotal + pemesanan.asuransi + pemesanan.biayaLain.val +pemesanan.ongkir)-(pemesanan.diskon.money);
												if(v1.amount == dmpTmp){
													pemesanan.grandTotal = v1.amount;
												}else{
													pemesanan.grandTotal = dmpTmp;
												}
											}
										});
									}
									if(pemesanan.grandTotal && v.seller.id == idGet){
										let dmpTot = (pemesanan.subTotal + pemesanan.asuransi + pemesanan.biayaLain.val +pemesanan.ongkir)-(pemesanan.diskon.money);
										
										dataHasilSeleksi.push({
											status :{
												bayar:'',
												lacak:'',
												orderVia:'Website',
												produk:'',
												proses:'',
												resi:''
											},
											ongkir:{
												addAsal:'',
												addTujuan:'',
												asal:'',
												berat:'',
												description:'',
												estimasi:'',
												harga:'',
												name_jasa:'',
												paket_jasa:'',
												resi:'',
												statusOngkir:'',
												tujuan:''
											},
											loyalty:{
												point:0
											},
											note: v.buyer_notes,
											total:{
												pemesanan : pemesanan,
												pembayaran : [{
													bankAccount:{
														idBank:'',
														namaBank:'',
														namaCabang:'',
														name:'Virtual account '+_w.toLowerCase(),
														noAkun:''
													},
													bayarVia:'bank',
													cashBack:0,
													idStaffInput:UID,
													sisaBayar:0,
													statusBayar:'',
													tglBayar:{
														date:new Date(v.state_changes.paid_at),
														tmpDate:''
													},
													totalBayar:v.payment_amount
												}],
												orderVia:{
													account:'http://www.'+_w.toLowerCase()+'.com/u/'+v.buyer.username,
													link:'Website'
												}
											},
											originOther:{
												paymentMethod : v.payment_method,
												paymentName : v.payment_method_name,
												paymentDate : v.state_changes.paid_at,
												paymentAmount : v.payment_amount,
												paymentRemit : v.remit_amount,
												paymentRefount : v.refund_amount,

												ship : v.courier,
												shipService : v.shipping_service,
												shipping_code : v.shipping_code,
												shipping_history : v.shipping_history,
												shipping_fee : v.shipping_fee,
												shipChoice : v.buyer_logistic_choice,
												shipDelivered : (v.state_changes.delivered_at || ''),
												shipReceived : (v.state_changes.received_at || ''),
												shipBobot: v.total_weight,

												created : v.created_at,
												virtual : v.virtual,
												note : v.buyer_notes,
												created_on : v.created_on,
												tagihan : dmpTot,
												status : v.state
											},
											customer : {
												add:v.consignee.address,
												identity:{
													address:{
														city:{
															id:'',
															name:v.consignee.city
														},
														districts:{
															id:'',
															name:v.consignee.area
														},
														postalcode:v.consignee.post_code,
														province:{
															id:'',
															name:v.consignee.province
														},
														street:v.consignee.address
													},
													contact:{
														email:v.buyer.email,
														facebookName:'',
														instagram:'',
														lineID:'',
														phone:v.consignee.phone
													},
													alamat:v.consignee.address,
													namaToko:v.buyer.name,
													nama: v.buyer.name,
													phone:v.consignee.phone,
													date:new Date(),
													gender:'',
													idParentUser:UID,
													idStaffInput:UID,
													kategori:'Pelanggan',
													username:v.buyer.username,
													id:v.buyer.id
												},
												username:v.buyer.username,
												ktg:'Pelanggan',
												status: 'none'
											},
											supplier : v.seller,
											produk : v.products,
											marketPlace:{
												url:'https://www.bukalapak.com/payment/transactions/'+v.id,
												id:v.id,
												invoice:v.invoice,
												transaction_id:v.transaction_id
											},

										});
									}
								}
							});
							//console.log(getTransactionSellerFailed.length+' getTransactionSellerFailed data dataHasilSeleksi '+dataHasilSeleksi.length);
							if(dataHasilSeleksi.length > 0){
								let dataNotValidOrValid = {
									valid:[],
									notValid:[]
								};
								
								_foreach(dataHasilSeleksi, function (v, k, obj) {
									if(v){
										if(v.produk.length > 0){
											_foreach(v.produk, function (vProd, kProd, obj1){
												if(vProd.id){
													let cSama = false;
													if(self.default.data[UID].produkList.length > 0){
														_foreach(self.default.data[UID].produkList, function (vLp, kLp, obj2){
															if(vLp.id_produk == vProd.id){
																cSama = true;
																dataNotValidOrValid.valid.push(vProd);
															}
														});
													}
													if(cSama == false){
														dataNotValidOrValid.notValid.push(vProd);
													}
												}
											});
										}
									}
								});

								self.produkPost.transaksi[idGet+'_orderCus'] = [];

								self.getdata[idGet]['getTransactionSellerFailed'] = dataNotValidOrValid;
								generateProdukTransaction(dataNotValidOrValid,dataHasilSeleksi,UID,_w,idMarket);
							}else{
								//console.log('else getTransactionSellerFailed')
								// callTime.getTransaction = true;
								timerGet2.get--;
								timerGet2.status = true;
							}
						}else{
							timerGet2.get--;
							timerGet2.status = true;
						}
						//console.log('done getTransactionSellerFailed');
					}else{
						timerGet2.get--;
						timerGet2.status = true;
					}
				}else{
					// done
					timerGet2.status = false;
					//console.log('done load');
					// callTime.getTransaction = true;
				}
				setTimeout(pushTransaction,0);
			}else{
				if(timerGet2.get > 0 && timerGet2.status == false){
					setTimeout(pushTransaction,0);
				}else{
					//console.log('finish load');
					callTime.getTransaction = true;
					// setTimeout(pushTransaction,0);
				}
			}
		},0);
	}else{
		//console.log('tidak ada ',timerGet2.get);
		callTime.getTransaction = true;
	}	
	//console.log('timerGet2 ',timerGet2)
	
	// if(getTransactionBuyerFailed.length > 0){
	// 	// callTime.getTransaction = true;
	// }
	// if(getTransactionBuyerSuccess.length > 0){
	// 	// callTime.getTransaction = true;
	// }
	// if(getCustomerBL.length > 0){
	// 	// callTime.getTransaction = true;
	// }
};

function generateProdukTransaction(dataNotValidOrValid,dataHasilSeleksi,UID,_w,idMarket){
	let idGet = idMarket.i;
	//console.log('generateProdukTransaction')
	// self.regulasiData.allData = [];
	let allData = [];
	// self.regulasiData.dataList = [];
	let dataList = [];
	if(dataNotValidOrValid.notValid.length > 0){
		//console.log('ada data not valid '+dataNotValidOrValid.notValid.length)
		// return;
		// self.regulasiData.allData = dataNotValidOrValid.notValid;
		allData = dataNotValidOrValid.notValid;
		// self.generateProduk('transaksi');
		generateProduk('transaksi',idGet,'transaksi',_w,allData,UID, dataHasilSeleksi,idMarket);
		// let cXY = 0;
		// setTimeout(function waitLData(){
		// 	// if(self.regulasiData.dataList.length > 0){
		// 	if(feed == 'selesaiUploadProduk'){//}.length > 0){
		// 		//console.log('waitdata push transaksi '+feed+', count :: '+cXY)
		// 		// timerGet1.get = 1;
		// 		// timerGet1.status = true;
		// 		// setTimeout(function autoPutProduk(){
		// 		// 	if(timerGet1.get > 0){
		// 		// 		if(timerGet1.status == true){
		// 		// 			// self.checkKtg(self.regulasiData.dataList,'transaksi');
		// 		// 			checkKtg(dataList,'transaksi',UID,'transaksi',_w);
		// 		// 			timerGet1.status = false;
		// 		// 			timerGet1.get++;
		// 		// 			setTimeout(autoPutProduk, 0);
		// 		// 		}else{
		// 		// 			setTimeout(autoPutProduk, 0);
		// 		// 		}
		// 		// 	}else{
		// 				synceProdukMarketPlaceInvent(dataHasilSeleksi,UID,_w,idMarket);
		// 		// 	}
		// 		// },0);
		// 	}else{
		// 		cXY++;
		// 		setTimeout(waitLData,0);
		// 	}
		// },0);
	}else{
		synceProdukMarketPlaceInvent(dataHasilSeleksi,UID,_w,idMarket);
	}
};

function synceProdukMarketPlaceInvent(dataHasilSeleksi,UID,_w,idMarket){
	let idGet = idMarket.i;
	// //console.log('synceProdukMarketPlaceInvent '+dataHasilSeleksi.length+' data produk list '+self.default.data[UID].produkList.length)
	if(dataHasilSeleksi.length > 0 && self.default.data[UID].produkList.length > 0){
		let idOrigin = [];
		let	idInvent = [];
		let	arrSama = [];
		_foreach(dataHasilSeleksi, function (val, key, obj){
			if(val.produk.length > 0){
				_foreach(val.produk, function (vProd, kProd, obj1){
					if(vProd.id){
						idOrigin.push(vProd.id);
					}
				});
			}
		});
		idOrigin = unique_array(idOrigin);

		_foreach(self.default.data[UID].produkList, function (val, key, obj){
			arrSama = []; 
			if(val.id_produk){
				arrSama.push(val.id_produk); 
				for(var i = 0; i < idOrigin.length; i++){
					if(arrSama.indexOf(idOrigin[i]) !== -1){
						idInvent.push(val);
					}
				}; 
			}
		});
		// //console.log('idOrigin after '+idOrigin.length+' idInvent '+idInvent.length)
		let dataToPush = [];
		let continueListProduk = false;
		let prductTmp = [];
		let grosir = '';
		_foreach(dataHasilSeleksi, function (v, k, obj){
			if(v.produk.length > 0){
				prductTmp = v.produk;
				let replaceProduk = false;
				dataToPush = [];
				_foreach(prductTmp, function (vProd,kProd, obj1){
					if(vProd.id){
						if(idInvent.length > 0){
							_foreach(idInvent, function (vLp,kLp, obj2){
								if(vLp.id_produk == vProd.id){
									replaceProduk = true;
									continueListProduk = true;
									let _ltmp = vLp.data_detail.marketPlace.varian.length -1;
									let l_stok = vLp.data_detail.varian[_ltmp].stok.length;
									let _stok = vLp.data_detail.varian[_ltmp].stok[l_stok-1].stokIn;
									let _name = vLp.data_detail.nama;
									let _supplier = vLp.data_detail.idBrend;
									if(_stok <= 0 && vLp.data_detail.varian[_ltmp].stok[l_stok-1].statusStok == 'stok_tersedia'){
										_stok = 9999;
									}
									if(!_supplier){
										_supplier = vLp.data_detail.idsuplier;
									}
									if(vLp.data_detail.varian[_ltmp].description){
										_name = vLp.data_detail.nama+' '+vLp.data_detail.varian[_ltmp].description;
									}
									if(vLp.data_detail.grosir){
										grosir = vLp.data_detail.grosir;
									}
									let _total = parseInt(vProd.price)*parseInt(vProd.order_quantity);
									dataToPush.push({
										id:vLp.id,
										idList:vLp.id+'-NonPromo-'+vLp.data_detail.marketPlace.varian[_ltmp].sku_replace+'-'+0,
										idPromo: '',
										listBarangPromo:[],
										listBarangFree:[],
										sku:vLp.data_detail.marketPlace.varian[_ltmp].sku_replace,
										berat:vProd.weight,
										diskon:'-',
										grosir:grosir,
										keterangan:'reguler',
										nama:_name,
										harga_beli:parseInt(vLp.data_detail.varian[_ltmp].harga_beli),
										harga_jual_normal:parseInt(vLp.data_detail.varian[_ltmp].harga_jual_normal),
										harga_jual_reseller:parseInt(vLp.data_detail.varian[_ltmp].harga_jual_reseller),
										katalog: vLp.data_detail.varian[_ltmp].katalog,
										stok:_stok,
										id_suplier:_supplier,
										dist_suplier:'',
										add_suplier:'',
										total:_total,
										jumlah:parseInt(vProd.order_quantity),
										minOrder:1,
										qtyPromo:0,
										maxOrder:_stok,
										statusItem:'buy',
										marketPlace:{
											url:vProd.url,
											id:vProd.id
										},
										ktg:vLp.data_detail.kategori,
										harga_diskon:0,
										harga_awal:vProd.price,
										harga_akhir:_total,
										berat_total:parseInt(vProd.weight),
										berat_total_kg:parseInt(vProd.weight)/1000,
										statusDiskon : 'NonPromo',
										diskonVal: '',
										varPromo:parseInt(_ltmp)
									});
								}
							});
						}
					}
				});
				// //console.log('data to push transaksi '+dataToPush.length)
				if(dataToPush.length > 0 && replaceProduk == true){
					if(dataToPush.length == 1 && prductTmp.length == 1){
						v.produk = dataToPush;
						v['originProduk'] = prductTmp;
					}else{
						let id_tmpOrigin = [];
						let arrSama1 = [];
						let hasil_tmp = [];
						_foreach(prductTmp, function (vTmp,kTmp, obj1){
							if(vTmp.id){
								id_tmpOrigin.push(vTmp.id);
							}
						});
						_foreach(dataToPush, function (vTmp,kTmp, obj1){
							if(vTmp.marketPlace){
								arrSama1 = [];
								let data = vTmp.marketPlace;
								if(data.id){
									arrSama1.push(data.id);
									let j = id_tmpOrigin.length;
									for(var i = 0; i < j; i++){
										if(arrSama1.indexOf(id_tmpOrigin[i]) !== -1 ){
											hasil_tmp.push(vTmp);
											id_tmpOrigin.splice(i, 1);
											i = j + 1;
										}
									};
								}
							}
						});
						v.produk = hasil_tmp;
						v['originProduk'] = prductTmp;
					}
				}
			}
		});
		if(continueListProduk == true){
			extractCustomerTransaction(dataHasilSeleksi,'transaksi',UID,_w,idMarket);
		}else{
			//console.log('err :: synceProdukMarketPlaceInvent '+UID)
			// callTime.getTransaction = true;
			timerGet2.get--;
			timerGet2.status = true;
		}
	}
};

function extractCustomerTransaction(dataHasilSeleksi,where,UID,_w,idMarket){
	if(dataHasilSeleksi.length > 0 && (where == 'transaksi' || where == 'getCustomerBL') && self.allData.customers.length > 0){
		// //console.log('extractCustomerTransaction if '+where)
		let emailOrigin = [];
		let phoneOrigin = [];
		let customerOrigin = [];
		let unikMailPhone = [];
		_foreach(dataHasilSeleksi, function (val,key, obj1){
			if(val.customer.identity.contact){
				let data = val.customer.identity.contact;
				if(data.email){
					emailOrigin.push(data.email.toLowerCase());
				}
				if(data.phone){
					phoneOrigin.push(data.phone);
				}
				customerOrigin.push(val.customer);
			}
		});

		emailOrigin = unique_array(emailOrigin);

		phoneOrigin = unique_array(phoneOrigin);

		_foreach(self.allData.customers, function (val,key, obj1){
			if(val){
				let arrSama1 = [];
				let arrSama2 = [];
				let checkMailPhone = false;
				if(val.id){
					if(val.email){
						arrSama1.push(val.email.toLowerCase());
						for(var i = 0; i < emailOrigin.length; i++){
							if(arrSama1.indexOf(emailOrigin[i]) !== -1){
								checkMailPhone = true;
							}
						};
					}
					if(val.phone){
						arrSama2.push(val.phone);
						for(var i = 0; i < phoneOrigin.length; i++){
							if(arrSama2.indexOf(phoneOrigin[i]) !== -1){
								checkMailPhone = true;
							}
						};
					}
				}
				if(checkMailPhone == true){
					unikMailPhone.push(val);
				}
			}
		});

		if(unikMailPhone.length > 0 ){
			let unikMailPhoneSama = [];
			let arrSama1 = [];
			let arrSama2 = [];
			let checkMailPhone = false;
			_foreach(self.allData.customers, function (v, k, obj){
				if(v.contact_detail){
					arrSama1 = [];
					arrSama2 = [];
					let data = v.contact_detail;
					if(data.email){
						arrSama1.push(data.email.toLowerCase());
						let j = emailOrigin.length;
						for(var i = 0; i < j; i++){
							if(arrSama1.indexOf(emailOrigin[i]) !== -1 ){
								emailOrigin.splice(i, 1);
								i = j + 1;
							}
						};
					}
					if(data.phone){
						arrSama2.push(data.phone);
						let j = phoneOrigin.length;
						for(var i = 0; i < j; i++){
							if(arrSama2.indexOf(phoneOrigin[i]) !== -1){
								phoneOrigin.splice(i, 1);
								i = j + 1;
							}
						};
					}
				}
			});

			_foreach(customerOrigin, function (v, k, obj){
				if(v.identity.contact){
					arrSama1 = [];
					arrSama2 = [];
					checkMailPhone = false;
					let data = v.identity.contact;
					if(data.email){
						arrSama1.push(data.email.toLowerCase());
						let j = emailOrigin.length;
						for(var i = 0; i < j; i++){
							if(arrSama1.indexOf(emailOrigin[i]) !== -1 ){
								checkMailPhone = true;
								emailOrigin.splice(i, 1);
								i = j + 1;
							}
						};
					}
					if(data.phone){
						arrSama2.push(data.phone);
						let j = phoneOrigin.length;
						for(var i = 0; i < j; i++){
							if(arrSama2.indexOf(phoneOrigin[i]) !== -1){
								checkMailPhone = true;
								phoneOrigin.splice(i, 1);
								i = j + 1;
							}
						};
					}
				}
				if(checkMailPhone == true){
					unikMailPhoneSama.push(v);
				}
			});


			//console.log('extractCustomerTransaction if '+where+' Upload '+unikMailPhoneSama.length+' new Customer ');
			if(unikMailPhoneSama.length > 0 ){//&& where != 'getCustomerBL'){
				// //console.log('unikMailPhone tidak sama '+unikMailPhoneSama.length)
				if(regionDefault.province.length > 0 && regionDefault.city.length > 0 && regionDefault.districts.length > 0){
					synceDataRegion(dataHasilSeleksi,unikMailPhoneSama,_w,UID,idMarket,where);
				}else{
					let getRegion = true;
					setTimeout(function runRegion(){
						if(regionDefault.province.length <= 0 || regionDefault.city.length <= 0 || regionDefault.districts.length <= 0){
							if(getRegion == true){
								getRegion = false;
								generateLocalMap();
								setTimeout(runRegion,0);
							}else{
								setTimeout(runRegion,0);
							}
						}else{
							synceDataRegion(dataHasilSeleksi,unikMailPhoneSama,_w,UID,idMarket,where);
						}
					},0);
				}

			}else{
				if(where == 'transaksi'){
					// self.changeProgress(self.progressBar.all);
					// //console.log('transaksi finis')
					finishingTransaction(dataHasilSeleksi,UID,_w,idMarket);
				}else if(where == 'getCustomerBL'){
					//console.log('customer finis')
					timerGet2.get--;
					timerGet2.status = true;
					// self.notifyError2('Tidak ada data cuastomer baru!','warn');
					// self.aSelectGet = {id : '', name : 'Select option get'};
					// self.changeProgress(self.progressBar.all);
				}
			}
			
		}else{
			let arrSama1 = [];
			let arrSama2 = [];
			let checkMailPhone = false;
			_foreach(customerOrigin, function (v,k, o){
			// angular.forEach(customerOrigin,function(v,k){
				if(v.identity.contact){
					arrSama1 = [];
					arrSama2 = [];
					checkMailPhone = false;
					let data = v.identity.contact;
					if(data.email){
						arrSama1.push(data.email.toLowerCase());
						let j = emailOrigin.length;
						for(var i = 0; i < j; i++){
							if(arrSama1.indexOf(emailOrigin[i]) !== -1 ){
								checkMailPhone = true;
								emailOrigin.splice(i, 1);
								i = j + 1;
							}
						};
					}
					if(data.phone){
						arrSama2.push(data.phone);
						let j = phoneOrigin.length;
						for(var i = 0; i < j; i++){
							if(arrSama2.indexOf(phoneOrigin[i]) !== -1){
								checkMailPhone = true;
								phoneOrigin.splice(i, 1);
								i = j + 1;
							}
						};
					}
				}
				if(checkMailPhone == true){
					unikMailPhone.push(v);
				}
			});
			// //console.log('unikmailphone1 '+unikMailPhone.length)
			if(unikMailPhone.length > 0 ){
				if(regionDefault.province.length > 0 && regionDefault.city.length > 0 && regionDefault.districts.length > 0){
					synceDataRegion(dataHasilSeleksi,unikMailPhone,_w,UID,idMarket,where);
				}else{
					let getRegion = true;
					setTimeout(function runRegion(){
						if(regionDefault.province.length <= 0 || regionDefault.city.length <= 0 || regionDefault.districts.length <= 0){
							if(getRegion == true){
								getRegion = false;
								// self.ajacCall2({get:'region'},'regionExtract','region','get');
								generateLocalMap();
								setTimeout(runRegion,0);
							}else{
								setTimeout(runRegion,0);
							}
						}else{
							synceDataRegion(dataHasilSeleksi,unikMailPhone,_w,UID,idMarket,where);
						}
					},0);
				}

			}else{
				if(where == 'transaksi'){
					// self.changeProgress(self.progressBar.all);
					// finishingTransaction(dataHasilSeleksi);
					//console.log('finis transaksi1')
				}else if(where == 'getCustomerBL'){
					//console.log('finis customer')
					// self.notifyError2('Tidak ada data customer baru!','warn');
					// self.aSelectGet = {id : '', name : 'Select option get'};
					// self.changeProgress(self.progressBar.all);
				}
			}
		}
	}else if(dataHasilSeleksi.length > 0 && (where == 'transaksi' || where == 'getCustomerBL') && self.allData.customers.length == 0){
		//console.log('customer leng null')
		callTime.getTransaction = true;
		/*let getCusData = true;
		let lengthData = 1;
		setTimeout(function runCus(){
			if(getCusData == true){
				if(self.allData.customers.length == 0 && lengthData > 0){
					$http({
						method: 'get',
						url: baseurl+'/customer_get',
						headers: {
							'Content-Type': 'application/json;charset=utf-8'
						},
						data: {get:'customer'},
					}).then(function (response) {
						if(response.status == 200){
							if(response.data.length > 0){
								self.allData.customers = self.filter_customer(response.data);
								getCusData = false;
							}else{
								getCusData = false;
							}
						}
					},function (error){
						getCusData = false;
						//console.log(error)
					});
					lengthData = 0;
					setTimeout(runCus,0);
				}else{
					setTimeout(runCus,0);
				}
			}else{
				if(self.allData.customers.length > 0){
					self.extractCustomerTransaction(dataHasilSeleksi,'transaksi');
				}else{
					let emailOrigin = [];
					let phoneOrigin = [];
					let customerOrigin = [];
					let unikMailPhone = [];

					angular.forEach(dataHasilSeleksi,function(val,key){
						if(val.customer.identity.contact){
							let data = val.customer.identity.contact;
							if(data.email){
								emailOrigin.push(data.email.toLowerCase());
							}
							if(data.phone){
								phoneOrigin.push(data.phone);
							}
							customerOrigin.push(val.customer);
						}
					});
					
					$.each(emailOrigin, function(i, el){
						if($.inArray(el, unikMailPhone) === -1) unikMailPhone.push(el);
					});
					emailOrigin = angular.copy(unikMailPhone);

					unikMailPhone = [];
					$.each(phoneOrigin, function(i, el){
						if($.inArray(el, unikMailPhone) === -1) unikMailPhone.push(el);
					});
					phoneOrigin = angular.copy(unikMailPhone);

					
					unikMailPhone = [];
					let arrSama1 = [];
					let arrSama2 = [];
					let checkMailPhone = false;
					angular.forEach(customerOrigin,function(v,k){
						if(v.identity.contact){
							arrSama1 = [];
							arrSama2 = [];
							checkMailPhone = false;
							let data = v.identity.contact;
							if(data.email){
								arrSama1.push(data.email.toLowerCase());
								let j = emailOrigin.length;
								for(var i = 0; i < j; i++){
									if(arrSama1.indexOf(emailOrigin[i]) !== -1 ){
										checkMailPhone = true;
										emailOrigin.splice(i, 1);
										i = j + 1;
									}
								};
							}
							if(data.phone){
								arrSama2.push(data.phone);
								let j = phoneOrigin.length;
								for(var i = 0; i < j; i++){
									if(arrSama2.indexOf(phoneOrigin[i]) !== -1){
										checkMailPhone = true;
										phoneOrigin.splice(i, 1);
										i = j + 1;
									}
								};
							}
						}
						if(checkMailPhone == true){
							unikMailPhone.push(v);
						}
					});

					if(unikMailPhone.length > 0 ){
						if(regionDefault.province.length > 0 && regionDefault.city.length > 0 && regionDefault.districts.length > 0){
							synceDataRegion(dataHasilSeleksi,unikMailPhone);
						}else{
							let getRegion = true;
							setTimeout(function runRegion(){
								if(regionDefault.province.length <= 0 || regionDefault.city.length <= 0 || regionDefault.districts.length <= 0){
									if(getRegion == true){
										getRegion = false;
										// self.ajacCall2({get:'region'},'regionExtract','region','get');
										generateLocalMap();
										setTimeout(runRegion,0);
									}else{
										setTimeout(runRegion,0);
									}
								}else{
									synceDataRegion(dataHasilSeleksi,unikMailPhone);
								}
							},0);
						}
					}else{
						if(where == 'transaksi'){
							self.changeProgress(self.progressBar.all);
							finishingTransaction(dataHasilSeleksi);
						}else if(where == 'getCustomerBL'){
							self.notifyError2('Tidak ada data cuastomer baru!','warn');
							self.aSelectGet = {id : '', name : 'Select option get'};
							self.changeProgress(self.progressBar.all);
						}
					}
				}
			}
		},0);*/
	}
};

function filter_customer(data){
	let data_arr_push = [];
	let _phone = '';
	let _nm = '';
	let _mail = '';
	let _ad = {};
	let _contact = {};
	_foreach(data, function (val, key, obj){
		if(val.nama){
			_nm = val.nama;
		}
		if(val.address){
			_ad = val.address;
		}
		if(val.contact){
			_contact = val.contact;
			if(val.contact.email){ _mail = val.contact.email;}
			if(val.contact.phone){ _phone = val.contact.phone;}
		}
		if((_mail || _phone) && _nm){
			// if(val.idParentUser == 'MsaXytEmXDNMHhrcwnYpoPJ3Pdy1'){

				data_arr_push.push({
					username:_nm.toLowerCase(),
					email:_mail.toLowerCase(),
					id:key,
					phone:_phone,
					nama: _upperCaseFirst(_nm),
					add: _ad.districts.name+', '+_ad.city.name+', '+_ad.province.name+' '+_ad.postalcode,
					contact_detail: _contact,
					address_detail: _ad,
					origin : val
				});
			// }
			_phone = '';_nm = '';_mail = ''; _ad = {}; _contact = {};
		}
	});
	return data_arr_push;
};

function filter_customer2(data,where,tmpLength,dataHasilSeleksi,UID,_w,idMarket){
	if(self.allData.customers && self.allData.customers.length > 0){
		//console.log('self.allData.customers before '+self.allData.customers.length)
	}else{
		//console.log('err :: customer empty')
		self.allData.customers = [];
	}
	let data_arr_push = [];
	let _phone = '';
	let _nm = '';
	let _mail = '';
	let _ad = {};
	let _contact = {};
	_foreach(data, function (val, key, obj){
		if(val.nama){
			_nm = val.nama;
		}
		if(val.address){
			_ad = val.address;
		}
		if(val.contact){
			_contact = val.contact;
			if(val.contact.email){ _mail = val.contact.email;}
			if(val.contact.phone){ _phone = val.contact.phone;}
		}
		if((_mail || _phone) && _nm){
			data_arr_push.push(key);
			self.allData.customers.push({
				username:_nm.toLowerCase(),
				email:_mail.toLowerCase(),
				id:key,
				phone:_phone,
				nama: _upperCaseFirst(_nm),
				add: _ad.districts.name+', '+_ad.city.name+', '+_ad.province.name+' '+_ad.postalcode,
				contact_detail: _contact,
				address_detail: _ad,
				origin : val
			});
			_phone = '';_nm = '';_mail = ''; _ad = {}; _contact = {};

			// if(data_arr_push.length > 0){
			// 	if(where == 'transaksi'){
			// 		if(data_arr_push.length == tmpLength){
			// 			//console.log('sukses update self.allData.customers '+self.allData.customers.length)
			// 			finishingTransaction(dataHasilSeleksi,UID,_w,idMarket);
			// 			// timerGet2.get--;
			// 			// timerGet2.status = true;
			// 		}else{
			// 			//console.log('err :: filter_customer2 '+data_arr_push.length)
			// 			timerGet2.get--;
			// 			timerGet2.status = true;
			// 		}
			// 	}else if(where == 'getCustomerBL' ){
			// 		if(data_arr_push.length == tmpLength){
			// 			//console.log('sukses update self.allData.customers '+self.allData.customers.length)
			// 			timerGet2.get--;
			// 			timerGet2.status = true;
			// 		}else{
			// 			//console.log('err :: filter_customer2 '+data_arr_push.length)
			// 			timerGet2.get--;
			// 			timerGet2.status = true;
			// 		}
			// 	}
			// }else{
			// 	//console.log('else update self.allData.customers')
			// }
		}
	});
	if(data_arr_push.length > 0){
		if(where == 'transaksi'){
			if(data_arr_push.length == tmpLength){
				//console.log('sukses update self.allData.customers '+self.allData.customers.length)
				finishingTransaction(dataHasilSeleksi,UID,_w,idMarket);
				// timerGet2.get--;
				// timerGet2.status = true;
			}else{
				//console.log('err :: filter_customer2 '+data_arr_push.length)
				timerGet2.get--;
				timerGet2.status = true;
			}
		}else if(where == 'getCustomerBL' ){
			if(data_arr_push.length == tmpLength){
				//console.log('sukses update self.allData.customers '+self.allData.customers.length)
				timerGet2.get--;
				timerGet2.status = true;
			}else{
				//console.log('err :: filter_customer2 '+data_arr_push.length)
				timerGet2.get--;
				timerGet2.status = true;
			}
		}
	}else{
		//console.log('else update self.allData.customers')
	}
};

// function upperCaseFirst(string) {
// 	var strToUp = string.split(" ");
// 	for ( var i = 0; i < strToUp.length; i++ )
// 	{
// 		var j = strToUp[i].charAt(0).toUpperCase();
// 		strToUp[i] = j + strToUp[i].substr(1).toLowerCase();
// 	}
// 	return strToUp.join(" ");
// }

function generateLocalMap(){
	clientRedis.get(self.redis.key2, function (error, result) {
		if (result) {
			//console.log('GET '+self.redis.key2+' -> exist');
			regionDefault = JSON.parse(result);
		}else{
			//console.log('GET '+self.redis.key+' -> not exist');
			localMap.once('value', function(snapshot){
				//console.log('create '+self.redis.key2)
				let alldMap = snapshot.val();
				let tmp_localMap = _extractRegion(alldMap);
				clientRedis.set(self.redis.key2, JSON.stringify(tmp_localMap), redis.print);//JSON.stringify(self.redis.val), redis.print);
				clientRedis.expireat(self.redis.key2, parseInt((+new Date)/1000) + 86400);
			});
		}
	});
};


function synceDataRegion(dataHasilSeleksi,unikMailPhone,_w,UID,idMarket,where){
	//console.log('synceDataRegion '+dataHasilSeleksi.length)
	// if(where == 'getCustomerBL' || where == 'getTransactionSellerSuccess' || where == 'getTransactionSellerFailed'){
	// 	self.progressBar.all = unikMailPhone.length;
	// }

	if(unikMailPhone.length > 0){
		// synceDataRegionTransaction = [];
		// self.dataPostCustomer.listCust = [];
		let synceDataRegionTransaction = [];
		// angular.forEach(unikMailPhone,function(v,k){
		_foreach(unikMailPhone, function (v, k, o){//regionDefault.districts, function (v, k, o){
			if(v.identity.address){
				let feedback = v.identity.address;//angular.copy();
				if(feedback.districts.name == 'Parompong'){
					v.identity.address.districts.name = 'Parongpong';
					feedback.districts.name = 'Parongpong';
				}

				let tmp_ds = searchStringInArray(feedback.districts.name.toLowerCase(),regionDefault.districtsName);
				if(tmp_ds.length == 0){
					let str = stringToArray(feedback.districts.name.toLowerCase());
					// angular.forEach(str,function(vStr,kStr){
					_foreach(str, function (vStr, kStr, o1){
						if(vStr){
							let data_tmp_ds = searchStringInArray(vStr,regionDefault.districtsName);
							if(data_tmp_ds.length > 0){
								_foreach(data_tmp_ds, function (vStr1, kStr1, o2){
								// angular.forEach(data_tmp_ds,function(vStr1,kStr){
									if(vStr1){
										tmp_ds.push(vStr1);
									}

								});
							}
						}

					});
				}
				let tmp_ct = searchStringInArray(feedback.city.name.toLowerCase(),regionDefault.cityName);
				if(tmp_ct.length == 0){
					let str = stringToArray(feedback.city.name.toLowerCase());
					// angular.forEach(str,function(vStr,kStr){
					_foreach(str, function (vStr, kStr, o1){
						if(vStr){
							let data_tmp_ct = searchStringInArray(vStr,regionDefault.cityName);
							if(data_tmp_ct.length > 0){
								// angular.forEach(data_tmp_ct,function(vStr1,kStr){
								_foreach(data_tmp_ct, function (vStr1, kStr1, o2){				
									if(vStr1){
										tmp_ct.push(vStr1);
									}

								});
							}
						}

					});
				}

				let tmp_pr = searchStringInArray(feedback.province.name.toLowerCase(),regionDefault.provinceName);
				if(tmp_pr.length == 0){
					let str = stringToArray(feedback.province.name.toLowerCase());
					// angular.forEach(str,function(vStr,kStr){
					_foreach(str, function (vStr, kStr, o1){
						if(vStr){
							let data_tmp_pr = searchStringInArray(vStr,regionDefault.provinceName);
							if(data_tmp_pr.length > 0){
								_foreach(data_tmp_pr, function (vStr1, kStr1, o2){				
									// angular.forEach(data_tmp_pr,function(vStr1,kStr){
									if(vStr1){
										tmp_pr.push(vStr1);
									}

								});
							}
						}

					});
				}
				let DataProv = [];
				let DataCity = [];
				let DataDistricts = [];
				if(tmp_pr.length > 0 && tmp_ct.length > 0){
					_foreach(tmp_pr, function (vPars, kPars, o1){				
					// angular.forEach(tmp_pr,function(vPars,kPars){
						if(vPars){
							DataProv.push(regionDefault.province[vPars]);
						}
					});
					_foreach(tmp_ct, function (vPars, kPars, o1){
					// angular.forEach(tmp_ct,function(vPars,kPars){
						if(vPars){
							DataCity.push(regionDefault.city[vPars]);
						}
					});
					_foreach(tmp_ds, function (vPars, kPars, o1){
					// angular.forEach(tmp_ds,function(vPars,kPars){
						if(vPars){
							DataDistricts.push(regionDefault.districts[vPars]);
						}
					});
					if(DataProv.length > 0){
						let tmpCt2 = [];
						_foreach(DataProv, function (v1, k1, o1){
						// angular.forEach(DataProv,function(v1,k1){
							if(v1.province_id){
								feedback.province.id = v1.province_id;
								v.identity.address.province.id = v1.province_id;
								feedback.province.name = v1.province;
								v.identity.address.province.name = v1.province;
								_foreach(DataCity, function (v2, k2, o2){
								// angular.forEach(DataCity,function(v2,k2){
									if(v2.province_id == v1.province_id){
										tmpCt2.push(v2)
									}
								});
							}
						});
						if(tmpCt2.length == 1){
							let kecCheck_id = false;
							feedback.city.id = tmpCt2[0].city_id;
							feedback.city.name = tmpCt2[0].type+' '+tmpCt2[0].city_name;
							v.identity.address.city.id = tmpCt2[0].city_id;
							v.identity.address.city.name = tmpCt2[0].type+' '+tmpCt2[0].city_name;
							_foreach(DataDistricts, function (v2, k2, o2){
							// angular.forEach(DataDistricts,function(v2,k2){
								if(v2.province_id == feedback.province.id){
									if(v2.city_id == feedback.city.id){
										feedback.districts.id= v2.subdistrict_id;
										feedback.districts.name= v2.subdistrict_name;
										v.identity.address.districts.id= v2.subdistrict_id;
										v.identity.address.districts.name= v2.subdistrict_name;
										kecCheck_id = true;
									}
								}
							});
							if(kecCheck_id == false){
								let putOne = true;
								_foreach(regionDefault.districts, function (v2, k2, o2){
								// angular.forEach(regionDefault.districts,function(v2,k2){
									if(putOne == true && v2.province_id == feedback.province.id && v2.city_id == feedback.city.id){
										putOne = false;
										feedback.districts.id= v2.subdistrict_id;
										feedback.districts.name= v2.subdistrict_name;
										v.identity.address.districts.id= v2.subdistrict_id;
										v.identity.address.districts.name= v2.subdistrict_name;
									}
								});
							}

						}else if(tmpCt2.length > 1){
							let kecCheck_id = false;
							_foreach(tmpCt2, function (vCt, kCt, o1){
							// angular.forEach(tmpCt2,function(vCt,kCt){
								if(vCt.city_id && vCt.province_id == feedback.province.id){
									_foreach(DataDistricts, function (v2, k2, o2){
									// angular.forEach(DataDistricts,function(v2,k2){
										if(v2.province_id == feedback.province.id){
											if(vCt.city_id == v2.city_id){
												feedback.city.id = vCt.city_id;
												feedback.city.name = vCt.type+' '+vCt.city_name;
												v.identity.address.city.id = vCt.city_id;
												v.identity.address.city.name = vCt.type+' '+vCt.city_name;

												feedback.districts.id= v2.subdistrict_id;
												feedback.districts.name= v2.subdistrict_name;
												v.identity.address.districts.id= v2.subdistrict_id;
												v.identity.address.districts.name= v2.subdistrict_name;
												kecCheck_id = true;
											}
										}
									});
								}
							});
							if(kecCheck_id == false){
								let putOne = true;
								_foreach(regionDefault.districts, function (v2, k2, o2){
								// angular.forEach(regionDefault.districts,function(v2,k2){
									if(putOne == true && v2.province_id == feedback.province.id && v2.city_id == feedback.city.id){
										putOne = false;
										feedback.districts.id= v2.subdistrict_id;
										feedback.districts.name= v2.subdistrict_name;
										v.identity.address.districts.id= v2.subdistrict_id;
										v.identity.address.districts.name= v2.subdistrict_name;
									}
								});
							}

						}
					}
					// self.dataPostCustomer.transaction
					synceDataRegionTransaction.push({
						address:feedback,
						contact:v.identity.contact,
						kategori:v.identity.kategori,
						nama:v.identity.nama,
						gender:'',
						idParentUser:UID,
						idStaffInput:UID,
						date : v.identity.date,
						marketPlace:{
							userName:v.username,
							email:v.identity.contact.email,
							phone:v.identity.contact.phone,
							marketPlace:_w
						}
					});
				}else{
					//console.log('data location salah')
				}
			}
		});
		// //console.log(synceDataRegionTransaction.length);
		if(synceDataRegionTransaction.length > 0){
			genderDataCustomer(dataHasilSeleksi,unikMailPhone,synceDataRegionTransaction,_w,UID,idMarket,where);
		}else{
			timerGet2.get--;
			timerGet2.status = true;
		}
	}else{
		//console.log('err :: synceDataRegion')
		timerGet2.get--;
		timerGet2.status = true;
	}
};

function finishingTransaction(dataHasilSeleksi,UID,_w,idMarket){
	let idGet = idMarket.i;
	if(dataHasilSeleksi.length > 0 && self.allData.customers.length > 0){
		// //console.log('finishingTransaction')
		_foreach(dataHasilSeleksi, function (v, k, o){
			if(v.customer){
				let feedback = v.customer;
				let dataToPush = {
					add:'',
					dropship:{
						address:{
							city:{
								id:'',
								name:''
							},
							districts:{
								id:'',
								name:''
							},
							postalcode:'',
							province:{
								id:'',
								name:''
							}
						},
						alamat:'',
						name:'',
						phone:''
					},
					id:'',
					identity:{
						address:{},
						alamat:feedback.identity.alamat,
						namaToko:feedback.identity.namaToko,
						name:feedback.identity.nama,
						phone:feedback.identity.phone
					},
					ktg:feedback.ktg,
					status:feedback.status
				}
				if(feedback.identity.contact){
					let checkdata = false;
					if(feedback.identity.contact.email){
						_foreach(self.allData.customers, function (v1, k1, o1){
							if(v1.email){
								if(v1.email.toLowerCase() == feedback.identity.contact.email.toLowerCase()){
									checkdata = true;
									dataToPush.add = v1.add;
									dataToPush.id = v1.id;
									dataToPush.identity.address = v1.address_detail;
								}
							}
						});
					}
					if(checkdata == false){
						_foreach(self.allData.customers, function (v1, k1, o1){
							if(v1.phone){
								if(v1.phone.toLowerCase() == feedback.identity.contact.phone.toLowerCase()){
									checkdata = true;
									dataToPush.add = v1.add;
									dataToPush.id = v1.id;
									dataToPush.identity.address = v1.address_detail;
								}
							}
						});
					}
				}
				if(dataToPush.id){
					v.customer = dataToPush;
					v['originCustomer'] = feedback.identity;
				}
			}
		});

		generateSupplier(dataHasilSeleksi,UID,_w,idMarket);
	}else{
		//console.log('else finishingTransaction')
		timerGet2.get--;
		timerGet2.status = true;
	}
};

function generateSupplier(dataHasilSeleksi,UID,_w,idMarket){
	let idGet = idMarket.i;
	if(dataHasilSeleksi.length > 0 && self.default.data[UID].brand){
		// //console.log('generateSupplier')
		let supplier = {
			add:'',
			contact:{},
			description:'',
			dropship:{
				address:{
					city:{
						id:'',
						name:''
					},
					districts:{
						id:'',
						name:''
					},
					postalcode:'',
					province:{
						id:'',
						name:''
					},
					street:''
				},
				alamat:'',
				namaToko:'',
				name:'',
				phone:''
			},
			id:'',
			identity:{
				address:{
					city:{
						id:'',
						name:''
					},
					districts:{
						id:'',
						name:''
					},
					postalcode:'',
					province:{
						id:'',
						name:''
					},
					street:''
				},
				name:'',
				phone:''
			},
			ktg:'owner',
			status:'none'
		};
		let createNewBrand = true;
		_foreach(self.default.data[UID].brand, function (v, k, o){
			if(v.marketPlace){ 
				if(v.marketPlace.id == idGet && v.marketPlace.marketPlace == _w.toLowerCase()){
					createNewBrand = false;
					supplier.add = v.name+' | '+v.address.districts.name+', '+v.address.city.name+', '+v.address.province.name;
					supplier.contact = v.contact;
					supplier.identity.name = v.name;
					supplier.identity.phone = v.contact.phone;
					supplier.identity.address = v.address;
					supplier.id = k;
					supplier.description = v.description;
				}
			}
		});

		if(supplier.id){
			_foreach(dataHasilSeleksi, function (v, k, o){
				if(v.supplier){
					v['originSupplier'] = v.supplier;
					v.supplier = supplier;
				}
			});
			ongkirGenerateData(dataHasilSeleksi,UID,_w,idMarket);
		}

		if(createNewBrand == true){
			//console.log('create brand true')
			// timerGet1.get = 1;
			// timerGet1.status = true;
			// setTimeout(function autoPutProduk(){
			// 	if(timerGet1.get > 0){
			// 		if(timerGet1.status == true){
			// 			timerGet1.status = false;
			// 			self.generateNewProfile(self.accountMarket.id,'transaksi');
			// 			setTimeout(autoPutProduk, 0);
			// 		}else{
			// 			setTimeout(autoPutProduk, 0);
			// 		}
			// 	}else{
			// 		self.ongkirGenerateData(dataHasilSeleksi);
			// 	}
			// },0);
		}

	}else{
		//console.log('err :: generateSupplier');
		timerGet2.get--;
		timerGet2.status = true;
		
		// timerGet1.get = 1;
		// timerGet1.status = true;
		// setTimeout(function autoPutProduk(){
		// 	if(timerGet1.get > 0){
		// 		if(timerGet1.status == true){
		// 			timerGet1.status = false;
		// 			self.generateNewProfile(self.accountMarket.id,'transaksi');
		// 			setTimeout(autoPutProduk, 0);
		// 		}else{
		// 			setTimeout(autoPutProduk, 0);
		// 		}
		// 	}else{
		// 		self.ongkirGenerateData(dataHasilSeleksi);
		// 	}
		// },0);
	}
};

function ongkirGenerateData(dataHasilSeleksi,UID,_w,idMarket){
	let idGet = idMarket.i;
	if(dataHasilSeleksi.length > 0){
		// //console.log('ongkirGenerateData')
		_foreach(dataHasilSeleksi, function (v, k, o){
			if(v.customer.status == 'none'){
				let identity = v.customer.identity.address;
				v.ongkir.addTujuan = identity.districts.name+', '+identity.city.name+', '+identity.province.name+', '+identity.postalcode;
				v.ongkir.tujuan = identity.city.id;
			}
			if(v.supplier.status == 'none'){
				let identity = v.supplier.identity.address;
				v.ongkir.addAsal = identity.districts.name+', '+identity.city.name+', '+identity.province.name+', '+identity.postalcode;
				v.ongkir.asal = identity.city.id;
			}
			if(v.originOther){
				v.status.produk = 'owner';
				v.ongkir.resi = v.originOther.shipping_code;
				v.ongkir.name_jasa = v.originOther.shipChoice.toUpperCase();
				v.ongkir.paket_jasa = v.originOther.ship.toUpperCase();
				v.ongkir.harga = v.originOther.shipping_fee;
				v.status.resi = true;
				if(v.originOther.shipChoice || v.originOther.shipping_code){
					v.ongkir.statusOngkir = 'expedisi';
					v.status['delivered'] = true;
					v.status.lacak = 'expedisi';
				}else{
					v.ongkir.statusOngkir = 'free';
					v.status.lacak = 'free';
				}
				if(v.originOther.paymentAmount == v.total.pemesanan.grandTotal){
					v.status.bayar = 'Lunas';
					v.total.pembayaran[0].statusBayar = 'Lunas';
				}else if(v.originOther.paymentAmount < v.total.pemesanan.grandTotal){
					v.status.bayar = 'Cicil';
					v.total.pembayaran[0].statusBayar = 'Cicil';
				}else{
					v.status.bayar = 'Belum Bayar';
					v.total.pembayaran[0].statusBayar = 'Belum Bayar';
				}
				if(v.originOther.status != 'refunded'){
					v.status.status = 'active';
				}else{
					v.status.status = 'retur';
				}
				let bobotNew = 0;
				_foreach(v.produk, function (vb, kb, ob){
					if(vb.berat_total){
						bobotNew = bobotNew + vb.berat_total;
					}
				});
				v.ongkir.berat = bobotNew;
				bobotNew = bobotNew/1000;
				let bobotKg = 0;
				for (let j = 1; j < 100;) {
					if(j >= bobotNew){
						if(j != bobotKg){
							bobotKg = j;
						}
						j = 100;
					}else{
						j++;
					}
				}
				v.marketPlace['marketPlace'] = _w.toLowerCase();
				v.total.pemesanan.jumlahBobot = bobotKg;
				v.ongkir.description = v.originOther.shipService;
				v.ongkir.estimasi = '';
				v.status.proses = '';
				v['create'] = new Date(v.originOther.created);
			}
		});

		// let dmpData = [];
		let tOf = false;
		self.produkPost.transaksi[idGet] = [];
		self.produkPost.transaksi[idGet+'return'] = []
		// let dataCompare = angular.copy(self.dataAccount['transaksiImport'+self.aSelectMarket.name.toLowerCase()]);
		let dataCompare = self.default.data[UID]['transaksiImport'+_w];
		_foreach(dataHasilSeleksi, function (v2, k2, obj2) {
			if(v2.marketPlace.id){
				// //console.log('tOf before'+tOf)
				tOf = _existTransaction(v2,self.default.data[UID]['transaksiImport'+_w],_w);//checkExistTransaction
				// //console.log('tOf after'+tOf)
				if(tOf == false){
					// dmpData.push(v2);
					self.produkPost.transaksi[idGet].push(v2)
				}
			}
		});
		
		//console.log('dataHasilSeleksi1 :: '+dataHasilSeleksi.length+' dataCompare:'+dataCompare.length+' dmpData :: '+self.produkPost.transaksi[idGet].length)
		if(self.produkPost.transaksi[idGet].length > 0){
			//console.log(self.produkPost.transaksi[idGet].length+' data baru "'+idGet+'" di '+_w+' loaded!');
			saveOrder(idMarket,_w,UID);
			// callTime.getTransaction = true;
		}else{
			//console.log('Tidak ada transaksi baru "'+idGet+'" di '+_w+'!');
			// callTime.getTransaction = true;
			timerGet2.get--;
			timerGet2.status = true;
		}
	}else{
		//console.log('err :: ongkirGenerateData')
		// callTime.getTransaction = true;
		timerGet2.get--;
		timerGet2.status = true;
	}
};

function saveOrder(idMarket,_w,UID){
	let idGet = idMarket.i;
	if(self.produkPost.transaksi[idGet] && self.produkPost.transaksi[idGet].length > 0){
		// //console.log('saveOrder, dataSave:'+self.produkPost.transaksi[idGet].length+' idGet:'+idGet+' _w:'+_w+' UID:'+UID)
		timerGet1.get = 1;
		timerGet1.status = true;
		let transaksiCheck = true;
		let dataSave = self.produkPost.transaksi[idGet];
		let x = 0;
		setTimeout(function autoPutTransaction(){
			if(timerGet1.get > 0){
				if(timerGet1.status == true && dataSave[timerGet1.get-1]){
					// //console.log('transaksiCheck before'+transaksiCheck)
					transaksiCheck = _existTransaction(dataSave[timerGet1.get-1],self.default.data[UID]['transaksiImport'+_w],_w);
					timerGet1.status = false;
					// //console.log('transaksiCheck after'+transaksiCheck)
					if(transaksiCheck == false && (timerGet1.get-1) < dataSave.length){
						

						// //console.log('push data transaksi:'+(timerGet1.get-1));
						let dataConverUp = dataSave[timerGet1.get-1];
						let nd = new Date(dataConverUp.create);
						let idPO = nd.getDate()+
							('0' + (nd.getMonth() + 1)).slice(-2) +
							('0' + nd.getFullYear()).slice(-2)+
							('0' + nd.getMinutes()).slice(-2)+
							('0' + nd.getHours()).slice(-2);

						let coverPhpParams = {
							allData: self.allData.users[UID],
							allCustomer: self.allData.customers,
							u : UID,
							p : dataConverUp.customer.id,
							c : 'new',
							d : dataConverUp,
							code:idPO,
						};
						
						let getDataExtract = _saveOrder(coverPhpParams);
						if(getDataExtract){
							// //console.log('push '+getDataExtract.p)
							let dataPost = {
								pass: self._paramsData.pass,
								met: self._paramsData.met,
								p:getDataExtract.p,
								u:getDataExtract.u,
								c:getDataExtract.c,
								d:getDataExtract.d,
								code:getDataExtract.code,
								_w : 'import_transaction',
								code:idPO,
								access: self.access[UID].access
							};
							
							self.produkPost.transaksi[getDataExtract.p] = getDataExtract.d;
							
							// checkRoles
							let accessOrder = dataPost.access.Order;
							let accessRole = false;
							let countobj = 0;
							let existTableOrder = false;
							let tableDataOrder = '';
							if(self.allData.users[UID].order){
								tableDataOrder = self.allData.users[UID].order;
								_foreach(tableDataOrder,function (v, k, o) {
									if(v){
										_foreach(v,function (v1, k1, o1) {
											if(v1){
												countobj++;
											}
										});
									}
								});
								existTableOrder = true;
							}else{
								self.allData.users[UID].order = {};
							}

							if((accessOrder > countobj && accessOrder != false) || accessOrder == "unlimited"){
								accessRole = true;
							}

							// //console.log('accessOrder : '+accessOrder+', accessRole : '+accessRole+', countobj : '+countobj)
							if(accessRole == true){
								self.produkPost.transaksi[getDataExtract.p]['pushData'] = [];
								if(getDataExtract.d.updateMarketplace.length > 0){
									
									let newPostMarket = getDataExtract.d.updateMarketplace;
									// for (let index = 0; index < newPostMarket.length; index++) {
									// 	let aLink = db.ref(newPostMarket[index].link);
									// 	let pushData = aLink.push();
									// 	pushData.set(newPostMarket[index].data);
									// 	pushData.once("child_added").then(feedbackAdd => {//on("child_added", function(feedbackAdd) {
									// 		let postId = pushData.key;
									// 		self.produkPost.transaksi[getDataExtract.p]['pushData'].push({
									// 			key: feedbackAdd.key,
									// 			val: feedbackAdd.val()
									// 		});
									// 		self.default.data[UID]['transaksiImport'+_w].push(newPostMarket[index].data);
									// 		self.allData.users[UID].marketplace[_w]['transaksiImport'][postId] = newPostMarket[index].data;
									// 		self.allData.marketPlaceUser[UID].marketplace[_w]['transaksiImport'][postId] = newPostMarket[index].data;

									// 	});										
									// }
									let tmpPlus0 = true;
									let tmpLength0 = newPostMarket.length;
									let tmpIndex0 = 1;
									setTimeout(function saveDataOrder1(){
										if(tmpIndex0 > 0){
											if(tmpPlus0 == true && newPostMarket[tmpIndex0-1]){
												tmpPlus0 = false;
												let aLink = db.ref(newPostMarket[tmpIndex0-1].link);
												let pushData = aLink.push();
												pushData.set(newPostMarket[tmpIndex0-1].data);
												pushData.once("child_added").then(feedbackAdd => {
													let postId = pushData.key;
													self.produkPost.transaksi[getDataExtract.p]['pushData'].push({
														key: feedbackAdd.key,
														val: feedbackAdd.val()
													});
													self.default.data[UID]['transaksiImport'+_w].push(newPostMarket[tmpIndex0-1].data);
													self.allData.users[UID].marketplace[_w]['transaksiImport'][postId] = newPostMarket[tmpIndex0-1].data;
													self.allData.marketPlaceUser[UID].marketplace[_w]['transaksiImport'][postId] = newPostMarket[tmpIndex0-1].data;

													if((tmpIndex0-1) < tmpLength0){
														tmpPlus0 = true;
														tmpIndex0++;
													}else{
														tmpPlus0 = false;
														tmpIndex0 = 0;
													}

												});
												setTimeout(saveDataOrder1, 0);
											}else{
												if(!newPostMarket[tmpIndex0-1]){
													tmpPlus0 = false;
													tmpIndex0 = 0;
													setTimeout(saveDataOrder1, 0);
												}else{
													setTimeout(saveDataOrder1, 0);
												}
											}
										}else{
											//console.log('saveDataOrder1 finish')
										}
									},0);
								}
								if(getDataExtract.d.order.length > 0){
									
									let newPostOrder = getDataExtract.d.order;
									// for (let index = 0; index < newPostOrder.length; index++) {
									// 	let newCusID = newPostOrder[index].id_customer;
									// 	let newKey = newPostOrder[index].key_po; 
									// 	let newVal = newPostOrder[index].val_po;
										
									// 	if(existTableOrder == false){
									// 		// let createDataOrder1 = db.ref('users/'+UID);
									// 		let usersRef = usersDataDb.child(UID+'/order/'+newCusID);//createDataOrder1.child('order/'+newCusID);
									// 		usersRef.set({
									// 			[newKey]: newVal
									// 		});
									// 		usersRef.once("child_added").then(snapOrder => {//on("child_added", function(feedbackAdd) {
									// 			//console.log('data push ________________________________ 1 ')
									// 			self.allData.users[UID].order[newCusID] = {};
									// 			self.allData.users[UID].order[newCusID][newKey] = newVal;
									// 			if(self.allData.users[UID].order){
									// 				existTableOrder = true;
									// 			}else{
									// 				existTableOrder = false;
									// 			}

									// 			// index++;
									// 		});
									// 	}else{
									// 		if(self.allData.users[UID].order[newCusID]){
									// 			let aLink = db.ref(newPostOrder[index].link);
									// 			aLink.set(newVal);
									// 			aLink.once("child_added").then(snapOrder2 => {//on("child_added", function(feedbackAdd) {
									// 				//console.log('data push ________________________________ 2 ')
									// 				self.allData.users[UID].order[newCusID][newKey] = newVal;
									// 				if(self.allData.users[UID].order){
									// 					existTableOrder = true;
									// 				}else{
									// 					existTableOrder = false;
									// 				}

									// 				// index++;
									// 			});
									// 		}else{
									// 			// let createDataOrder2 = db.ref('users/'+UID);
									// 			let usersRef2 = usersDataDb.child(UID+'/order/'+newCusID);//createDataOrder2.child('order/'+newCusID);
									// 			usersRef2.set({
									// 				[newKey]: newVal
									// 			});

									// 			usersRef2.once("child_added").then(snapOrder3 => {//on("child_added", function(feedbackAdd) {
									// 				//console.log('data push ________________________________ 3 ')
									// 				self.allData.users[UID].order[newCusID] = {};
									// 				self.allData.users[UID].order[newCusID][newKey] = newVal;
									// 				if(self.allData.users[UID].order){
									// 					existTableOrder = true;
									// 				}else{
									// 					existTableOrder = false;
									// 				}

									// 				// index++;
									// 			});
									// 		}
									// 	}
									// }
									let tmpPlus1 = true;
									let tmpLength1 = newPostOrder.length;
									let tmpIndex1 = 1;
									setTimeout(function saveDataOrder2(){
										if(tmpIndex1 > 0){
											if(tmpPlus1 == true && newPostOrder[tmpIndex1-1]){
												tmpPlus1 = false;
												let newCusID = newPostOrder[tmpIndex1-1].id_customer;
												let newKey = newPostOrder[tmpIndex1-1].key_po; 
												let newVal = newPostOrder[tmpIndex1-1].val_po;
												if(existTableOrder == false){
													let usersRef = usersDataDb.child(UID+'/order/'+newCusID);
													usersRef.set({
														[newKey]: newVal
													});
													usersRef.once("child_added").then(snapOrder => {
														// //console.log('data push ________________________________ 1 ')
														self.allData.users[UID].order[newCusID] = {};
														self.allData.users[UID].order[newCusID][newKey] = newVal;
														if(self.allData.users[UID].order){
															existTableOrder = true;
														}else{
															existTableOrder = false;
														}
														if((tmpIndex1-1) < tmpLength1){
															tmpPlus1 = true;
															tmpIndex1++;
														}else{
															tmpPlus1 = false;
															tmpIndex1 = 0;
														}
													});
												}else{
													if(self.allData.users[UID].order[newCusID]){
														let aLink = db.ref(newPostOrder[tmpIndex1-1].link);
														aLink.set(newVal);
														aLink.once("child_added").then(snapOrder2 => {
															// //console.log('data push ________________________________ 2 ')
															self.allData.users[UID].order[newCusID][newKey] = newVal;
															if(self.allData.users[UID].order){
																existTableOrder = true;
															}else{
																existTableOrder = false;
															}
															if((tmpIndex1-1) < tmpLength1){
																tmpPlus1 = true;
																tmpIndex1++;
															}else{
																tmpPlus1 = false;
																tmpIndex1 = 0;
															}
														});
													}else{
														let usersRef2 = usersDataDb.child(UID+'/order/'+newCusID);
														usersRef2.set({
															[newKey]: newVal
														});

														usersRef2.once("child_added").then(snapOrder3 => {
															// //console.log('data push ________________________________ 3 ')
															self.allData.users[UID].order[newCusID] = {};
															self.allData.users[UID].order[newCusID][newKey] = newVal;
															if(self.allData.users[UID].order){
																existTableOrder = true;
															}else{
																existTableOrder = false;
															}
															if((tmpIndex1-1) < tmpLength1){
																tmpPlus1 = true;
																tmpIndex1++;
															}else{
																tmpPlus1 = false;
																tmpIndex1 = 0;
															}
														});
													}
												}
												setTimeout(saveDataOrder2, 0);
											}else{
												if(!newPostOrder[tmpIndex1-1]){
													tmpPlus1 = false;
													tmpIndex1 = 0;
													setTimeout(saveDataOrder2, 0);
												}else{
													setTimeout(saveDataOrder2, 0);
												}
											}
										}else{
											//console.log('saveDataOrder2 finish')
										}
									},0);
								}
								if(getDataExtract.d.produk.length > 0){
									
									let newPostProduk = getDataExtract.d.produk;
									// for (let index = 0; index < newPostProduk.length; index++) {

									// 	let newlink = newPostProduk[index].link;
									// 	let newval_stok = newPostProduk[index].val_stok; 
									// 	let newkey_stok = newPostProduk[index].key_stok;
									// 	let newid_produk = newPostProduk[index].id_produk;
									// 	let newVarian = newPostProduk[index].varian;
									// 	let aLink3 = db.ref(newlink);
									// 	aLink3.set(newval_stok);
									// 	aLink3.once("child_added").then(feedbackAdd => {//on("child_added", function(feedbackAdd) {
									// 		//console.log('update '+newid_produk+', '+newkey_stok)
									// 		self.allData.users[UID].produk[newid_produk].varian[newVarian].stok[newkey_stok] = newval_stok;
									// 	});							
									// }
									let tmpPlus2 = true;
									let tmpLength2 = newPostProduk.length;
									let tmpIndex2 = 1;
									setTimeout(function saveDataOrder3(){
										if(tmpIndex2 > 0){
											if(tmpPlus2 == true && newPostProduk[tmpIndex2-1]){
												tmpPlus2 = false;
												let newlink = newPostProduk[tmpIndex2-1].link;
												let newval_stok = newPostProduk[tmpIndex2-1].val_stok; 
												let newkey_stok = newPostProduk[tmpIndex2-1].key_stok;
												let newid_produk = newPostProduk[tmpIndex2-1].id_produk;
												let newVarian = newPostProduk[tmpIndex2-1].varian;
												let aLink3 = db.ref(newlink);
												aLink3.set(newval_stok);
												aLink3.once("child_added").then(feedbackAdd => {//on("child_added", function(feedbackAdd) {
													// //console.log('update '+newid_produk+', '+newkey_stok)
													self.allData.users[UID].produk[newid_produk].varian[newVarian].stok[newkey_stok] = newval_stok;

													if((tmpIndex2-1) < tmpLength2){
														tmpPlus2 = true;
														tmpIndex2++;
													}else{
														tmpPlus2 = false;
														tmpIndex2 = 0;
													}
												});
												setTimeout(saveDataOrder3, 0);
											}else{
												if(!newPostProduk[tmpIndex2-1]){
													tmpPlus2 = false;
													tmpIndex2 = 0;
													setTimeout(saveDataOrder3, 0);
												}else{
													setTimeout(saveDataOrder3, 0);
												}
											}
										}else{
											//console.log('saveDataOrder3 finish')
										}
									},0);
								}
								if((timerGet1.get-1) < dataSave.length){
									timerGet1.status = true;
									timerGet1.get++;
								}else{
									timerGet1.status = false;
									timerGet1.get = 0;
								}
							}else{
								if((timerGet1.get-1) < dataSave.length){
									timerGet1.status = true;
									timerGet1.get++;
								}else{
									timerGet1.status = false;
									timerGet1.get = 0;
								}
							}

							/*request.get({
								headers: {'content-type': 'application/json'},
								url: self._paramsData.uri+'3',
								json: { 'json' : dataPost },
								timeout:0
							},
							function(error, response, body){
								// self.produkPost.kategori.push(dataConverUp);
								//console.log('response request :: '+x);
								x = 0;
								if(!error && response.body){
									let _returns =  response.body;
									// self.produkPost.transaksi[idGet+'return'].push(_returns);
									//console.log('response push transaction ',_returns.status)
									if(_returns.status == true && (timerGet1.get-1) < dataSave.length){
										self.produkPost.transaksi[idGet+'return'].push(_returns);
										// self.produkPost.transaksi.push(_returns);//dataSave[timerGet1.get-1]);
										// let dataMarket = dataSave[timerGet1.get-1]['marketPlace']; 
										if(_returns.dataMarket && _returns.idMarketPlace){
											//console.log('ada marketplace')
											self.default.data[UID]['transaksiImport'+_w].push(_returns.dataMarket);
											self.allData.users[UID].marketplace[_w]['transaksiImport'][_returns.idMarketPlace] = _returns.dataMarket;
											self.allData.marketPlaceUser[UID].marketplace[_w]['transaksiImport'][_returns.idMarketPlace] = _returns.dataMarket;
										}else{
											//console.log('tidak ada marketplace')
										}
										timerGet1.status = true;
										timerGet1.get++;
									}else{
										// self.produkPost.transaksi.push({post:dataPost,ret:_returns,count:(timerGet1.get-1)});
										if((timerGet1.get-1) < dataSave.length){
											timerGet1.status = true;
											timerGet1.get++;
										}else{
											timerGet1.status = false;
											timerGet1.get = 0;
										}
									}
								}else{
									// timerGet1.status = false;
									// timerGet1.get = 0;
									if((timerGet1.get-1) < dataSave.length){
										timerGet1.status = true;
										timerGet1.get++;
									}else{
										timerGet1.status = false;
										timerGet1.get = 0;
									}
								}
								if (error){//.code === 'ETIMEDOUT' && error.connect === true){
									//console.log('ERRRRRRRRRRor time out',error);
								}
							});*/

						}else{
							//console.log('else push')
						}
					}else{
						timerGet1.get++;
						timerGet1.status = true;
						//console.log('id_produk exist')
					}
					setTimeout(autoPutTransaction, 0);
				}else{
					if(!dataSave[timerGet1.get-1]){
						timerGet1.status = false;
						timerGet1.get = 0;
						setTimeout(autoPutTransaction, 0);
					}else{
						setTimeout(autoPutTransaction, 0);
					}
					x++;
				}
			}else{
				//console.log('done upload transaction '+dataSave.length)
				timerGet2.get--;
				timerGet2.status = true;
				// self.aSelectGet = {id : '', name : 'Select option get'};
				// callTime.getTransaction = true;
			}
		},0);
	}else{
		//console.log('err :: saveOrder')
		// callTime.getTransaction = true;
		timerGet2.get--;
		timerGet2.status = true;
	}
};

function rolemembershipModify(data){
	let checkExist = false;
	let keymembership = 'local:membership';
	let categoryPayment = '';
	if(data){
		//console.log('ada data marketPlace')
	}else{
		//console.log('tidak ada data marketPlace')
		data = self.allData.marketPlaceUser;
	}
	if(self.access){
		_foreach(data, function (v, k, o) {
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
					//console.log('GET '+keymembership+' -> exist');
					checkExist = true;
					categoryPayment = JSON.parse(result);
				}else{
					//console.log('GET '+keymembership+' -> not exist');
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
											let dataAccGet = JSON.stringify(v1.access);
											if(dataAccGet == 'true'){// v1.access == true){
												self.access[k].access[k1] = 'unlimited';
											}else{
												self.access[k].access[k1] = v1.access;
											}
											
										}
									});
								}
							}
						});
						// generateAllDataMarket(req,res);
					});
				}else{
					_foreach(self.access, function (v, k, o) {
						if(v.membership){
							let getDataAccess = getDataByKeyVal(categoryPayment,'name',v.membership);
							if(getDataAccess){
								_foreach(getDataAccess.feature_list, function (v1, k1, o1) {
									if(v1){
										let dataAccGet = JSON.stringify(v1.access);
										if(dataAccGet == 'true' ){//v1.access == true){
											self.access[k].access[k1] = 'unlimited';
										}else{
											self.access[k].access[k1] = v1.access;
										}
										
									}
								});
							}
						}
					});
					// generateAllDataMarket(req,res);
				}

			});
		}else{
			//console.log('err rolemembershipModify')
			// viewDataCallbcak('error',req,res);
		}
	}else{
		//console.log('err rolemembershipModify')
		// viewDataCallbcak('error',req,res);
	}
};


function genderDataCustomer(dataHasilSeleksi,unikMailPhone,synceDataRegionTransaction,_w,UID,idMarket,where){
	let idGet = idMarket.i;
	timerGet1.get = 1;
	timerGet1.status = true;
	
	setTimeout(function getDataInfo(){
		if(timerGet1.get > 0){
			if(timerGet1.status == true && synceDataRegionTransaction[timerGet1.get-1]){
				
				let feed = {
					pass: self._paramsData.pass,
					met: self._paramsData.met,
					u : idMarket.i,
					p : idMarket.t,
					c : 'getInfoUser',
					d : synceDataRegionTransaction[timerGet1.get-1].marketPlace.userName,
					_w : _w
				};
				request.get({
					headers: {'content-type': 'application/json'},
					url: self._paramsData.uri+'3',
					json: { 'json' : feed },
					timeout:0
				},
				function(error, response, body){
					
					if(!error && response.body){
						let _returns =  response.body;
						//console.log('response get info gender ',_returns)
						if(_returns.status == true && (timerGet1.get-1) < synceDataRegionTransaction.length){
							if(_returns.data && (_returns.data == 'pria' || _returns.data == 'wanita')){
								//console.log('ada gender '+ _returns.data+', '+timerGet1.get+', '+synceDataRegionTransaction[timerGet1.get-1].marketPlace.userName)
								synceDataRegionTransaction[timerGet1.get-1].gender = _returns.data;
								unikMailPhone[timerGet1.get-1].identity.gender = _returns.data;
							}else{
								//console.log('data gender kosong'+', '+timerGet1.get+', '+synceDataRegionTransaction[timerGet1.get-1].marketPlace.userName)
								synceDataRegionTransaction[timerGet1.get-1].gender = 'pria';
								unikMailPhone[timerGet1.get-1].identity.gender = 'pria';
							}
						}else{
							synceDataRegionTransaction[timerGet1.get-1].gender = 'pria';
							unikMailPhone[timerGet1.get-1].identity.gender = 'pria';
						}
					}else{
						synceDataRegionTransaction[timerGet1.get-1].gender = 'pria';
						unikMailPhone[timerGet1.get-1].identity.gender = 'pria';
						//console.log('ERRRRRRRRRRor time out',error);
					}
					// self.produkPost.transaksi[idGet+'_cus'].push({
					// 	synceDataRegionTransaction:synceDataRegionTransaction[timerGet1.get-1],
					// 	unikMailPhone:unikMailPhone[timerGet1.get-1],
					// 	return:response.body
					// });
					
					if(where == 'transaksi'){
						// saveDataCustomer(synceDataRegionTransaction[timerGet1.get-1],unikMailPhone,where);
						// saveDataCustomer(listCust,dataHasilSeleksi,unikMailPhone,_w,UID,idMarket,where);
						if((timerGet1.get-1) < synceDataRegionTransaction.length){
							
							self.produkPost.transaksi[idGet+'_orderCus'].push({
								synceDataRegionTransaction:synceDataRegionTransaction[timerGet1.get-1],
								unikMailPhone:unikMailPhone[timerGet1.get-1],
								return:response.body
							});

							timerGet1.status = true;
							timerGet1.get++;
						}else{
							timerGet1.status = false;
							timerGet1.get = 0;
						}

					}else if(where == 'getCustomerBL'){
						if((timerGet1.get-1) < synceDataRegionTransaction.length){
							
							self.produkPost.transaksi[idGet+'_cus'].push({
								synceDataRegionTransaction:synceDataRegionTransaction[timerGet1.get-1],
								unikMailPhone:unikMailPhone[timerGet1.get-1],
								return:response.body
							});

							timerGet1.status = true;
							timerGet1.get++;
						}else{
							timerGet1.status = false;
							timerGet1.get = 0;
						}
					}
				});

				timerGet1.status = false;
				setTimeout(getDataInfo, 0);
			}else{
				if(!synceDataRegionTransaction[timerGet1.get-1]){
					timerGet1.status = false;
					timerGet1.get = 0;
					setTimeout(getDataInfo, 0);
				}else{
					setTimeout(getDataInfo, 0);
				}
			}
		}else{
			if(where == 'transaksi'){
				// self.finishingTransaction(dataHasilSeleksi);
				customerImport(dataHasilSeleksi,unikMailPhone,synceDataRegionTransaction,_w,UID,idMarket,where);
				//console.log('finishing euy')
				// timerGet2.get--;
				// timerGet2.status = true;
			}else if(where == 'getCustomerBL'){
				customerImport(dataHasilSeleksi,unikMailPhone,synceDataRegionTransaction,_w,UID,idMarket,where);
				// //console.log('done indfo')
				
			}
		}
	},0);
};

function customerImport(dataHasilSeleksi,unikMailPhone,synceDataRegionTransaction,_w,UID,idMarket,where){
	let listCust = [];
	if(synceDataRegionTransaction.length > 0){
		_foreach(synceDataRegionTransaction, function(v,k,o){
			if(v){
				v.nama = _upperCaseFirst(v.nama);
				listCust.push(v);
			}
		});
		if(listCust.length > 0){
			saveDataCustomer(listCust,dataHasilSeleksi,unikMailPhone,_w,UID,idMarket,where);
		}else{
			if(where == 'transaksi'){
				// self.finishingTransaction(dataHasilSeleksi);
				// timerGet2.get--;
				// timerGet2.status = true;
			}else if(where == 'getCustomerBL'){
				timerGet2.get--;
				timerGet2.status = true;
			}
		}
	}else{
		//console.log('err :: customerImport');
		if(where == 'transaksi'){
			// self.finishingTransaction(dataHasilSeleksi);
			timerGet2.get--;
			timerGet2.status = true;
		}else if(where == 'getCustomerBL'){
			timerGet2.get--;
			timerGet2.status = true;
		}
	}
};

self.newDataPostCus = [];
function saveDataCustomer(pushData,dataHasilSeleksi,unikMailPhone,_w,UID,idMarket,where){
	//console.log('saveDataCustomer '+pushData.length+' self.allData.customers before '+self.allData.customers.length)
	self.newDataPostCus = [];
	if(pushData.length > 0){
		if(self.access[UID]){
		}else{
			rolemembershipModify();
		}
		let accessPelanggan = self.access[UID].access.Pelanggan;
		let accessRole = false;
		let countobj = 0;
		let existTableOrder = false;
		let dataPelangganNew = {};
		if(self.allData.customers.length > 0){
			// tableDataPelanggan = ;
			_foreach(self.allData.customers,function (v, k, o) {
				if(v.origin){
					if(v.origin.idParentUser == UID){
						countobj++;
					}
				}
			});
			existTableOrder = true;
		}else{
			// self.allData.customers = {};
			//console.log('tidak ada list customers');
		}

		if((accessPelanggan > countobj && accessPelanggan != false) || accessPelanggan == "unlimited"){
			accessRole = true;
		}

		if(accessRole == true){
			let tmpPlus = true;
			let tmpLength = pushData.length;
			let tmpIndex = 1;
			setTimeout(function saveDataCusTimer(){
				if(tmpIndex > 0){
					if(tmpPlus == true && pushData[tmpIndex-1]){
						tmpPlus = false;
						let pushDataDB = allDataCustomer.push();
						pushDataDB.set(pushData[tmpIndex-1]);
						pushDataDB.once("child_added").then(snapCustomers => {
							let postId = pushDataDB.key;
							unikMailPhone[tmpIndex-1].id = postId; 
							dataPelangganNew[postId] = pushData[tmpIndex-1];

							let newDbLink = usersDataDb.child(UID+'/marketplace/'+_w+'/customerImport');
							let tmpIdpushCus = newDbLink.push();
							tmpIdpushCus.set(pushData[tmpIndex-1].marketPlace);
							tmpIdpushCus.once("child_added").then(snapImport => {
								//console.log('sukses upload customer '+tmpIndex+'==== '+postId+' :: '+tmpIdpushCus.key)
								self.newDataPostCus.push({
									keyCus: postId,
									valCus: pushData[tmpIndex-1],
									keyImport: tmpIdpushCus.key,
									valImport: pushData[tmpIndex-1].marketPlace,
								});

								self.default.data[UID]['customerImport'+_w].push(pushData[tmpIndex-1].marketPlace);
								self.allData.users[UID].marketplace[_w]['customerImport'][postId] = pushData[tmpIndex-1].marketPlace;
								self.allData.marketPlaceUser[UID].marketplace[_w]['customerImport'][postId] = pushData[tmpIndex-1].marketPlace;

								if((tmpIndex-1) < tmpLength){
									tmpPlus = true;
									tmpIndex++;
								}else{
									tmpPlus = false;
									tmpIndex = 0;
								}
							});
						});
						setTimeout(saveDataCusTimer, 0);
					}else{
						if(!pushData[tmpIndex-1]){
							tmpPlus = false;
							tmpIndex = 0;
							setTimeout(saveDataCusTimer, 0);
						}else{
							setTimeout(saveDataCusTimer, 0);
						}
					}
				}else{
					if(where == 'transaksi'){
						if(dataPelangganNew){
							filter_customer2(dataPelangganNew,where,tmpLength,dataHasilSeleksi,UID,_w,idMarket);
						}else{
							timerGet2.get--;
							timerGet2.status = true;
						}
						// finishingTransaction(dataHasilSeleksi,UID,_w,idMarket);
					}else if(where == 'getCustomerBL'){
						if(dataPelangganNew){
							filter_customer2(dataPelangganNew,where,tmpLength,dataHasilSeleksi,UID,_w,idMarket);
						}else{
							timerGet2.get--;
							timerGet2.status = true;
						}
					}
				}
			},0);
		}else{
			if(where == 'transaksi'){
				// self.finishingTransaction(dataHasilSeleksi);
				timerGet2.get--;
				timerGet2.status = true;
			}else if(where == 'getCustomerBL'){
				timerGet2.get--;
				timerGet2.status = true;
			}
		}
	}
};



// short function -------------
function getDataByKey(dataObject,searchkey){
    let _returns = '';
    _foreach(dataObject, function (v, k, o) {
        if(searchkey){
            if(k == searchkey){
                _returns = v;
            }
        }
    });
    return _returns;
};
function getDataByKeyVal(dataObject,searchkey,searchVal){
    let _returns = '';
    _foreach(dataObject, function (v, k, o) {
        if(searchVal && searchkey){
            if(v[searchkey] == searchVal){
                _returns = v;
            }
        }
    });
    return _returns;
};
function searchStringInArray(str, strArray) {
	let retUrnData = [];
	for (var j=0; j<strArray.length; j++) {
		if (strArray[j].match(str)){
			retUrnData.push(j);
		}
	}
	return retUrnData;
};

function stringToArray(str) {
	let retUrnData = str.split(' ')
	return retUrnData;
};

const parseJsonAsync = (jsonString) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(JSON.parse(jsonString))
    })
  })
};

app.get('/delete_customer', function(req, res, next) {
	let alldataCustomer = {};
	let dataAll =[];
	let tmp_dataCustomer = [];
	allDataCustomer.once('value', function(snapshot){
		alldataCustomer = snapshot.val();
		if(alldataCustomer){
			_foreach(alldataCustomer, function (v, k, o) {
				if(v.idParentUser == 'MsaXytEmXDNMHhrcwnYpoPJ3Pdy1'){
					tmp_dataCustomer.push({key: k, val: v});
				}
			});
		}
		//console.log('length cus '+tmp_dataCustomer.length)
		if(tmp_dataCustomer.length > 0){
			let tmpPlus = true;
			let tmpLength = tmp_dataCustomer.length;
			let tmpIndex = 1;
			setTimeout(function deleteCustomer(){
				if(tmpIndex > 0){
					if(tmpPlus == true && tmp_dataCustomer[tmpIndex-1]){
						tmpPlus = false;
						let delDataDB = db.ref('customer/'+tmp_dataCustomer[tmpIndex-1].key);
						delDataDB.remove()
						.then(function() {
							//console.log('remove success '+tmp_dataCustomer[tmpIndex-1].key);
							dataAll.push({[tmp_dataCustomer[tmpIndex-1].key]:'success'});
							if((tmpIndex-1) < tmpLength){
								tmpPlus = true;
								tmpIndex++;
							}else{
								tmpPlus = false;
								tmpIndex = 0;
							}
						})
						.catch(function(error) {
							//console.log('Error deleting data:', error);
							dataAll.push({[tmp_dataCustomer[tmpIndex-1].key]:'failed'});
							if((tmpIndex-1) < tmpLength){
								tmpPlus = true;
								tmpIndex++;
							}else{
								tmpPlus = false;
								tmpIndex = 0;
							}
						});
						setTimeout(deleteCustomer, 0);
					}else{
						if(!tmp_dataCustomer[tmpIndex-1]){
							tmpPlus = false;
							tmpIndex = 0;
							setTimeout(deleteCustomer, 0);
						}else{
							setTimeout(deleteCustomer, 0);
						}
					}
				}else{
					res.send(dataAll);			
				}
			},0);
		}else{
			res.send('tidak ada data customer');
		}

	});
});

app.get('/delete_allProduk', function(req, res, next) {
	let usersRef = usersDataDb.child('MsaXytEmXDNMHhrcwnYpoPJ3Pdy1/produk');
	let alldataCustomer = {};
	let dataAll =[];
	let tmp_dataCustomer = [];
	usersRef.once('value', function(snapshot){
		alldataCustomer = snapshot.val();
		if(alldataCustomer){
			_foreach(alldataCustomer, function (v, k, o) {
				if(v){//} == 'MsaXytEmXDNMHhrcwnYpoPJ3Pdy1'){
					tmp_dataCustomer.push({key: k, val: v});
				}
			});
		}
		//console.log('length cus '+tmp_dataCustomer.length)
		if(tmp_dataCustomer.length > 0){
			let tmpPlus = true;
			let tmpLength = tmp_dataCustomer.length;
			let tmpIndex = 1;
			setTimeout(function deleteCustomer(){
				if(tmpIndex > 0){
					if(tmpPlus == true && tmp_dataCustomer[tmpIndex-1]){
						tmpPlus = false;
						let delDataDB = usersDataDb.child('MsaXytEmXDNMHhrcwnYpoPJ3Pdy1/produk/'+tmp_dataCustomer[tmpIndex-1].key);//db.ref('customer/'+tmp_dataCustomer[tmpIndex-1].key);
						delDataDB.remove()
						.then(function() {
							//console.log('remove success '+tmp_dataCustomer[tmpIndex-1].key);
							dataAll.push({[tmp_dataCustomer[tmpIndex-1].key]:'success'});
							if((tmpIndex-1) < tmpLength){
								tmpPlus = true;
								tmpIndex++;
							}else{
								tmpPlus = false;
								tmpIndex = 0;
							}
						})
						.catch(function(error) {
							//console.log('Error deleting data:', error);
							dataAll.push({[tmp_dataCustomer[tmpIndex-1].key]:'failed'});
							if((tmpIndex-1) < tmpLength){
								tmpPlus = true;
								tmpIndex++;
							}else{
								tmpPlus = false;
								tmpIndex = 0;
							}
						});
						setTimeout(deleteCustomer, 0);
					}else{
						if(!tmp_dataCustomer[tmpIndex-1]){
							tmpPlus = false;
							tmpIndex = 0;
							setTimeout(deleteCustomer, 0);
						}else{
							setTimeout(deleteCustomer, 0);
						}
					}
				}else{
					res.send(dataAll);			
				}
			},0);
		}else{
			res.send('tidak ada data produk');
		}

	});
});

app.get('/delete_allktg', function(req, res, next) {
	let usersRef = usersDataDb.child('MsaXytEmXDNMHhrcwnYpoPJ3Pdy1/kategoriProduk');
	let alldataCustomer = {};
	let dataAll =[];
	let tmp_dataCustomer = [];
	usersRef.once('value', function(snapshot){
		alldataCustomer = snapshot.val();
		if(alldataCustomer){
			_foreach(alldataCustomer, function (v, k, o) {
				if(v){//} == 'MsaXytEmXDNMHhrcwnYpoPJ3Pdy1'){
					tmp_dataCustomer.push({key: k, val: v});
				}
			});
		}
		//console.log('length cus '+tmp_dataCustomer.length)
		if(tmp_dataCustomer.length > 0){
			let tmpPlus = true;
			let tmpLength = tmp_dataCustomer.length;
			let tmpIndex = 1;
			setTimeout(function deleteCustomer(){
				if(tmpIndex > 0){
					if(tmpPlus == true && tmp_dataCustomer[tmpIndex-1]){
						tmpPlus = false;
						let delDataDB = usersDataDb.child('MsaXytEmXDNMHhrcwnYpoPJ3Pdy1/kategoriProduk/'+tmp_dataCustomer[tmpIndex-1].key);//db.ref('customer/'+tmp_dataCustomer[tmpIndex-1].key);
						delDataDB.remove()
						.then(function() {
							//console.log('remove success '+tmp_dataCustomer[tmpIndex-1].key);
							dataAll.push({[tmp_dataCustomer[tmpIndex-1].key]:'success'});
							if((tmpIndex-1) < tmpLength){
								tmpPlus = true;
								tmpIndex++;
							}else{
								tmpPlus = false;
								tmpIndex = 0;
							}
						})
						.catch(function(error) {
							//console.log('Error deleting data:', error);
							dataAll.push({[tmp_dataCustomer[tmpIndex-1].key]:'failed'});
							if((tmpIndex-1) < tmpLength){
								tmpPlus = true;
								tmpIndex++;
							}else{
								tmpPlus = false;
								tmpIndex = 0;
							}
						});
						setTimeout(deleteCustomer, 0);
					}else{
						if(!tmp_dataCustomer[tmpIndex-1]){
							tmpPlus = false;
							tmpIndex = 0;
							setTimeout(deleteCustomer, 0);
						}else{
							setTimeout(deleteCustomer, 0);
						}
					}
				}else{
					res.send(dataAll);			
				}
			},0);
		}else{
			res.send('tidak ada data kategori');
		}

	});
});

app.get('/checkKtg', function(req, res, next) {
	let alldata = {};
	let tmp_data = [];
	let usersRef = usersDataDb.child('MsaXytEmXDNMHhrcwnYpoPJ3Pdy1/produk');
	usersRef.once('value', function(snapshot){
		alldata = snapshot.val();
		if(alldata){
			_foreach(alldata, function (v, k, o) {
				if(v.kategori){
					tmp_data.push({key: k, val: v.kategori});
				}
			});
		}
		if(tmp_data.length > 0){
			//console.log('length ktg '+tmp_data.length)
			res.send(tmp_data);			
		}else{
			res.send('tidak ada data Ktg');
		}

	});
});