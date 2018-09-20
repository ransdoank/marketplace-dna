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
				self.getdata = [];
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

						if(self.acc.data[id].accountbukalapak){
							if(self.acc.data[id].accountbukalapak.length > 0){//[self.acc.id[timerGet.lData]].accountbukalapak){
							// ambil data per account
								timerGet.lData = 0;
								setTimeout(function getDataAccoun(){
									if(timerGet.lData < self.acc.data[id].accountbukalapak.length){
										if(self.acc.data[id].accountbukalapak[timerGet.lData]){
											// self.getdata.push(
											// 	{
											// 		datake:timerGet.lData,
											// 		datapush:self.acc.data[id].accountbukalapak[timerGet.lData]
											// 	}
											// );marketPlaceJobs2
											let dataPost = {//qs.stringify({
												pass: self._paramsData.pass,
												met: self._paramsData.met,
												_w:'test',
												UID:id,
												u:self.acc.data[id].accountbukalapak[timerGet.lData].i,
												p:self.acc.data[id].accountbukalapak[timerGet.lData].t,
												c:'getProdukNotSale',
												d:0,
												_w:'bukalapak',
												feedback:'',
												accountData:self.acc.data[id].accountbukalapak[timerGet.lData]
											};//);
											self.timerGet.get = 1;
											self.timerGet.status = true;
											$timeout(function getData(){
												if(self.timerGet.get > 0){
													if(self.timerGet.status == true){
														feed = {
															'u' : self.accountMarket.id,
															'p' : self.accountMarket.token,
															'c' : data.id,
															'd' : self.timerGet.get,
															'_w' : self.aSelectMarket.name.toLowerCase()
														};
														self.ajacCall(feed,data.id);
														self.timerGet.status = false;
														$timeout(getData, 0);
													}else{
														$timeout(getData, 0);
													}
												}else{
													if(self.dataConvert.allData.length > 0 ){
														console.log('default',self.default,'dataPostProduk',self.dataPostProduk)

														self.generateProduk('produk');
													}
												}
											},0);
											// request.get({
											// 	headers: {'content-type': 'application/x-www-form-urlencoded'},
											// 	url: self._paramsData.uri+'2?'+dataPost,
											// 	body: dataPost
											// }, function(error, response, body){
											// 	if(!error && response.body){
											// 		let _returns = response.body;
											// 		self.getdata.push(_returns); 
											// 		// let feedback = JSON.parse(_returns);
											// 		console.log(_returns);
											// 		// timerGet.timeC = 0;
											// 		if(dataAccount < )
											// 		timerGet.lData++;
											// 		timerGet.status = false;
											// 		// routeCalback(req,res,feedback,where);
											// 	}else{
											// 		console.log('err -> '+where+' :: '+error);
											// 		// viewDataCallbcak('error',req,res)
											// 		timerGet.timeC = 0;
											// 		timerGet.status = false;
											// 	}
											// });

											self.getdata.push(dataPost);
											// get data bukalapak
											timerGet.lData++;
										}else{
											timerGet.lData++;
										}
										setTimeout(getDataAccoun,0);
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
						viewDataCallbcak(self.getdata,req,res);
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