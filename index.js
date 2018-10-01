'use strict';
let qs = require('querystring');

let express = require('express');
let https = require('https');
let http = require('http');
let request = require('request');
let path = require('path');
let fs = require('fs');
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
}
let timerGet1 = {
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

let dirReplace = ''; // set __dirname

exports._setOption = function(params){
	options.key = params.key;
	options.cert = params.cert;
	options.ca = params.ca;
	console.log('_setOption');
};

exports._setDirname = function(a){
	dirReplace = a;
	console.log('_setDirname');
};

exports._setRedisOption = function(b){
	redisOption.key = b.key;
	redisOption.key2 = b.key2;
	redisOption.val = b.val;
	redisOption.status = b.status;
  	console.log('_setRedisOption');
};

exports._setDataBase = function(c){
	serviceAccount = require(c.serviceAcc);
	databaseURL = c.databaseURL;
  	console.log('_setDataBase');
};

exports._setDataAccess = function(d){
	access_data.key = d.key;
	access_data.met = d.met;
  	console.log('_setDataAccess');
};


let INDEX = path.join(dirReplace, '/index.html');

// SocketIO
let server = '';//https.createServer(options, app);
let io = '';//require('socket.io')(server);
let connections = [];
let botStatusServer = true;

//set active listener
exports._setactivePort = function(){
	console.log('_setactivePort');
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
	// redis
	clientRedis.on('connect', function() {
		console.log('clientRedis connected');
	});

	clientRedis.on('error', function (err) {
		console.log('clientRedis something went wrong ' + err);
	});

	server = https.createServer(options, app);
	io = require('socket.io')(server);
	
	server.listen(PORT, function(req,res){
		console.log("listening @ port:",PORT);
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
	console.log('marketPlaceJobsApi :: ');
	  getData(req,res,'get',self._paramsData.uri,dataAwal,'allData');
	  
  }else{
	console.log('err marketPlaceJobsApi :: ');
	self.redis = { key:redisOption.key, key2:redisOption.key2, val:redisOption.val, status:redisOption.status};
	viewDataCallbcak('marketplace-dna work',req,res);
  }
});

function getData(req,res,met,baseUrl,dataPost,where){
	if(met == 'get'){
		self.redis = { key:redisOption.key, key2:redisOption.key2, val:redisOption.val, status:redisOption.status};
		generateLocalMap();
		let checkExist = false;
		let dataTmpRedis = '';
		clientRedis.get(self.redis.key, function (error, result) {
			if (result) {
				console.log('GET result -> exist');
					dataTmpRedis = JSON.parse(result);
					checkExist = false;//true;
					self.redis.status = 'update';
			}else{
				console.log('GET result -> not exist');
				self.redis.status = 'create';
			}
			if(checkExist == true){
				if(dataPost.pass == access_data.key && dataPost.met == access_data.met){
					console.log('GET result checkExist -> exist '+where);
					routeCalback(req,res,dataTmpRedis,where);
				}else{
					console.log('wrong access!');
					viewDataCallbcak('error',req,res);
				}
			}else{
				console.log('GET result checkExist -> not exist');
				if(dataPost.pass == access_data.key && dataPost.met == access_data.met){
					let tmp_dataMarket = {};
					let tmp_dataCustomer = {};
					let allDataUsers_tmp = {};
					let alldataCustomer = {};
					usersDataDb.once("value", function(snapshot) {
						allDataUsers_tmp = snapshot.val();
						objectForeach(allDataUsers_tmp, function (v, k, obj) {
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
								// res.send(postData);
								routeCalback(req,res,postData,where);
							}else{
								console.log('wrong access!');
								viewDataCallbcak('error',req,res);
							}
						});
					});
				}else{
					console.log('wrong access!');
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
				// 				console.log('getData '+feedback.existdbRedistCron)
				// 				routeCalback(req,res,feedback.self_data,where);
				// 			}
				// 		},0);
				// 	}else{
				// 		console.log('err getData -> '+where+' :: '+error);
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
			generateAllDataMarket(req,res);
		}else{
			console.log('err routeCalback allData')
			viewDataCallbcak('error',req,res);
		}
	}else{
		console.log('error routeCalback')
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
			objectForeach(data, function (val, prop, obj) {
				if(val.marketplace){
					self.default.id.push(prop);
					self.default.data[prop] = {};
					// self.val = val;
					// profile/brand data extract
					if(val.identityBisnis){
						self.default.data[prop].brand = {};
						objectForeach(val.identityBisnis, function (val1, prop1, obj1) {
							if(val1){
								self.default.data[prop][prop1] = {};
								objectForeach(val1, function (val2, prop2, obj2) {
									if(val2.marketPlace){
										self.default.data[prop][prop1][prop2] = val2;
									}
								});	
							}
						});
					}else{
						console.log('tidak ada brand '+prop)
						self.default.data[prop].brand = {};
						objectForeach(val.supplier, function (val1, prop1, obj1) {
							if(val1){
								objectForeach(val1, function (val2, prop2, obj2) {
									if(val2){
										self.default.data[prop].brand[prop2] = val2;
									}
								});
							}
						});
					}
					// produk data default extract
					if(val.produk){
						// let tmpCheckExistProduk = [];
						self.default.data[prop].produk = {}
						self.default.data[prop].produkList = [];
						// self.default.data[prop].produkMarketplace = []; // for check produk exist
						let x = 0;
						objectForeach(val.produk, function (val1, prop1, obj1) {
							if(val1){
								x++;//tmpCheckExistProduk.push({[prop1] : val1});
								if(val1.marketPlace){
									self.default.data[prop].produk[prop1] = val1;
									self.default.data[prop].produkList.push({
										id:prop1,
										data_detail:val1,
										id_produk:val1.marketPlace.id_produk
									});
									// self.default.data[prop].produkMarketplace.push(val1.marketPlace);
								}
							}
						});
						console.log('ada produk '+x+' selection produk ');//+self.default.data[prop].produkMarketplace.length);
						if(x == 0 ){//tmpCheckExistProduk.length == 0){
							self.allData.users[prop].produk = {};
							self.allData.marketPlaceUser[prop].produk = {};
						}
					}else{
						self.default.data[prop].produk = {};
					}
					// kategori data default extract
					if(val.kategoriProduk){
						self.default.data[prop].kategoriProduk = {};
						let tmpCheckExistKtg = [];
						objectForeach(val.kategoriProduk, function (val1, prop1, obj1) {
							if(val1){
								self.default.data[prop].kategoriProduk[prop1] = val1;
								tmpCheckExistKtg.push({[prop1] : val1});
							}
						});
						if(tmpCheckExistKtg.length == 0){
							self.allData.users[prop].kategoriProduk = {};
							self.allData.marketPlaceUser[prop].kategoriProduk = {};
							// self.default.data[prop].kategoriProduk = {};
						}
					}else{
						self.default.data[prop].kategoriProduk = {};
						console.log('tidak ada kategoriProduk '+prop)
					}
					// marketPlace data extract
					if(val.marketplace){
						objectForeach(val.marketplace, function (val1, prop1, obj1) {
							if(val1){
								self.default.data[prop]['account'+prop1] = [];
								self.default.data[prop]['produkImport'+prop1] = [];
								self.default.data[prop]['transaksiImport'+prop1] = [];
								self.default.data[prop]['customerImport'+prop1] = [];
								objectForeach(val1, function (val2, prop2, obj2) {
									if(prop2 == 'produkImport' || prop2 == 'transaksiImport' || prop2 == 'customerImport'){
										if(prop2 == 'produkImport'){
											objectForeach(val2, function (val3, prop3, obj3) {
												if(val3){
													self.default.data[prop]['produkImport'+prop1].push(val3);
												}
											});
										}else if(prop2 == 'transaksiImport'){
											objectForeach(val2, function (val3, prop3, obj3) {
												if(val3){
													self.default.data[prop]['transaksiImport'+prop1].push(val3);
												}
											});
										}else if(prop2 == 'customerImport'){
											objectForeach(val2, function (val3, prop3, obj3) {
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
								}else{
									console.log('account '+self.default.data[prop]['account'+prop1].length)
								}
								if(self.default.data[prop]['produkImport'+prop1].length == 0){
									self.default.data[prop]['produkImport'+prop1] = [];
									self.allData.users[prop].marketplace[prop1]['produkImport'] = {};
									self.allData.marketPlaceUser[prop].marketplace[prop1]['produkImport'] = {};
								}else{
									console.log('produkImport '+self.default.data[prop]['produkImport'+prop1].length)
								}
								if(self.default.data[prop]['transaksiImport'+prop1].length == 0){
									self.default.data[prop]['transaksiImport'+prop1] = [];
									self.allData.users[prop].marketplace[prop1]['transaksiImport'] = {};
									self.allData.marketPlaceUser[prop].marketplace[prop1]['transaksiImport'] = {};
								}else{
									console.log('transaksiImport '+self.default.data[prop]['transaksiImport'+prop1].length)
								}
								if(self.default.data[prop]['customerImport'+prop1].length == 0){
									self.default.data[prop]['customerImport'+prop1] = [];
									self.allData.users[prop].marketplace[prop1]['customerImport'] = {};
									self.allData.marketPlaceUser[prop].marketplace[prop1]['customerImport'] = {};
								}else{
									console.log('customerImport '+self.default.data[prop]['customerImport'+prop1].length)
								}
							}
						});
					}
				}

			});
			// res.send(self);
			// return;
			if(self.default.id.length > 0){
				timerGet.timeC = 0;//self.default.id.length;//1;
				timerGet.status = true;
				timerGet.lData = 0;
				// self.getdata = {};
				setTimeout(function allData(){
					if(self.default.id[timerGet.timeC]){

						let id = self.default.id[timerGet.timeC];
						callTime.getProdukSale = true;//false;
						callTime.getProdukNotSale = true;//false;
						callTime.getTransaction = false;

						if(self.default.data[id].accountbukalapak){
							if(self.default.data[id].accountbukalapak.length > 0){//[self.default.id[timerGet.lData]].accountbukalapak){
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
												// res.send(self);
												// return;
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
												callTime.getProdukSale = true;//false;
												callTime.getProdukNotSale = true;//false;
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
								// acc data == 0
								timerGet.status = false;
								timerGet.timeC++;
								setTimeout(allData,0);
							}
						}else{
							// acc data == 0
							timerGet.status = false;
							timerGet.timeC++;
							setTimeout(allData,0);
						}						
					}else{
						console.log('finis all load');
						viewDataCallbcak(self,req,res);
					}
				},0);
			}else{
				console.log('err :: data users marketPlaceUser '+self.default.id.length);
				viewDataCallbcak(self,req,res);
			}
		}else{
			console.log('err :: self data marketPlaceUser 0')
			viewDataCallbcak('error',req,res);
		}
	}else{
		console.log('err generateAllDataMarket')
		viewDataCallbcak('error',req,res);
	}
};

//object forech function
function objectForeach(obj, callback) {
    Object.keys(obj).forEach(function (prop) {
        callback(obj[prop], prop, obj);
    });
    return obj;
};

//replace text 
function replaceText(obj){
	let replaceText = JSON.stringify(obj);
	replaceText = replaceText.replace(/@_@/g, '/');
	replaceText = replaceText.replace(/<br>/gi, " ");
	replaceText = replaceText.replace(/<br\s\/>/gi, " ");
	replaceText = replaceText.replace(/<br\/>/gi, " ");
	replaceText = replaceText.replace(/<p[^>]*>/gi, " ");
	replaceText = replaceText.replace(/<a.*href="(.*?)".*>(.*?)<\/a>/gi, " $2 ($1)");
	replaceText = replaceText.replace(/<script.*>[\w\W]{1,}(.*?)[\w\W]{1,}<\/script>/gi, "");
	replaceText = replaceText.replace(/<style.*>[\w\W]{1,}(.*?)[\w\W]{1,}<\/style>/gi, "");
	replaceText = replaceText.replace(/<(?:.|\s)*?>/g, "");
	replaceText = replaceText.replace(/(?:(?:\r\n|\r|\n)\s*){2,}/gim, " ");
	replaceText = replaceText.replace(/ +(?= )/g,'');
	replaceText = replaceText.replace(/&nbsp;/gi," ");
	replaceText = replaceText.replace(/&amp;/gi,"&");
	replaceText = replaceText.replace(/&quot;/gi,'"');
	replaceText = replaceText.replace(/&lt;/gi,'<');
	replaceText = replaceText.replace(/&gt;/gi,'>');
	replaceText = replaceText.replace(/<\s*br\/*>/gi, " ");
	replaceText = replaceText.replace(/<\s*a.*href="(.*?)".*>(.*?)<\/a>/gi, " $2 (Link->$1) ");
	replaceText = replaceText.replace(/<\s*\/*.+?>/ig, " ");
	replaceText = replaceText.replace(/ {2,}/gi, " ");
	replaceText = replaceText.replace(/\n+\s*/gi, " ");
	replaceText = replaceText.replace(/(?:\\[rn]|[\r\n]+)+/g, "");
	replaceText = JSON.parse(replaceText);
	return replaceText;
};


function getProdukSaleNotsale(dataTmpAcc,c,_w,UID){
	// self.getdata[dataTmpAcc.i][c] = [];
	let allData = [];
	timerGet1.get = 1;
	timerGet1.status = true;
	setTimeout(function getData(){
		if(timerGet1.get > 0){
			if(timerGet1.status == true){
				let dataPost = qs.stringify({
					pass: self._paramsData.pass,
					met: self._paramsData.met,
					u : dataTmpAcc.i,
					p : dataTmpAcc.t,
					c : c,
					d : timerGet1.get,
					_w : _w
				});
				// console.log('get_ '+_w+' '+c+' '+dataPost);
				request.get({
					headers: {'content-type': 'application/x-www-form-urlencoded'},
					url: self._paramsData.uri+'2?'+dataPost,
					body: dataPost
				}, function(error, response, body){
					if(!error && response.body){
						let _returns =  JSON.parse(response.body);
						let feedback = [];
						if(_returns.status == true && _returns.data){
							// console.log(_w+' '+_returns.data.length)
							if(_returns.data.length > 0){
								feedback = replaceText(_returns.data);
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
							console.log('error call '+c+' '+_w+' : '+dataTmpAcc.i);
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
	// self.getdata[dataTmpAcc.i][c] = {};
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

				let dataPost = {//qs.stringify({
					pass: self._paramsData.pass,
					met: self._paramsData.met,
					u : dataTmpAcc.i,
					p : dataTmpAcc.t,
					c : c,
					d : timerGet1.get,
					_w : _w
				};//);
				request.get({
					headers: {'content-type': 'application/json'},
					url: self._paramsData.uri+'3',
					json: { 'json' : dataPost }
				},
				// console.log('transaksi '+dataPost)
				// request.get({
				// 	headers: {'content-type': 'application/x-www-form-urlencoded'},
				// 	url: self._paramsData.uri+'2?'+dataPost,
				// 	body: dataPost
				// }, 
				function(error, response, body){
					if(!error && response.body){
						let _returns =  response.body;//JSON.parse(response.body);
						
						let feedback = [];
						if(_returns.status == true && _returns.data){
							console.log(c+' '+_returns.data.length)
							if(_returns.data.length > 0){
								feedback = replaceText(_returns.data);
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
							console.log('error call '+c+' '+_w+' : '+dataTmpAcc.i);
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
				// callTime.getTransaction = true;
				// console.log(c+' '+_w+' '+dataTmpAcc.i+'loaded');
				
				// pemecahan customer, transaksi berhasil, transaksi gagal & produk;
				// getTransactionSellerFailed
				// getTransactionSellerSuccess
				// getCustomerBL
				// call extractor transaksion
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
function generateProduk(a,id,c,_w,allData,UID){
	console.log('all data '+allData.length+' a '+a+' _w '+_w)
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
	}

	if(self.default.data[UID].brand){
		objectForeach(self.default.data[UID].brand, function (v, k, obj) {
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
							let grosir = [];
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
									objectForeach(v.product_sku, function (vPprodSku, kPprodSku, obj) {
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
						console.log('prod else set')
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
						objectForeach(feedback, function (v, k, obj) {
							if(v.marketPlace.id_produk){
								tOf = checkExistProduk(v,self.default.data[UID]['produkImport'+_w],_w);
								if(tOf == false){
									self.getdata[id][c].push(v);
								}
							}
						});
						
						if(self.getdata[id][c].length > 0 ){
							console.log('ada data baru '+id+' di '+_w+' loaded!');
							if(c == 'getProdukSale'){
								checkKtg(self.getdata[id][c],a,UID,c,_w);
							}
							if(c == 'getProdukNotSale'){
								checkKtg(self.getdata[id][c],a,UID,c,_w);
							}
						}else{
							console.log('Tidak ada data baru '+id+' di '+_w+' loaded!');
							if(c == 'getProdukSale'){
								callTime.getProdukSale = true;
							}
							if(c == 'getProdukNotSale'){
								callTime.getProdukNotSale = true;
							}
						}
					}else if(a == 'transaksi'){
						self.regulasiData.dataList = feedback;
					}
				}else{
					if(a == 'produk'){
						console.log(id+' tidak mempunyai data produk di '+_w+'!');
						if(c == 'getProdukSale'){
							callTime.getProdukSale = true;
						}
						if(c == 'getProdukNotSale'){
							callTime.getProdukNotSale = true;
						}
					}else if(a == 'transaksi'){
						self.regulasiData.dataList = feedback;
					}
				}
			}
		},0);
	}else{
		console.log('err get brand '+id);
		if(c == 'getProdukSale'){
			callTime.getProdukSale = true;
		}
		if(c == 'getProdukNotSale'){
			callTime.getProdukNotSale = true;
		}
	}
};

// check kategori
function checkKtg(data,where,UID,c,_w){
	console.log('checkKtg '+data.length)
	let ktg = [];
	let ktgArr = [];
	let ktgUpload = [];
	let uniqueNames =  [];
	// let tmpCheckExistKtg = [];
	if(data.length > 0){
		objectForeach(data, function (v, k, obj) {
			if(v.kategori){
				ktg.push(v.kategori);
			}
		});
	}

	ktg = unique_array(ktg);

	if(self.default.data[UID].kategoriProduk){
		objectForeach(self.default.data[UID].kategoriProduk, function (v, k, obj) {
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
		timerGet1.get = 1;
		timerGet1.status = true;
		let x = 0;
		setTimeout(function getData(){
			if(timerGet1.get > 0){
				if(timerGet1.status == true && ktgUpload[timerGet1.get-1]){

					let dataConverUp = ktgUpload[timerGet1.get-1];//JSON.stringify(ktgUpload[timerGet1.get-1]);
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
					});
					timerGet1.status = false;
					setTimeout(getData, 0);
				}else{
					if(!ktgUpload[timerGet1.get-1]){
						timerGet1.status = false;
						timerGet1.get = 0;
						setTimeout(getData, 0);
					}else{
						setTimeout(getData, 0);
					}
				}
			}else{
				console.log(ktgUpload.length+' kategori baru upload -> '+x);
				saveContinue(data,where,UID,c,_w);
			}
		},0);
	}else{
		console.log('tidak ada ktg baru')
		saveContinue(data,where,UID,c,_w);
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
	clientRedis.get(self.redis.key, function (error, result) {
		if (result) {
			console.log('GET result -> exist');
				// self.redis.val = JSON.parse(result);
				// self.allData = JSON.parse(result);
				checkExist = true;
		}else{
			console.log('GET result -> not exist');
		}
		if(checkExist == false){
			if(self.redis.status == 'create' && data){
				console.log('create redis');
				clientRedis.set(self.redis.key, JSON.stringify(data), redis.print);//JSON.stringify(self.redis.val), redis.print);
				clientRedis.expireat(self.redis.key, parseInt((+new Date)/1000) + 86400);
				self.redis.status = 'update';
				self.redis.val = data;
			}
		}else{
			if(self.redis.status == 'update' && data){
				console.log('update redis');
				clientRedis.set(self.redis.key, JSON.stringify(data), redis.print);
				clientRedis.expireat(self.redis.key, parseInt((+new Date)/1000) + 86400);
				self.redis.val = data;
			}
		}
	});
	timerGet1.get = 0;
};

function saveContinue(data,where,UID,c,_w){
	// return;
	if(data.length > 0){

		objectForeach(data, function (v, k, obj) {
			if(v.kategori){
				if(self.default.data[UID].kategoriProduk){
					objectForeach(self.default.data[UID].kategoriProduk, function (v1, k1, obj1) {
						if(v1.kategori.toLowerCase() == v.kategori.toLowerCase()){
							v.kategori = k1;
						}
					});
				}
			}
		});
		
		timerGet1.get = 1;
		timerGet1.status = true;
		let y = 0;
		let produkPostStatus = true;
		setTimeout(function getData(){
			if(timerGet1.get > 0){
				if(timerGet1.status == true && data[timerGet1.get-1]){
					produkPostStatus = checkExistProduk(data[timerGet1.get-1],self.default.data[UID]['produkImport'+_w],_w);
					if(produkPostStatus == false && (timerGet1.get-1) < data.length){
						let dataConverUp = data[timerGet1.get-1];
						let dataProduk = '';
						if(self.allData.users[UID].produk){
							dataProduk = self.allData.users[UID].produk;
						}
						let dataPost = {
							pass: self._paramsData.pass,
							met: self._paramsData.met,
							u : UID,
							p : dataProduk,
							c : 'newProduk',
							d : dataConverUp,
							_w : 'import_produk'
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
						});
						timerGet1.status = false;
					}else{
						timerGet1.get++;
						timerGet1.status = true;
						console.log('id_produk exist')
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
				console.log(data.length+' '+c+' baru uploaded -> '+y);
				if(c == 'getProdukSale'){
					callTime.getProdukSale = true;
				}
				if(c == 'getProdukNotSale'){
					callTime.getProdukNotSale = true;
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
	}
};

self.produkPost = {produk:[],kategori:[],transaksi:{}};

// check produk exist
function checkExistProduk(dataCheck,dataForcheck,_w){
	let tOf = false;
	if(_w.toLowerCase() == 'bukalapak'){
		if(dataCheck.marketPlace.id_produk){
			tOf = false;
			if(dataForcheck.length > 0){
				objectForeach(dataForcheck, function (v1, k, obj) {
					if(v1.id_produk == dataCheck.marketPlace.id_produk){
						tOf = true;
					}
				});
			}
		}
	}
	return tOf;
};

function extractTransaction(idMarket,c,_w,UID){
	let pushDataTable = false;
    let feedback = [];
	let dataHasilSeleksi = [];
	let idGet = idMarket.i;
	// console.log(c,idMarket,self.getdata[idGet])
	// self.dataTransactions.dataPost = [];
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
		objectForeach(pending, function (v, k, obj) {
			if(v){
				getTransactionSellerFailed.push(v);
			}
		});
	}
	if(addressed.length > 0){
		objectForeach(addressed, function (v, k, obj) {
			if(v){
				// getTransactionSellerFailed.push(v);
			}
		});
	}
	if(payment_chosen.length > 0){
		objectForeach(payment_chosen, function (v, k, obj) {
			if(v){
				getTransactionBuyerFailed.push(v);
			}
		});
	}
	if(confirm_payment.length > 0){
		objectForeach(confirm_payment, function (v, k, obj) {
			if(v){
				getTransactionSellerFailed.push(v);
				getTransactionBuyerFailed.push(v);
				getCustomerBL.push(v);
			}
		});
	}
	if(paid.length > 0){
		objectForeach(paid, function (v, k, obj) {
			if(v){
				getTransactionSellerSuccess.push(v);
				getTransactionBuyerSuccess.push(v);
				getCustomerBL.push(v);
			}
		});
	}
	if(delivered.length > 0){
		objectForeach(delivered, function (v, k, obj) {
			if(v){
				getTransactionSellerSuccess.push(v);
				getTransactionBuyerSuccess.push(v);
				getCustomerBL.push(v);
			}
		});
	}
	if(received.length > 0){
		objectForeach(received, function (v, k, obj) {
			if(v){
				getTransactionSellerSuccess.push(v);
				getTransactionBuyerSuccess.push(v);
				getCustomerBL.push(v);
			}
		});
	}
	if(remitted.length > 0){
		objectForeach(remitted, function (v, k, obj) {
			if(v){
				getTransactionSellerSuccess.push(v);
				getTransactionBuyerSuccess.push(v);
				getCustomerBL.push(v);
			}
		});
	}
	if(rejected.length > 0){
		objectForeach(rejected, function (v, k, obj) {
			if(v){
				getTransactionSellerFailed.push(v);
				getTransactionBuyerFailed.push(v);
				getCustomerBL.push(v);
			}
		});
	}
	if(cancelled.length > 0){
		objectForeach(cancelled, function (v, k, obj) {
			if(v){
				getTransactionSellerFailed.push(v);
				getTransactionBuyerFailed.push(v);
				getCustomerBL.push(v);
			}
		});
	}
	if(expired.length > 0){
		objectForeach(expired, function (v, k, obj) {
			if(v){
				getTransactionSellerFailed.push(v);
				getTransactionBuyerFailed.push(v);
				getCustomerBL.push(v);
			}
		});
	}
	if(refunded.length > 0){
		objectForeach(refunded, function (v, k, obj) {
			if(v){
				getTransactionSellerFailed.push(v);
				getTransactionBuyerFailed.push(v);
				getCustomerBL.push(v);
			}
		});
	}

	// self.getdata[idGet]['getTransactionSellerFailed'] = getTransactionSellerFailed;
	self.getdata[idGet]['getTransactionSellerSuccess'] = getTransactionSellerSuccess;
	self.getdata[idGet]['getTransactionBuyerFailed'] = getTransactionBuyerFailed;
	self.getdata[idGet]['getTransactionBuyerSuccess'] = getTransactionBuyerSuccess;
	self.getdata[idGet]['getCustomerBL'] = getCustomerBL;

	if(getTransactionSellerFailed.length > 0){
		dataHasilSeleksi = [];
		// console.log('data dataHasilSeleksi before '+dataHasilSeleksi.length);
		objectForeach(getTransactionSellerFailed, function (v, k, obj) {
		if(v){
			// console.log(k+' amount_details.length'+v.amount_details.length+' v.products '+v.products.length)
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
				objectForeach(v.amount_details, function (v1, k1, obj1) {
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
						shipDelivered : v.state_changes.delivered_at,
						shipReceived : v.state_changes.received_at,
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
		console.log(getTransactionSellerFailed.length+'getTransactionSellerFailed data dataHasilSeleksi '+dataHasilSeleksi.length);
		if(dataHasilSeleksi.length > 0){
			let dataNotValidOrValid = {
				valid:[],
				notValid:[]
			};
			
			objectForeach(dataHasilSeleksi, function (v, k, obj) {
				if(v){
					if(v.produk.length > 0){
						objectForeach(v.produk, function (vProd, kProd, obj1){
							if(vProd.id){
								let cSama = false;
								if(self.default.data[UID].produkList.length > 0){
									objectForeach(self.default.data[UID].produkList, function (vLp, kLp, obj2){
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
			self.getdata[idGet]['getTransactionSellerFailed'] = dataNotValidOrValid;
			generateProdukTransaction(dataNotValidOrValid,dataHasilSeleksi,UID,_w,idGet);
		}else{
			console.log('else')
			callTime.getTransaction = true;
		}
	}else if(getTransactionSellerSuccess.length > 0){
		callTime.getTransaction = true;
	}else if(getTransactionBuyerFailed.length > 0){
		callTime.getTransaction = true;
	}else if(getTransactionBuyerSuccess.length > 0){
		callTime.getTransaction = true;
	}else if(getCustomerBL.length > 0){
		callTime.getTransaction = true;
	}else{
		console.log('all else')
		callTime.getTransaction = true;
	}


	// callTime.getTransaction = true;
};

function generateProdukTransaction(dataNotValidOrValid,dataHasilSeleksi,UID,_w,idGet){
	console.log('generateProdukTransaction')
	// self.regulasiData.allData = [];
	// let allData = [];
	// self.regulasiData.dataList = [];
	let dataList = [];
	if(dataNotValidOrValid.notValid.length > 0){
		console.log('ada data not valid '+dataNotValidOrValid.notValid.length)
		return;
		// self.regulasiData.allData = dataNotValidOrValid.notValid;
		allData = dataNotValidOrValid.notValid;
		// self.generateProduk('transaksi');
		generateProduk('transaksi');
		setTimeout(function waitLData(){
			// if(self.regulasiData.dataList.length > 0){
			if(dataList.length > 0){
				timerGet1.get = 1;
				timerGet1.status = true;
				setTimeout(function autoPutProduk(){
					if(timerGet1.get > 0){
						if(timerGet1.status == true){
							// self.checkKtg(self.regulasiData.dataList,'transaksi');
							checkKtg(dataList,'transaksi');
							timerGet1.status = false;
							timerGet1.get++;
							setTimeout(autoPutProduk, 0);
						}else{
							setTimeout(autoPutProduk, 0);
						}
					}else{
						synceProdukMarketPlaceInvent(dataHasilSeleksi,UID,_w,idGet);
					}
				},0);
			}else{
				setTimeout(waitLData,0);
			}
		},0);
	}else{
		synceProdukMarketPlaceInvent(dataHasilSeleksi,UID,_w,idGet);
	}
};

function synceProdukMarketPlaceInvent(dataHasilSeleksi,UID,_w,idGet){
	console.log('synceProdukMarketPlaceInvent '+dataHasilSeleksi.length+' data produk list '+self.default.data[UID].produkList.length)
	if(dataHasilSeleksi.length > 0 && self.default.data[UID].produkList.length > 0){
		let idOrigin = [];
		let	idInvent = [];
		let	arrSama = [];
		objectForeach(dataHasilSeleksi, function (val, key, obj){
			if(val.produk.length > 0){
				objectForeach(val.produk, function (vProd, kProd, obj1){
					if(vProd.id){
						idOrigin.push(vProd.id);
					}
				});
			}
		});
		idOrigin = unique_array(idOrigin);

		objectForeach(self.default.data[UID].produkList, function (val, key, obj){
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
		console.log('idOrigin after '+idOrigin.length+' idInvent '+idInvent.length)
		let dataToPush = [];
		let continueListProduk = false;
		let prductTmp = [];
		objectForeach(dataHasilSeleksi, function (v, k, obj){
			if(v.produk.length > 0){
				prductTmp = v.produk;
				let replaceProduk = false;
				dataToPush = [];
				objectForeach(prductTmp, function (vProd,kProd, obj1){
					if(vProd.id){
						if(idInvent.length > 0){
							objectForeach(idInvent, function (vLp,kLp, obj2){
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
										grosir:vLp.data_detail.grosir,
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
				// console.log('data to push transaksi '+dataToPush.length)
				if(dataToPush.length > 0 && replaceProduk == true){
					if(dataToPush.length == 1 && prductTmp.length == 1){
						v.produk = dataToPush;
						v['originProduk'] = prductTmp;
					}else{
						let id_tmpOrigin = [];
						let arrSama1 = [];
						let hasil_tmp = [];
						objectForeach(prductTmp, function (vTmp,kTmp, obj1){
							if(vTmp.id){
								id_tmpOrigin.push(vTmp.id);
							}
						});
						objectForeach(dataToPush, function (vTmp,kTmp, obj1){
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
			extractCustomerTransaction(dataHasilSeleksi,'transaksi',UID,_w,idGet);
		}else{
			console.log('err :: synceProdukMarketPlaceInvent '+UID)
			callTime.getTransaction = true;
		}
	}
};

function extractCustomerTransaction(dataHasilSeleksi,where,UID,_w,idGet){
	if(dataHasilSeleksi.length > 0 && (where == 'transaksi' || where == 'getCustomerBL') && self.allData.customers.length > 0){
		console.log('extractCustomerTransaction if')
		let emailOrigin = [];
		let phoneOrigin = [];
		let customerOrigin = [];
		let unikMailPhone = [];
		objectForeach(dataHasilSeleksi, function (val,key, obj1){
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
		console.log('emailOrigin after '+emailOrigin.length+' phoneOrigin after '+phoneOrigin.length)
		objectForeach(self.allData.customers, function (val,key, obj1){
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
		console.log('unikMailPhone '+unikMailPhone.length)
		if(unikMailPhone.length > 0 ){
			let unikMailPhoneSama = [];
			let arrSama1 = [];
			let arrSama2 = [];
			let checkMailPhone = false;
			objectForeach(self.allData.customers, function (v, k, obj){
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

			console.log('akhir phoneOrigin '+phoneOrigin.length+' emailOrigin '+emailOrigin.length+' customerOrigin '+customerOrigin.length)

			objectForeach(customerOrigin, function (v, k, obj){
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

			if(unikMailPhoneSama.length > 0 ){
				console.log('unikMailPhone tidak sama '+unikMailPhoneSama.length)
				if(regionDefault.province.length > 0 && regionDefault.city.length > 0 && regionDefault.districts.length > 0){
					synceDataRegion(dataHasilSeleksi,unikMailPhoneSama);
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
							synceDataRegion(dataHasilSeleksi,unikMailPhoneSama);
						}
					},0);
				}

			}else{
				if(where == 'transaksi'){
					// self.changeProgress(self.progressBar.all);
					// console.log('transaksi finis')
					finishingTransaction(dataHasilSeleksi,UID,_w,idGet);
				}else if(where == 'getCustomerBL'){
					console.log('customer finis')
					// self.notifyError2('Tidak ada data cuastomer baru!','warn');
					// self.aSelectGet = {id : '', name : 'Select option get'};
					// self.changeProgress(self.progressBar.all);
				}
			}
			
		}else{
			let arrSama1 = [];
			let arrSama2 = [];
			let checkMailPhone = false;
			objectForeach(customerOrigin, function (v,k, o){
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
			console.log('unikmailphone1 '+unikMailPhone.length)
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
					// self.changeProgress(self.progressBar.all);
					// finishingTransaction(dataHasilSeleksi);
					console.log('finis transaksi1')
				}else if(where == 'getCustomerBL'){
					console.log('finis customer')
					// self.notifyError2('Tidak ada data customer baru!','warn');
					// self.aSelectGet = {id : '', name : 'Select option get'};
					// self.changeProgress(self.progressBar.all);
				}
			}
		}
	}else if(dataHasilSeleksi.length > 0 && (where == 'transaksi' || where == 'getCustomerBL') && self.allData.customers.length == 0){
		console.log('customer leng null')
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
						console.log(error)
					});
					lengthData = 0;
					$timeout(runCus,0);
				}else{
					$timeout(runCus,0);
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
	objectForeach(data, function (val, key, obj){
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
					nama: upperCasseFirst(_nm),
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

function upperCasseFirst(string) {
	var strToUp = string.split(" ");
	for ( var i = 0; i < strToUp.length; i++ )
	{
		var j = strToUp[i].charAt(0).toUpperCase();
		strToUp[i] = j + strToUp[i].substr(1).toLowerCase();
	}
	return strToUp.join(" ");
}

function generateLocalMap(){
	clientRedis.get(self.redis.key2, function (error, result) {
		if (result) {
			console.log('GET result -> exist');
			regionDefault = JSON.parse(result);
		}else{
			console.log('GET result -> not exist');
			localMap.once('value', function(snapshot){
				console.log('create '+self.redis.key2)
				let alldMap = snapshot.val();
				let tmp_localMap = regionExtract(alldMap);
				clientRedis.set(self.redis.key2, JSON.stringify(tmp_localMap), redis.print);//JSON.stringify(self.redis.val), redis.print);
				clientRedis.expireat(self.redis.key2, parseInt((+new Date)/1000) + 86400);
			});
		}
	});
};

function regionExtract(dataRegion){
	if(dataRegion){
		if(dataRegion.districts.length > 0 && dataRegion.province.length > 0 && dataRegion.city.length > 0){
			objectForeach(dataRegion.province, function (val, key, obj){
				if(val.province_id){
					regionDefault.province.push(val);
					objectForeach(dataRegion.city, function (val1, key1, obj1){
						if(val1.province_id == val.province_id){
							regionDefault.city.push(val1);
							objectForeach(dataRegion.districts, function (val2, key2, obj2){
								if(val2.province_id == val1.province_id && val2.city_id == val1.city_id){
									regionDefault.districts.push(val2);
								}
							});
						}
					});
				}
			});
			if(regionDefault.province.length > 0){
				objectForeach(regionDefault.province, function (v, k, o){
					if(v.province){
						regionDefault.provinceName.push(v.province.toLowerCase());
					}
				});
			}
			if(regionDefault.city.length > 0){
				objectForeach(regionDefault.city, function (v, k, o){
					if(v.city_name){
						regionDefault.cityName.push(v.city_name.toLowerCase());
					}
				});
			}
			if(regionDefault.districts.length > 0){
				objectForeach(regionDefault.districts, function (v, k, o){
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

function synceDataRegion(dataHasilSeleksi,unikMailPhone){

	// if(self.aSelectGet.id == 'getCustomerBL' || self.aSelectGet.id == 'getTransactionSellerSuccess' || self.aSelectGet.id == 'getTransactionSellerFailed'){
	// 	self.progressBar.all = unikMailPhone.length;
	// }

	if(unikMailPhone.length > 0){
		// self.dataPostCustomer.transaction = [];
		// self.dataPostCustomer.listCust = [];
		let synceDataRegionTransaction = [];
		// angular.forEach(unikMailPhone,function(v,k){
		objectForeach(regionDefault.districts, function (v, k, o){
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
					objectForeach(str, function (vStr, kStr, o1){
						if(vStr){
							let data_tmp_ds = searchStringInArray(vStr,regionDefault.districtsName);
							if(data_tmp_ds.length > 0){
								objectForeach(data_tmp_ds, function (vStr1, kStr1, o2){
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
					objectForeach(str, function (vStr, kStr, o1){
						if(vStr){
							let data_tmp_ct = searchStringInArray(vStr,regionDefault.cityName);
							if(data_tmp_ct.length > 0){
								// angular.forEach(data_tmp_ct,function(vStr1,kStr){
								objectForeach(data_tmp_ct, function (vStr1, kStr1, o2){				
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
					objectForeach(str, function (vStr, kStr, o1){
						if(vStr){
							let data_tmp_pr = searchStringInArray(vStr,regionDefault.provinceName);
							if(data_tmp_pr.length > 0){
								objectForeach(data_tmp_pr, function (vStr1, kStr1, o2){				
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
					objectForeach(tmp_pr, function (vPars, kPars, o1){				
					// angular.forEach(tmp_pr,function(vPars,kPars){
						if(vPars){
							DataProv.push(regionDefault.province[vPars]);
						}
					});
					objectForeach(tmp_ct, function (vPars, kPars, o1){
					// angular.forEach(tmp_ct,function(vPars,kPars){
						if(vPars){
							DataCity.push(regionDefault.city[vPars]);
						}
					});
					objectForeach(tmp_ds, function (vPars, kPars, o1){
					// angular.forEach(tmp_ds,function(vPars,kPars){
						if(vPars){
							DataDistricts.push(regionDefault.districts[vPars]);
						}
					});
					if(DataProv.length > 0){
						let tmpCt2 = [];
						objectForeach(DataProv, function (v1, k1, o1){
						// angular.forEach(DataProv,function(v1,k1){
							if(v1.province_id){
								feedback.province.id = v1.province_id;
								v.identity.address.province.id = v1.province_id;
								feedback.province.name = v1.province;
								v.identity.address.province.name = v1.province;
								objectForeach(DataCity, function (v2, k2, o2){
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
							objectForeach(DataDistricts, function (v2, k2, o2){
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
								objectForeach(regionDefault.districts, function (v2, k2, o2){
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
							objectForeach(tmpCt2, function (vCt, kCt, o1){
							// angular.forEach(tmpCt2,function(vCt,kCt){
								if(vCt.city_id && vCt.province_id == feedback.province.id){
									objectForeach(DataDistricts, function (v2, k2, o2){
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
								objectForeach(regionDefault.districts, function (v2, k2, o2){
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
						idParentUser:UlogEM,
						idStaffInput:UlogID,
						date : v.identity.date,
						marketPlace:{
							userName:v.username,
							email:v.identity.contact.email,
							phone:v.identity.contact.phone,
							marketPlace:self.aSelectMarket.name.toLowerCase()
						}
					});
				}else{
					console.log('data location salah')
				}
			}
		});   
		// self.genderDataCustomer(dataHasilSeleksi,unikMailPhone);
	}
};

function finishingTransaction(dataHasilSeleksi,UID,_w,idGet){
	if(dataHasilSeleksi.length > 0 && self.allData.customers.length > 0){
		console.log('finishingTransaction')
		objectForeach(dataHasilSeleksi, function (v, k, o){
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
						objectForeach(self.allData.customers, function (v1, k1, o1){
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
						objectForeach(self.allData.customers, function (v1, k1, o1){
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

		generateSupplier(dataHasilSeleksi,UID,_w,idGet);
	}else{
		console.log('else finishingTransaction')
	}
};

function generateSupplier(dataHasilSeleksi,UID,_w,idGet){
	if(dataHasilSeleksi.length > 0 && self.default.data[UID].brand){
		console.log('generateSupplier')
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
		objectForeach(self.default.data[UID].brand, function (v, k, o){
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
			objectForeach(dataHasilSeleksi, function (v, k, o){
				if(v.supplier){
					v['originSupplier'] = v.supplier;
					v.supplier = supplier;
				}
			});
			ongkirGenerateData(dataHasilSeleksi,UID,_w,idGet);
		}

		if(createNewBrand == true){
			console.log('create brand true')
			// self.timerGet.get = 1;
			// self.timerGet.status = true;
			// $timeout(function autoPutProduk(){
			// 	if(self.timerGet.get > 0){
			// 		if(self.timerGet.status == true){
			// 			self.timerGet.status = false;
			// 			self.generateNewProfile(self.accountMarket.id,'transaksi');
			// 			$timeout(autoPutProduk, 0);
			// 		}else{
			// 			$timeout(autoPutProduk, 0);
			// 		}
			// 	}else{
			// 		self.ongkirGenerateData(dataHasilSeleksi);
			// 	}
			// },0);
		}

	}else{
		console.log('err :: generateSupplier');
		// self.timerGet.get = 1;
		// self.timerGet.status = true;
		// $timeout(function autoPutProduk(){
		// 	if(self.timerGet.get > 0){
		// 		if(self.timerGet.status == true){
		// 			self.timerGet.status = false;
		// 			self.generateNewProfile(self.accountMarket.id,'transaksi');
		// 			$timeout(autoPutProduk, 0);
		// 		}else{
		// 			$timeout(autoPutProduk, 0);
		// 		}
		// 	}else{
		// 		self.ongkirGenerateData(dataHasilSeleksi);
		// 	}
		// },0);
	}
};

function ongkirGenerateData(dataHasilSeleksi,UID,_w,idGet){
	if(dataHasilSeleksi.length > 0){
		console.log('ongkirGenerateData')
		objectForeach(dataHasilSeleksi, function (v, k, o){
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
				objectForeach(v.produk, function (vb, kb, ob){
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
		// angular.forEach(dataHasilSeleksi,function(v,k){
		// objectForeach(dataHasilSeleksi, function (v, k, o){
			// if(v){//.marketPlace){
				// tOf = false;
				// if(self.default.data[UID]['transaksiImport'+_w] && self.default.data[UID]['transaksiImport'+_w].length > 0){
				// 	objectForeach(self.default.data[UID]['transaksiImport'+_w], function (v1, k1, o1){
				// 		if(v1){
				// 			if(v1.transaction_id == v.marketPlace.transaction_id && v1.id == v.marketPlace.id){
				// 				tOf = true;
				// 			}
				// 		}
				// 	});
				// 	console.log('data compare '+tOf+' '+v.marketPlace.transaction_id+' : '+v.marketPlace.id)
				// 	if(tOf == false){
				// 		dmpData.push(v);
				// 	}
				// }else{
				// 	if(tOf == false){
				// 		dmpData.push(v);
				// 	}
				// }
			// }
		// });
		console.log('data to check '+self.default.data[UID]['transaksiImport'+_w].length)
		objectForeach(dataHasilSeleksi, function (v2, k2, obj2) {
			if(v2.marketPlace.id){
				// console.log('tOf before'+tOf)
				tOf = checkExistTransaction(v2,self.default.data[UID]['transaksiImport'+_w],_w);
				// console.log('tOf after'+tOf)
				if(tOf == false){
					// dmpData.push(v2);
					self.produkPost.transaksi[idGet].push(v2)
				}
			}
		});
		
		console.log('dataHasilSeleksi1 :: '+dataHasilSeleksi.length+' dataCompare:'+dataCompare.length+' dmpData :: '+self.produkPost.transaksi[idGet].length)
		if(self.produkPost.transaksi[idGet].length > 0){
			console.log(self.produkPost.transaksi[idGet].length+' data baru "'+idGet+'" di '+_w+' loaded!');
			saveOrder(idGet,_w,UID);
			// callTime.getTransaction = true;
		}else{
			console.log('Tidak ada transaksi baru "'+idGet+'" di '+_w+'!');
			callTime.getTransaction = true;
		}
	}else{
		console.log('err :: ongkirGenerateData')
		callTime.getTransaction = true;
	}
};

function saveOrder(idGet,_w,UID){
	if(self.produkPost.transaksi[idGet] && self.produkPost.transaksi[idGet].length > 0){
		console.log('saveOrder, dataSave:'+self.produkPost.transaksi[idGet].length+' idGet:'+idGet+' _w:'+_w+' UID:'+UID)
		timerGet1.get = 1;
		timerGet1.status = true;
		let transaksiCheck = true;
		let dataSave = self.produkPost.transaksi[idGet];
		setTimeout(function autoPutTransaction(){
			if(timerGet1.get > 0){
				if(timerGet1.status == true && dataSave[timerGet1.get-1]){
					// console.log('transaksiCheck before'+transaksiCheck)
					transaksiCheck = checkExistTransaction(dataSave[timerGet1.get-1],self.default.data[UID]['transaksiImport'+_w],_w);
					timerGet1.status = false;
					// console.log('transaksiCheck after'+transaksiCheck)
					if(transaksiCheck == false && (timerGet1.get-1) < dataSave.length){
						console.log('push data transaksi:'+(timerGet1.get-1));
						let dataConverUp = dataSave[timerGet1.get-1];
						let nd = new Date(dataConverUp.create);
						let idPO = nd.getDate()+
							('0' + (nd.getMonth() + 1)).slice(-2) +
							('0' + nd.getFullYear()).slice(-2)+
							('0' + nd.getMinutes()).slice(-2)+
							('0' + nd.getHours()).slice(-2);
						// self.ajacCall2({id:dataPost.customer.id, code:idPO, data:dataPost, status:'new' },'getIdNewOrder','new_order','post');
						// let dataConverUp = ktgUpload[timerGet1.get-1];//JSON.stringify(ktgUpload[timerGet1.get-1]);
						let dataPost = {
							pass: self._paramsData.pass,
							met: self._paramsData.met,
							u : UID,
							p : dataConverUp.customer.id,
							c : 'new',
							d : dataConverUp,
							_w : 'import_transaction',
							code:idPO,
							// id:
						};

						request.get({
							headers: {'content-type': 'application/json'},
							url: self._paramsData.uri+'3',
							json: { 'json' : dataPost }
						},
						function(error, response, body){
							// self.produkPost.kategori.push(dataConverUp);
							if(!error && response.body){
								let _returns =  response.body;
								console.log('response push transaction ',_returns.status)
								if(_returns.status == true && (timerGet1.get-1) < dataSave.length){
									self.produkPost.transaksi[idGet+'return'].push(_returns);
									// self.produkPost.transaksi.push(_returns);//dataSave[timerGet1.get-1]);
									let dataMarket = dataSave[timerGet1.get-1]['marketPlace']; 
									if(dataMarket && _returns.idMarketPlace){
										console.log('ada marketplace')
										self.default.data[UID]['transaksiImport'+_w].push(dataMarket);
										self.allData.users[UID].marketplace[_w]['transaksiImport'][_returns.idMarketPlace] = dataMarket;
										self.allData.marketPlaceUser[UID].marketplace[_w]['transaksiImport'][_returns.idMarketPlace] = dataMarket;
									}else{
										console.log('tidak ada marketplace')
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
								timerGet1.status = false;
								timerGet1.get = 0;
							}
						});
					}else{
						timerGet1.get++;
						timerGet1.status = true;
						console.log('id_produk exist')
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
				}
			}else{
				console.log('done upload transaction '+dataSave.length)
				// self.aSelectGet = {id : '', name : 'Select option get'};
				callTime.getTransaction = true;
			}
		},0);
	}else{
		console.log('err :: saveOrder')
		callTime.getTransaction = true;
	}
};


function checkExistTransaction(dataCheck,dataForcheck,_w){
	let tOf = false;
	if(_w.toLowerCase() == 'bukalapak'){
		if(dataCheck.marketPlace.transaction_id){
			tOf = false;
			if(dataForcheck.length > 0){
				objectForeach(dataForcheck, function (v1, k, obj) {
					// if(v1.id_produk == dataCheck.marketPlace.id_produk){
					if(v1){
						if(v1.transaction_id == dataCheck.marketPlace.transaction_id && v1.id == dataCheck.marketPlace.id){
							console.log('sama '+v1.transaction_id)
							tOf = true;
						}
					}
				});
			}
		}
	}
	// console.log('transaction_id '+dataCheck.marketPlace.transaction_id+' id '+dataCheck.marketPlace.id+' dataForcheck '+dataForcheck.length+' upload '+tOf);
	return tOf;
};


// short function -------------

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