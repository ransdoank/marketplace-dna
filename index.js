'use strict';
let qs = require('querystring');

let express = require('express');
let https = require('https');
let http = require('http');
let request = require('request');
let path = require('path');
let fs = require('fs');
// let useragent = require('express-useragent');

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

let dirReplace = ''; // set __dirname

exports._setOption = function(params){
	options.key = params.key;
	options.cert = params.cert;
	options.ca = params.ca;
  console.log('options set');
};

exports._setDirname = function(a){
	dirReplace = a;
  	console.log('dirname set '+dirReplace);
};


let INDEX = path.join(dirReplace, '/index.html');

// SocketIO
let server = '';//https.createServer(options, app);
let io = '';//require('socket.io')(server);
let connections = [];
let botStatusServer = true;

//set active listener
exports._setactivePort = function(){
	server = https.createServer(options, app);
	io = require('socket.io')(server);
	console.log('dirname set '+dirReplace);
	server.listen(PORT, function(req,res){
		console.log(" SERVER listening @ port:",PORT);
	});
};

//GET Routes
app.use(express.static(dirReplace + '/public'));

app.get('/',function(req,res){
	// res.sendFile(INDEX);}
	viewDataCallbcak('marketplace-dna work',req,res);
});

let self = {};
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

function viewDataCallbcak(data,req,res){
	res.send(data);
};

app.get('/marketPlaceJobsApi', function(req,res){
  let _paramsData = JSON.stringify(req.query);
  self._paramsData = JSON.parse(_paramsData);
  if(self._paramsData.pass && self._paramsData.met && self._paramsData.uri){
  	let dataAwal = qs.stringify({
  		pass: self._paramsData.pass,
  		met: self._paramsData.met
  	});
	console.log('marketPlaceJobsApi :: ');
  	getData(req,res,'get',self._paramsData.uri,dataAwal,'allData');
  }else{
	console.log('err marketPlaceJobsApi :: ');
	viewDataCallbcak('marketplace-dna work',req,res);
  }
});

function getData(req,res,met,baseUrl,dataPost,where){
	if(met == 'get'){
		request.get({
			headers: {'content-type': 'application/x-www-form-urlencoded'},
			url: baseUrl+'?'+dataPost,
			body: dataPost
		}, function(error, response, body){
			if(!error){
				let _returns = response.body;
				let feedback = {};
				timerGet.timeC = 1;
				timerGet.status = true;
				setTimeout(function allData(){
					if(timerGet.timeC > 0){
						if(timerGet.status == true){
							if(_returns){
								feedback = JSON.parse(_returns);
								timerGet.timeC = 0;
								timerGet.timeC = false;
							}else{
								timerGet.timeC++;
							}
							setTimeout(allData,0);
						}else{
							setTimeout(allData,0);
						}
					}else{
						console.log('getData '+feedback.existdbRedistCron)
						routeCalback(req,res,feedback,where);
					}
				},0);
			}else{
				console.log('err getData -> '+where+' :: '+error);
				viewDataCallbcak('error',req,res);
			}
		});
	}
};

