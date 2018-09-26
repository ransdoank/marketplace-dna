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
let allDataUsers = {};

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
	usersDataDb = db.ref("users");
	// usersDataDb.once("value", function(snapshot) {
	// 	allDataUsers = snapshot.val();
	// 	allDataUsers.key = snapshot.key;
	// 	// allDataUsers.uid = uid;
	// 	// viewDataCallbcak(allDataUsers,req,res);
	// });
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
				updateRedistCron(self.data);
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
	viewDataCallbcak('marketplace-dna work',req,res);
  }
});

function getData(req,res,met,baseUrl,dataPost,where){
	if(met == 'get'){
		self.redis = { key:redisOption.key, val:redisOption.val, status:redisOption.status};
		let checkExist = false;
		let dataTmpRedis = '';
		clientRedis.get(self.redis.key, function (error, result) {
			if (result) {
				console.log('GET result -> exist');
					dataTmpRedis = JSON.parse(result);
					checkExist = true;
					self.redis.status = 'update';
			}else{
				console.log('GET result -> not exist');
				self.redis.status = 'create';
			}
			if(checkExist == true){
				console.log('GET result checkExist -> exist '+where);
				routeCalback(req,res,dataTmpRedis,where);
			}else{
				console.log('GET result checkExist -> not exist');
				if(dataPost.pass == access_data.key && dataPost.met == access_data.met){
					usersDataDb.once("value", function(snapshot) {
						let allDataUsers_tmp = snapshot.val();
						let tmp_dataMarket = {};
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
						let postData = {
							all : allDataUsers_tmp,
							marketPlaceUser : tmp_dataMarket
						};
						routeCalback(req,res,postData,where);
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
			self.data = feedback;
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
	getTransaction : false
};

function generateAllDataMarket(req,res){
	if(self.data){
		if(self.data.marketPlaceUser){
			let data = self.data.marketPlaceUser;
			objectForeach(data, function (val, prop, obj) {
				if(val.marketplace){
					self.acc = {
						id : [prop],
						data : {[prop] : {}} 
					};
					self.val = val;
					// profile/brand data extract
					if(val.identityBisnis){
						self.acc.data[prop].brand = {};
						objectForeach(val.identityBisnis, function (val1, prop1, obj1) {
							if(val1){
								self.acc.data[prop][prop1] = {};
								objectForeach(val1, function (val2, prop2, obj2) {
									if(val2.marketPlace){
										self.acc.data[prop][prop1][prop2] = val2;
									}
								});	
							}
						});
					}else{
						console.log('tidak ada brand '+prop)
						self.acc.data[prop].brand = {};
						objectForeach(val.supplier, function (val1, prop1, obj1) {
							if(val1){
								objectForeach(val1, function (val2, prop2, obj2) {
									if(val2){
										self.acc.data[prop].brand[prop2] = val2;
									}
								});	
							}
						});
					}
					// produk data default extract
					if(val.produk){
						let tmpCheckExistProduk = [];
						self.acc.data[prop].produk = {}
						objectForeach(val.produk, function (val1, prop1, obj1) {
							if(val1){
								tmpCheckExistProduk.push({[prop1] : val1});
								if(val1.marketPlace){
									console.log('ada produk')
									self.acc.data[prop].produk[prop1] = val1;
								}
							}
						});
						if(tmpCheckExistProduk.length == 0){
							self.data.all[prop].produk = {};
							self.data.marketPlaceUser[prop].produk = {};
						}
					}else{
						self.acc.data[prop].produk = {};
					}
					// kategori data default extract
					if(val.kategoriProduk){
						self.acc.data[prop].kategoriProduk = {};
						let tmpCheckExistKtg = [];
						objectForeach(val.kategoriProduk, function (val1, prop1, obj1) {
							if(val1){
								self.acc.data[prop].kategoriProduk[prop1] = val1;
								tmpCheckExistKtg.push({[prop1] : val1});
							}
						});
						if(tmpCheckExistKtg.length == 0){
							self.data.all[prop].kategoriProduk = {};
							self.data.marketPlaceUser[prop].kategoriProduk = {};
							self.acc.data[prop].kategoriProduk = {};
						}
					}else{
						self.acc.data[prop].kategoriProduk = {};
						console.log('tidak ada kategoriProduk '+prop)
					}
					// marketPlace data extract
					objectForeach(val.marketplace, function (val1, prop1, obj1) {
                        self.acc.data[prop]['account'+prop1] = [];
						self.acc.data[prop]['produkImport'+prop1] = [];
                        self.acc.data[prop]['transaksiImport'+prop1] = [];
                        self.acc.data[prop]['customerImport'+prop1] = [];
						objectForeach(val1, function (val2, prop2, obj2) {
							if(prop2 == 'produkImport' || prop2 == 'transaksiImport' || prop2 == 'customerImport'){
								if(prop2 == 'produkImport'){
									objectForeach(val2, function (val3, prop3, obj3) {
										if(val3){
											self.acc.data[prop]['produkImport'+prop1].push(val3);
										}
									});
								}else if(prop2 == 'transaksiImport'){
									objectForeach(val2, function (val3, prop3, obj3) {
										if(val3){
											self.acc.data[prop]['transaksiImport'+prop1].push(val3);
										}
									});
								}else if(prop2 == 'customerImport'){
									objectForeach(val2, function (val3, prop3, obj3) {
										if(val3){
											self.acc.data[prop]['customerImport'+prop1].push(val3);
										}
									});
								}
							}else{
								self.acc.data[prop]['account'+prop1].push(val2);
							}
						});	
					});
				}

			});
			
			if(self.acc.id.length > 0){
				timerGet.timeC = 0;//self.acc.id.length;//1;
				timerGet.status = true;
				timerGet.lData = 0;
				self.getdata = {};
				setTimeout(function allData(){
					if(self.acc.id[timerGet.timeC]){

						let id = self.acc.id[timerGet.timeC];
						callTime.getProdukSale = false;
						callTime.getProdukNotSale = false;
						callTime.getTransaction = false;

						if(self.acc.data[id].accountbukalapak){
							if(self.acc.data[id].accountbukalapak.length > 0){//[self.acc.id[timerGet.lData]].accountbukalapak){
							// ambil data per account
								timerGet.lData = 0;
								setTimeout(function getDataAccoun(){
									if(timerGet.lData < self.acc.data[id].accountbukalapak.length){
										if(self.acc.data[id].accountbukalapak[timerGet.lData]){
											//get data produk
											let dataTmpAcc = self.acc.data[id].accountbukalapak[timerGet.lData];										
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
												callTime.getProdukSale = false;
												callTime.getProdukNotSale = false;
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
				console.log('err :: data users marketPlaceUser '+self.acc.id.length);
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
				console.log('get_ '+_w+' '+c+' '+dataPost);
				request.get({
					headers: {'content-type': 'application/x-www-form-urlencoded'},
					url: self._paramsData.uri+'2?'+dataPost,
					body: dataPost
				}, function(error, response, body){
					if(!error && response.body){
						let _returns =  JSON.parse(response.body);
						let feedback = [];
						if(_returns.status == true && _returns.data){
							console.log(_w+' '+_returns.data.length)
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
				// callTime.getProdukSale = true;
				generateProduk('produk',dataTmpAcc.i,c,_w,allData,UID);
			}
			if(c == 'getProdukNotSale'){
				// callTime.getProdukNotSale = true;
				generateProduk('produk',dataTmpAcc.i,c,_w,allData,UID);
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
				console.log('getData')

				let dataPost = qs.stringify({
					pass: self._paramsData.pass,
					met: self._paramsData.met,
					u : dataTmpAcc.i,
					p : dataTmpAcc.t,
					c : c,
					d : timerGet1.get,
					_w : _w
				});
				request.get({
					headers: {'content-type': 'application/x-www-form-urlencoded'},
					url: self._paramsData.uri+'2?'+dataPost,
					body: dataPost
				}, function(error, response, body){
					if(!error && response.body){
						let _returns =  JSON.parse(response.body);
						
						let feedback = [];
						if(_returns.status == true && _returns.data){
							console.log(_w+' '+_returns.data.length)
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
				callTime.getTransaction = true;
				console.log(c+' '+_w+' '+dataTmpAcc.i+'loaded');
			}
		}
	},0);
};

// generate data produk
function generateProduk(a,id,c,_w,allData,UID){
	console.log('all data '+allData.length)
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

	if(self.acc.data[UID].brand){
		objectForeach(self.acc.data[UID].brand, function (v, k, obj) {
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
	
	if(getProfile == false){
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
								tOf = false;
								if(self.acc.data[UID]['produkImport'+_w].length > 0){
									objectForeach(self.acc.data[UID]['produkImport'+_w], function (v1, k, obj) {
										if(v1.id_produk == v.marketPlace.id_produk){
											tOf = true;
										}
									});
								}
								if(tOf == false){
									self.getdata[id][c].push(v);
								}
							}
						});
						
						if(self.getdata[id][c].length > 0 ){
							console.log('ada data baru '+id+' di '+_w+' loaded!');
						}else{
							console.log('Tidak ada data baru '+id+' di '+_w+' loaded!');
						}
					}else if(a == 'transaksi'){
						self.regulasiData.dataList = feedback;
					}
					if(c == 'getProdukSale'){
						checkKtg(self.getdata[id][c],a,UID,c,_w);
					}
					if(c == 'getProdukNotSale'){
						checkKtg(self.getdata[id][c],a,UID,c,_w);
					}
				}else{
					if(a == 'produk'){
						console.log(id+' tidak mempunyai data produk di '+_w+'!');
					}else if(a == 'transaksi'){
						self.regulasiData.dataList = feedback;
					}
					if(c == 'getProdukSale'){
						callTime.getProdukSale = true;
					}
					if(c == 'getProdukNotSale'){
						callTime.getProdukNotSale = true;
					}
				}
			}
		},0);            
	}else{
		console.log('err get brand '+id);
	}
};

// check kategori
function checkKtg(data,where,UID,c,_w){
	console.log('checkKtg '+data.length)
	let ktg = [];
	let ktgArr = [];
	let ktgUpload = [];
	let uniqueNames =  [];
	let tmpCheckExistKtg = [];
	if(data.length > 0){
		objectForeach(data, function (v, k, obj) {
			if(v.kategori){
				ktg.push(v.kategori);
			}
		});
	}
	if(self.acc.data[UID].kategoriProduk){
		objectForeach(self.acc.data[UID].kategoriProduk, function (v, k, obj) {
			if(v.kategori){
				ktgArr.push(v.kategori.toLowerCase());
				tmpCheckExistKtg.push(v.kategori.toLowerCase());
			}
		});
	}

	uniqueNames = unique_array(ktg);
	console.log('ktg uniqueNames '+uniqueNames.length)
	if(uniqueNames.length > 0){
		for(var i = 0; i < uniqueNames.length; i++){
			// if(ktgArr.length > 0){
			if(ktgArr.indexOf(uniqueNames[i].toLowerCase()) === -1){
				ktgUpload.push({
					kategori: uniqueNames[i]
				});
			}
		};
	}
	
	if(ktgUpload.length > 0 ){
		console.log('upload ktg')
		timerGet1.get = 1;
		timerGet1.status = true;
		setTimeout(function getData(){
			if(timerGet1.get > 0){
				if(timerGet1.status == true && ktgUpload[timerGet1.get-1]){
					let dataConverUp = JSON.stringify(ktgUpload[timerGet1.get-1]);
					let dataPost = qs.stringify({
						pass: self._paramsData.pass,
						met: self._paramsData.met,
						u : UID,
						p : '',
						c : 'new',
						d : dataConverUp,
						_w : 'importKategori'
					});
					request.get({
						headers: {'content-type': 'application/json'},//x-www-form-urlencoded'},
						url: self._paramsData.uri+'2?'+dataPost,
						body: dataPost
					}, function(error, response, body){
						if(!error && response.body){
							let _returns =  response.body;
							if(_returns && (timerGet1.get-1) < ktgUpload.length){
								self.acc.data[UID].kategoriProduk[_returns] = ktgUpload[timerGet1.get-1];
								self.data.all[UID].kategoriProduk[_returns] = ktgUpload[timerGet1.get-1];
								self.data.marketPlaceUser[UID].kategoriProduk[_returns] = ktgUpload[timerGet1.get-1];
								
								tmpCheckExistKtg.push(ktgUpload[timerGet1.get-1].kategori);
								timerGet1.status = true;
								timerGet1.get++;

							}else{
								timerGet1.status = false;
								timerGet1.get = 0;
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
					}
					setTimeout(getData, 0);
				}
			}else{
				saveContinue(data,where,UID,c,_w);
			}
		},0);
	}else{
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
				// self.data = JSON.parse(result);
				checkExist = true;
		}else{
			console.log('GET result -> not exist');
		}
		if(checkExist == false){
			if(self.redis.status == 'create'){
				console.log('create redis');
				clientRedis.set(self.redis.key, JSON.stringify(data), redis.print);//JSON.stringify(self.redis.val), redis.print);
				clientRedis.expireat(self.redis.key, parseInt((+new Date)/1000) + 86400);
				self.redis.status = 'update';
				self.redis.val = data;
			}
		}else{
			if(self.redis.status == 'update'){
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

	if(data.length > 0){
		// let dataCount = {
		// 	promo:0,
		// 	reguler:0
		// }

		objectForeach(data, function (v, k, obj) {
			if(v.kategori){
				// ktg.push(v.kategori);
				if(self.acc.data[UID].kategoriProduk){
					objectForeach(self.acc.data[UID].kategoriProduk, function (v1, k1, obj1) {
						if(v1.kategori.toLowerCase() == v.kategori.toLowerCase()){
							v.kategori = k1;
						}
					});
				}
			}
		});
	// }
		

	// auto save data produk
	self.produkPost = [];
	timerGet1.get = 1;
	timerGet1.status = true;
	setTimeout(function getData(){
		if(timerGet1.get > 0){
			if(timerGet1.status == true && data[timerGet1.get-1]){
				let produkPostStatus = true ;//true;
				let id_tmp = data[timerGet1.get-1].marketPlace.id_produk;
				let arrP = [];
				if(self.acc.data[UID]['produkImport'+_w].length > 0){//['produkImport'+nameMarket].length > 0){
					objectForeach(self.acc.data[UID]['produkImport'+_w],function(v,k,obj){
						if(v.id_produk){ //id_produk){
							// console.log('cek id produk'+id_tmp);
							if(v.id_produk == id_tmp){
								produkPostStatus = false;
								arrP.push(v.id_produk);
								// console.log('sama produkny '+v.id_produk+' :: '+data[timerGet1.get-1].marketPlace.id_produk)
							}//else{
								// console.log('tidak sama '+v.marketPlace.id_produk+' :: '+data[timerGet1.get-1].marketPlace.id_produk)
							// }
						}
					});
					console.log('id sama1 :: '+arrP.length)
				}
				console.log('id sama awal :: '+arrP.length)
				// if(self.default.produkList.length > 0){
				// 	angular.forEach(self.default.produkList,function(val,key){
				// 		if(val.id_produk){
				// 			if(val.id_produk == v.marketPlace.id_produk){
				// 				saveDbfirebase = false;
				// 			}
				// 		} 
				// 	});
				// };

				if(produkPostStatus == true){
				
					let dataConverUp = data[timerGet1.get-1];//JSON.stringify(data[timerGet1.get-1]);
					let dataProduk = '';
					if(self.data.all[UID].produk){
						dataProduk = self.data.all[UID].produk;//JSON.stringify(self.data.all[UID].produk);
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
							console.log('status feed '+_returns.status);
							self.produkPost.push({data:dataPost,return:_returns});
							if(_returns.status == true && (timerGet1.get-1) < data.length){
								if(_returns.updateProduk ){//&& timerGet1.get == 1){
									self.acc.data[UID].produk[_returns.updateProduk] = data[timerGet1.get-1];
									self.data.all[UID].produk[_returns.updateProduk] = data[timerGet1.get-1];
									self.data.marketPlaceUser[UID].produk[_returns.updateProduk] = data[timerGet1.get-1];
								}
								if(_returns.updateMarket ){//&& timerGet1.get == 1){
									if(!self.data.all[UID].marketplace[_w].produkImport){
										console.log('belum ada data self.data.all')
										self.data.all[UID].marketplace[_w].produkImport = {};
									}
									if(!self.data.marketPlaceUser[UID].marketplace[_w].produkImport){
										console.log('belum ada data self.data.marketPlaceUser')
										self.data.marketPlaceUser[UID].marketplace[_w].produkImport = {};
									}
									// if(!self.acc.data[UID]['produkImport'+nameMarket]){
									// 	console.log('belum ada data self.acc.data')
									// 	self.acc.data[UID]['produkImport'+nameMarket] = [];
									// }
				
									self.acc.data[UID]['produkImport'+_w].push(data[timerGet1.get-1].marketPlace);
									self.data.all[UID].marketplace[_w].produkImport[_returns.updateMarket] = data[timerGet1.get-1].marketPlace;
									self.data.marketPlaceUser[UID].marketplace[_w].produkImport[_returns.updateMarket] = data[timerGet1.get-1].marketPlace;
								}				
								timerGet1.status = true;
								timerGet1.get++;
							}else{
								console.log('push produk1 else')
								if((timerGet1.get-1) < data.length){
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

self.produkPost = [];


const parseJsonAsync = (jsonString) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(JSON.parse(jsonString))
    })
  })
}