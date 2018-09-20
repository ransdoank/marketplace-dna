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

						if(self.acc.data[id].accountbukalapak){
							if(self.acc.data[id].accountbukalapak.length > 0){//[self.acc.id[timerGet.lData]].accountbukalapak){
							// ambil data per account
								timerGet.lData = 0;
								setTimeout(function getDataAccoun(){
									if(timerGet.lData < self.acc.data[id].accountbukalapak.length){
										if(self.acc.data[id].accountbukalapak[timerGet.lData]){
											//get data produk
											timerGet1.get = 1;
											timerGet1.status = true;
											let dataTmpAcc = self.acc.data[id].accountbukalapak[timerGet.lData];

											setTimeout(function getData(){
												if(timerGet1.get > 0){
													if(timerGet1.status == true){
														// crete tmp array
														if(timerGet1.get == 1){
															self.getdata[dataTmpAcc.i] = [];
															self.getdata[dataTmpAcc.i]['getProdukNotSale'] = [];
														}

														let dataPost = qs.stringify({
															pass: self._paramsData.pass,
															met: self._paramsData.met,
															u : dataTmpAcc.i,
															p : dataTmpAcc.t,
															c : 'getProdukNotSale',
															d : timerGet1.get,
															_w : 'bukalapak'
														});
														request.get({
															headers: {'content-type': 'application/x-www-form-urlencoded'},
															url: self._paramsData.uri+'2?'+dataPost,
															body: dataPost
														}, function(error, response, body){
															if(!error && response.body){
																let _returns =  JSON.parse(response.body);
																let feedback = [];
																console.log('_returns status:: '+_returns.status+', data '+_returns.data.length);
																if(_returns.status == true && _returns.data){
																	if(_returns.data.length > 0){
																		feedback = replaceText(_returns.data);
																	}

																}

																if(feedback.length > 0 && feedback.length <= 50){
																	console.log('feedback length '+feedback.length);
																	for (let i = 0; i < feedback.length; i++) {
																		self.getdata[dataTmpAcc.i]['getProdukNotSale'].push(feedback[i]);
																	}

																	timerGet1.status = true;
																	timerGet1.get++;
																}else{
																	timerGet1.status = false;
																	timerGet1.get = 0;
																}
															}else{
																if(timerGet1.get == 2){
																	console.log('error call produk');
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
													if(self.getdata[dataTmpAcc.i]['getProdukNotSale'].length > 0 ){
														console.log('extract produk '+dataTmpAcc.i);
														// get data bukalapak
														// generateProduk('produk',dataTmpAcc,);
													}
													timerGet.lData++;
													setTimeout(getDataAccoun,0);
												}
											},0);
											// self.getdata.push(dataPost);
											// // get data bukalapak
											// timerGet.lData++;
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