function routeCalback(req,res,feedback,where){
	if(where == 'allData'){
		if(feedback.self_data && feedback.existdbRedistCron){
			self.data = feedback.self_data;
			self.statusRedis = feedback.existdbRedistCron;
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
						self.acc.data[prop].produk = {};
						objectForeach(val.produk, function (val1, prop1, obj1) {
							if(val1){
								objectForeach(val1, function (val2, prop2, obj2) {
									if(val2.marketPlace){
										self.acc.data[prop].produk[prop2] = val2;
									}
								});
							}
						});
					}else{
						self.acc.data[prop].produk = {};
						console.log('tidak ada produk '+prop)
					}
					// kategori data default extract
					if(val.kategoriProduk){
						self.acc.data[prop].kategoriProduk = {};
						objectForeach(val.kategoriProduk, function (val1, prop1, obj1) {
							if(val1){
								objectForeach(val1, function (val2, prop2, obj2) {
									if(val2.marketPlace){
										self.acc.data[prop].kategoriProduk[prop2] = val2;
									}
								});
							}
						});
					}else{
						self.acc.data[prop].kategoriProduk = {};
						console.log('tidak ada kategoriProduk '+prop)
					}
					// marketPlace data extract
					objectForeach(val.marketplace, function (val1, prop1, obj1) {
                        self.acc.data[prop]['account'+prop1] = [];
						self.acc.data[prop]['produkImport'+prop1] = [];
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
						// self.getdata.push({
						// 	id: id,
						// 	data0: self.acc.data[id].accountbukalapak,
						// 	data1: self.acc.data[id]['accountbukalapak']//,
						// 	// data3: self.acc.data.id.accountbukalapak
						// });
						// timerGet.timeC++;
						// setTimeout(allData,0);

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
	
											// callTime.getProdukSale = false;
											// callTime.getProdukNotSale = false;
											
											if(callTime.getProdukSale == false && callTime.getProdukNotSale == false && callTime.getTransaction == false){
												let dataAccBukalapak = true;
												self.getdata[dataTmpAcc.i] = {};
												setTimeout(function dataSaleNotsale(){
													if(dataAccBukalapak == true){
														dataAccBukalapak = false;
														getProdukSaleNotsale(dataTmpAcc,'getProdukNotSale','bukalapak');
														setTimeout(dataSaleNotsale,0);
													}else{
														if(callTime.getProdukNotSale == true){
															setTimeout(getDataAccoun,0);
														}else{
															setTimeout(dataSaleNotsale,0);
														}
													}
												},0);
											}else if(callTime.getProdukSale == false && callTime.getProdukNotSale == true && callTime.getTransaction == false){
												let dataAccBukalapak1 = true;
												setTimeout(function dataSaleNotsale1(){
													if(dataAccBukalapak1 == true){
														dataAccBukalapak1 = false;
														getProdukSaleNotsale(dataTmpAcc,'getProdukSale','bukalapak');
														setTimeout(dataSaleNotsale1,0);
													}else{
														if(callTime.getProdukSale == true){
															setTimeout(getDataAccoun,0);
														}else{
															setTimeout(dataSaleNotsale1,0);
														}
													}
												},0);
											}else if(callTime.getProdukSale == true && callTime.getProdukNotSale == true && callTime.getTransaction == false){
												let dataAccBukalapak1 = true;
												self.getdata[dataTmpAcc.i].getTransaction = {};
												setTimeout(function dataSaleNotsale1(){
													if(dataAccBukalapak1 == true){
														dataAccBukalapak1 = false;
														getTransactionSellerFailedSuccessCustomer(dataTmpAcc,'getTransaction','bukalapak');
														setTimeout(dataSaleNotsale1,0);
													}else{
														if(callTime.getProdukSale == true){
															setTimeout(getDataAccoun,0);
														}else{
															setTimeout(dataSaleNotsale1,0);
														}
													}
												},0);
											}else if(callTime.getProdukSale == true && callTime.getProdukNotSale == true && callTime.getTransaction == true){
												timerGet.lData++;
												callTime.getProdukSale = false;
												callTime.getProdukNotSale = false;
												callTime.getTransaction == false;
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
						/*if((timerGet.lData+1) > 0 && timerGet.lData < self.acc.id.length){
							let dataAccount  = self.acc.data[self.acc.id[timerGet.lData]].accountbukalapak;
							// if(dataAccount && dataAccount.length > 0){
								
							setTimeout(function allData1(){
								if(timerGet.lData != self.acc.id.length){
									// if()
									if(timerGet.status == true){
										timerGet.status = false;
										let dataPost = qs.stringify({
											pass: self._paramsData.pass,
											met: self._paramsData.met,
											_w:'test'
										});
										request.get({
											headers: {'content-type': 'application/x-www-form-urlencoded'},
											url: self._paramsData.uri+'?'+dataPost,
											body: dataPost
										}, function(error, response, body){
											if(!error && response.body){
												let _returns = response.body;
												self.getdata.push(_returns); 
												// let feedback = JSON.parse(_returns);
												console.log(_returns);
												// timerGet.timeC = 0;
												if(dataAccount < )
												timerGet.lData++;
												timerGet.status = false;
												// routeCalback(req,res,feedback,where);
											}else{
												console.log('err -> '+where+' :: '+error);
												// viewDataCallbcak('error',req,res)
												timerGet.timeC = 0;
												timerGet.status = false;
											}
										});
										// timerGet.timeC++;
										setTimeout(allData, 0);
									}else{
										// timerGet.timeC++;
										setTimeout(allData1, 0);
									}
								}else{
									timerGet.timeC = 0;
									setTimeout(allData, 0);
								}
							},0);
							
							// }
						}*/

						
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


function getProdukSaleNotsale(dataTmpAcc,c,_w){
	self.getdata[dataTmpAcc.i][c] = [];
	
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
					c : c,//'condition',
					d : timerGet1.get,
					_w : _w//'marketplaceName'
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
							if(_returns.data.length > 0){
								feedback = replaceText(_returns.data);
							}

						}

						if(feedback.length > 0 && feedback.length <= 50){
							for (let i = 0; i < feedback.length; i++) {
								self.getdata[dataTmpAcc.i][c].push(feedback[i]);
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
				callTime.getProdukSale = true;
				console.log(c+' '+_w+' '+dataTmpAcc.i+'loaded');
			}
			if(c == 'getProdukNotSale'){
				console.log(c+' '+_w+' '+dataTmpAcc.i+'loaded');
				callTime.getProdukNotSale = true;
			}

		}
	},0);
};
function getTransactionSellerFailedSuccessCustomer(dataTmpAcc,c,_w){
	// self.getdata[dataTmpAcc.i][c] = {};
	self.getdata[dataTmpAcc.i].allTransaction = [];
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
							if(_returns.data.length > 0){
								feedback = replaceText(_returns.data);
							}
						}

						if(feedback.length > 0 && feedback.length <= 50){
							for (let i = 0; i < feedback.length; i++) {
								self.getdata[dataTmpAcc.i].allTransaction.push(feedback[i]);
								// self.getdata[dataTmpAcc.i][c].push(feedback[i]);
								if(feedback[i].state){
									console.log('status ke '+i+' : '+feedback[i].state);
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
			// if(c == 'getTransaction'){
				callTime.getTransaction = true;
				console.log(c+' '+_w+' '+dataTmpAcc.i+'loaded');
			// }
		}
	},0);
};


/*self.generateProduk = function(a){
	console.log('self.dataConvert',self.dataConvert,' self.accountMarket', self.accountMarket)
	let allData = [];
	if(a == 'produk'){
		self.dataPostProduk.list = [];
		allData = self.dataConvert.allData;
	}else if(a == 'transaksi'){
		self.regulasiData.dataList = [];
		allData = self.regulasiData.allData;
	}
	let feedback = [];
	let dataPush = 0;
	let idBrend = '';
	let idsuplier = '';
	let jenis = '';

	let getProfile = true;
	if(self.default.brand){
		angular.forEach(self.default.brand,function(v,k){
			if(v.marketPlace){
				if(v.marketPlace.id == self.accountMarket.id && v.marketPlace.marketPlace == self.aSelectMarket.name.toLowerCase()){
					getProfile = false;
					idBrend = k;
					idsuplier = '';
					jenis = 'stok_sendiri';
				}
			}
		});
	}
	if(getProfile == true){
		self.timerGet.get = 1;
		self.timerGet.status = true;
		$timeout(function autoPutProduk(){
			if(self.timerGet.get > 0){
				if(self.timerGet.status == true){
					self.timerGet.status = false;
					self.generateNewProfile(self.accountMarket.id,a);
					$timeout(autoPutProduk, 0);
				}else{
					$timeout(autoPutProduk, 0);
				}
			}else{
				self.generateProduk(a);

			}
		},0);
	}else{
		if(a == 'produk'){
			self.progressBar.all = allData.length;
		}else if(a == 'transaksi'){
			self.progressBar.all = allData.length;
		}

		self.timerGet.get = 1;
		self.timerGet.status = true;
		let timeLokal = 0;
		$timeout(function prodDelay(){
			if(self.timerGet.get > 0){
				if(self.timerGet.status == true && timeLokal == 0){
					timeLokal++;
					self.timerGet.status = false;
					let k = self.timerGet.get-1;
					let v = allData[k];

					if(v){
						if(a == 'produk'){
							self.progressBar.data = v.name;
							self.changeProgress(self.timerGet.get);
						}else if(a == 'transaksi'){
							self.progressBar.data = 'load produk '+v.name;
							self.changeProgress(self.timerGet.get);
						}
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
									angular.forEach(v.product_sku,function(vPprodSku,kPprodSku){
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
												updateID: UlogID,
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
											updateID: UlogID,
										}]
									});
									varianDataTmp.push({
										sku_origin:v.id,
										sku_replace: v.id.toUpperCase()+'-V'+k+'-'+0
									});
								}
							}
							if(varianData.length > 0){
								dataPush++;
								feedback.push({
									berat: v.weight,
									grosir: grosir,
									idBrend: idBrend,
									idParentUser : UlogEM,
									idStaffInput: UlogID,
									idsuplier: idsuplier,
									jenis: jenis,
									jenisProduct : jenisProduct,
									kategori: v.category,
									keterangan: desacVp,
									nama: v.name,
									status: status,
									diskon: 0,
									marketPlace:{
										idSeller:self.accountMarket.id,
										username:self.accountMarket.username,
										email:self.accountMarket.email,
										id_produk:v.id,
										varian:varianDataTmp,
										name: self.aSelectMarket.name.toLowerCase()
									},
									diskonType: '',
									varian: varianData
								});
							}
						}
						self.timerGet.get++;
					}else{
						self.timerGet.get = 0;
					}
					$timeout(prodDelay, 0);
				}else{
					if(allData[self.timerGet.get-1]){
						if(timeLokal < 100){
							timeLokal++;
						}else{
							self.timerGet.status = true;
							timeLokal = 0;
						}
					}else{
						self.timerGet.get = 0;
					}
					
					$timeout(prodDelay, 0);
				}
			}else{
				if(feedback.length > 0){
					if(a == 'produk'){
						//check produk exist on database
						let newProduk = [];
						let tOf = false;
						dataPush = 0;
						angular.forEach(feedback,function(v,k){
							if(v.marketPlace.id_produk){
								tOf = false;
								if(self.default.produkList.length > 0){
									angular.forEach(self.default.produkList,function(v1,k1){
										if(v1.id_produk == v.marketPlace.id_produk){
											tOf = true;
											console.log('ada yg sama')
										}
									});
								}
								if(tOf == false){
									console.log('tidak ada yg sama')
									dataPush++;
									newProduk.push(v);
								}
							}
						});
						
						self.dataPostProduk.lengthData = dataPush;
						self.dataPostProduk.list = newProduk;

						if(newProduk.length > 0 ){
							self.notifyError2('Data baru "'+self.upperCasseFirst(self.aSelectGet.name)+'" di '+self.aSelectMarket.name.toLowerCase()+' loaded!','success');
						}else{
							self.notifyError2('Tidak ada data baru "'+self.upperCasseFirst(self.aSelectGet.name)+'" di '+self.aSelectMarket.name.toLowerCase()+'!','warn');
						}
					}else if(a == 'transaksi'){
						self.regulasiData.dataList = feedback;
					}
				}else{
					if(a == 'produk'){
						self.notifyError2('Anda tidak mempunyai data "'+self.upperCasseFirst(self.aSelectGet.name)+'" di '+self.aSelectMarket.name.toLowerCase()+'!','error');
					}else if(a == 'transaksi'){
						self.regulasiData.dataList = feedback;
					}
				}
			}
		},0);            
	}
};*/