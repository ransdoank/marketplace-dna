'use strict';
/* 
    request = {
        allData: self.allData.users[UID],
	 	u : UID parent,
	 	p : customer id,
	 	c : condition,
	 	d : data to save,
	 	code : id PO,
    }
*/
let _foreach = require('./_foreach');
let dataReturns = {
    u : '',
	p : '',
	c : '',
	d : '',
    code : ''
    // update:''
};
let allData = '';
let allCustomer = '';

function orderSave(request) {
    console.log('id post '+request.p)
    allData = request.allData;
    allCustomer = request.allCustomer;

    let countDataOrder = 0;
    let idOrderExist = false;
    let dataAllOrder = getDataByKey(request.allData,'order');
    if(dataAllOrder){
        _foreach(dataAllOrder, function (v1, k1, o1) {
            if(k1 == request.p){
                idOrderExist = true;
                _foreach(v1, function (v2, k2, o2) {
                    if(v2){
                        countDataOrder++;
                    }
                });
            }
        });
    }
    
    if(idOrderExist == true){
        let newIdOrder = '';
        if(countDataOrder > 0 &&  countDataOrder < 10){
            newIdOrder = request.code+'-000'+countDataOrder;
        }else if(countDataOrder >= 10 &&  countDataOrder < 100){
            newIdOrder = request.code+'-00'+countDataOrder;
        }else if(countDataOrder >= 100 &&  countDataOrder < 1000){
            newIdOrder = request.code+'-0'+countDataOrder;
        }else{
            newIdOrder = request.code+'-'+countDataOrder;
        }
        let a = {
            UID : request.u,
            idCode : request.p,
            code : newIdOrder,
            data : request.d,
            status : request.c
        };
        dataReturns.u = request.u;
        dataReturns.p = request.p;
        dataReturns.c = request.c;
        dataReturns.code = newIdOrder;
        dataReturns.d = updateOrder(a);
    }else{
        let a = {
            UID : request.u,
            idCode : request.p,
            code :	request.code+'-0000',
            data :	request.d,
            status : request.c
        };
        dataReturns.u = request.u;
        dataReturns.p = request.p;
        dataReturns.c = request.c;
        dataReturns.code = request.code+'-0000';
        dataReturns.d = updateOrder(a);
    }
    return dataReturns;
};

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

function updateOrder(request){

    let _returns = {
        produk:[],
        order:[],
        updateMarketplace : [],
        updateOrder : [],
        updateCustomer : []
    };
    let UID = request.UID;
    if(request.idCode && request.code && request.data){
        // _returns.table = 'users/'+UID+'/order/'+(request.idCode)+'/'+(request.code);

        let data = request.data; 
        let _tmmp = [];
        let _tmmp1 = [];
        let _tglNow = '';
        let _idStaffInput = '';
        let sku1 = false;
        let sup1 = false;
        let stok_u = '';
        let updateProdukStok = false;
        let statusStok = '';
        
        if(data.customer.ktg && data.customer.id && data.total.pembayaran.length > 0){
            let dataCountTot = data.total.pembayaran.length;
            // let CustDataTmp = data.customer;
            let PembayaranlTmp = data.total.pembayaran[dataCountTot -1];
            if( PembayaranlTmp.statusBayar.toLowerCase() == 'cicil' || PembayaranlTmp.statusBayar.toLowerCase() == 'lunas' ){
                updateProdukStok = true;
            }
        }
            
        if(data.produk.length > 0){
            let ktgProdulList = '';
            let id = '';
            let sku = '';
            let stok = '';
            let sup = '';
            let jum = '';
            let subTotal = '';
            _foreach(data.produk, function (value, key, o) {
                ktgProdulList = getDataByKey(value,'ktg');//value1;
                
                if(ktgProdulList != '-L123456-KategoriPromo'){
                    // console.log('ktgProdulList ke '+key+' : '+ktgProdulList);
                    id = getDataByKey(value,'id');//value1;
                    sku = getDataByKey(value,'sku');//value1;
                    stok = getDataByKey(value,'stok');//value1;
                    sup = getDataByKey(value,'id_suplier');//value1;
                    jum = getDataByKey(value,'jumlah');//value1;
                    subTotal = getDataByKey(value,'total');//value1;
                    
                    if(id && sku && sup && stok && jum){
                        // console.log('id '+id+' sku '+sku+' stok '+stok+' sup '+sup+' jum '+jum+' subTotal '+subTotal)
                        // _returns.table2 = 'users/'+UID+'/produk/'+id;
                        let _feedback = getDataByKey(allData.produk,id);//this.get_data(_returns.table2);
                        if(_feedback){
                            let value5 = getDataByKey(_feedback,'varian');
                            if(value5){
                                let sku1 = false;
                                let stokIn = '';
                                let stokOut = '';
                                let statusStok = '';
                                let pos_stok = '';
                                let key3 = '';
                                _foreach(value5, function (valueUp, keyUp, oUp) {
                                    if(valueUp){
                                        key3 = keyUp;
                                        let skuGetData = getDataByKey(valueUp,'sku');
                                        if(skuGetData){
                                            if(skuGetData == sku){
                                                sku1 = true;
                                            }else{
                                                sku1 = false;                                                                
                                            }
                                        }
                                        let stokGetData = getDataByKey(valueUp,'stok');
                                        if(stokGetData){
                                            if(stokGetData.length > 0 ){
                                                let saleStok = stokGetData[(stokGetData.length)-1];
                                                stokIn = getDataByKey(saleStok,'stokIn');//VregStok;
                                                stokOut =  getDataByKey(saleStok,'stokOut');//VregStok;
                                                statusStok = getDataByKey(saleStok,'statusStok');// VregStok;
                                                if(statusStok == 'stok_terbatas'){
                                                    if(stokIn != stok){
                                                        stok = stokIn;
                                                    }
                                                    stokIn = stok - jum;
                                                }else if(statusStok == 'stok_tersedia'){
                                                    if(stokIn != stok){
                                                        stok = stokIn;
                                                    }
                                                    stokIn = stok - jum;
                                                }else if(statusStok == 'stok_habis'){            
                                                }
                                                pos_stok = stokGetData.length;
                                            }
                                        }
                                    }
                                    if(sku1 == true ){
                                        if(statusStok == 'stok_terbatas'){
                                            if(stokIn == 0 || stokIn < 0){
                                                statusStok = 'stok_habis';
                                            }
                                        }
                                        stok_u = {
                                            date : data.create,
                                            description : 'Order #'+request.code,
                                            status : true,
                                            statusStok : statusStok,
                                            stokIn : stokIn,
                                            stokOut : jum,
                                            updateID : UID,
                                            statusOrder : true,
                                            subTotal : subTotal
                                        };
        
                                        if(updateProdukStok == true){
                                            _returns.produk.push({
                                                link:'users/'+UID+'/produk/'+id+'/varian/'+key3+'/stok/'+pos_stok,
                                                id_produk:id,
                                                varian:key3,
                                                key_stok:pos_stok,
                                                val_stok:stok_u,
                                                ktg:'nonPromo'
                                            });
                                            if(data.status.status == 'retur'){
                                                stok_u = {
                                                    date : data.create,
                                                    description : 'Retur Order #'+request.code,
                                                    status : false,
                                                    statusStok : statusStok,
                                                    stokIn : stokIn + jum,
                                                    stokOut : 0 - jum,
                                                    updateID : UID,
                                                    statusOrder : true,
                                                    subTotal : - subTotal
                                                };
                                                _returns.produk.push({
                                                    link:'users/'+UID+'/produk/'+id+'/varian/'+key3+'/stok/'+(pos_stok+1),
                                                    id_produk:id,
                                                    varian:key3,
                                                    key_stok:(pos_stok+1),
                                                    val_stok:stok_u,
                                                    ktg:'nonPromo'
                                                });
                                            }
                                            if(data.status.status == 'cancel' ){
                                                stok_u = {
                                                    date : data.create,
                                                    description : 'Cancel Order #'+request.code,
                                                    status : false,
                                                    statusStok : statusStok,
                                                    stokIn : stokIn + jum,
                                                    stokOut : 0 - jum,
                                                    updateID : UID,
                                                    statusOrder : true,
                                                    subTotal : - subTotal
                                                };
                                                _returns.produk.push({
                                                    link:'users/'+UID+'/produk/'+id+'/varian/'+key3+'/stok/'+(pos_stok+1),
                                                    id_produk:id,
                                                    varian:key3,
                                                    key_stok:(pos_stok+1),
                                                    val_stok:stok_u,
                                                    ktg:'nonPromo'
                                                });
                                            }
                                        }
                                        sku1 = false;
                                        sup1 = false;
                                    }
                                });
                            }
                        }
                    }
                }
                if(ktgProdulList == '-L123456-KategoriPromo'){
                    console.log('ada produk promo')
                    /*if(value.listBarangPromo.length > 0 ){
                        foreach (value.listBarangPromo as keyP => valueP){
                                foreach (valueP as kP => vP){
                                    if(kP == 'id'){
                                        id = vP;
                                    }
                                    if(kP == 'sku'){
                                        sku = vP;
                                    }
                                    if(kP == 'stok'){
                                        stok = vP;
                                    }
                                    if(kP == 'id_suplier'){
                                        sup = vP;
                                    }
                                    if(kP == 'jumlah'){
                                        jum = vP;
                                    }
                                    if(kP == 'total'){
                                        subTotal = vP;
                                    }
                                };
                                if(!empty(id) && !empty(sku) && !empty(sup) && !empty(stok) && !empty(jum)){
                                    _returns.table3 = 'users/'.UID.'/produk/'.id;
                                    _feedback = this.get_data(_returns.table3);
                                    if(!empty(_feedback)){
                                        foreach(_feedback as key5 => value5){
                                            if(key5 == 'varian'){
                                                foreach(value5 as key3 => value3){
                                                    foreach(value3 as key4 => value4){
                                                        if(key4 == 'sku' ){
                                                            if(value4 == sku){
                                                                sku1 = true;
                                                            }else{
                                                                sku1 = false;                           
                                                            }
                                                        }
                                                        if(key4 == 'stok' ){
                                                            if(value4.length > 0){
                                                                saleStok = value4[(value4.length)-1];
                                                                foreach(saleStok as KpromoStok => VpromoStok){
                                                                    if(KpromoStok == 'stokIn'){
                                                                        stokIn = VpromoStok;
                                                                    }
                                                                    if(KpromoStok == 'stokOut'){
                                                                        stokOut = VpromoStok;
                                                                    }
                                                                    if(KpromoStok == 'stokIn'){
                                                                        stokIn = VpromoStok;
                                                                    }
                                                                    if(KpromoStok == 'statusStok'){
                                                                        statusStok = VpromoStok;
                                                                    }
                                                                };
                                                                if(statusStok == 'stok_terbatas'){
                                                                    if(stokIn != stok){
                                                                        stok = stokIn;
                                                                    }
                                                                    stokIn = stok - jum;
                                                                }else if(statusStok == 'stok_tersedia'){
                                                                    if(stokIn != stok){
                                                                        stok = stokIn;
                                                                    }
                                                                    stokIn = stok - jum;
                                                                }else if(statusStok == 'stok_habis'){
                                                                
                                                                }
                                                                pos_stok = value4.length;
                                                            }
                                                        }
                                                    };
                                                    if(sku1 == true ){
                                                        if(statusStok == 'stok_terbatas'){
                                                            if(stokIn == 0 || stokIn < 0){
                                                                statusStok = 'stok_habis';
                                                            }
                                                        }
                                                        stok_u = [
                                                            'date' => data.create,
                                                            'description'=> 'Order #'.request.code,
                                                            'status' => true,
                                                            'statusStok'=> statusStok,
                                                            'stokIn' => stokIn,
                                                            'stokOut' => jum,
                                                            'updateID'=> UID,//Session::get('uid'),
                                                            'statusOrder' => true,
                                                            'subTotal' => subTotal
                                                        ];

                                                        if(updateProdukStok == true){
                                                            // _feedback1 = this.update_data(_returns.table3.'/varian/'.key3.'/stok/'.pos_stok,stok_u);
                                                            // _feedback1 = this.update_data(_returns.table2.'/varian/'.key3.'/stok/'.pos_stok,stok_u);
                                                            _returns['updateStokTable3'.key3.'Stok'.pos_stok] = stok_u;
                                                            _returns['updateStokTable2'.key3.'Stok'.pos_stok] = stok_u;
                                                            if(data.status.status == 'retur'){
                                                                stok_u = [
                                                                    'date' => data.create,
                                                                    'description'=> 'Retur Order #'.request.code,
                                                                    'status' => false,
                                                                    'statusStok'=> statusStok,
                                                                    'stokIn' => stokIn + jum,
                                                                    'stokOut' => 0 - jum,
                                                                    'updateID'=> UID,//Session::get('uid'),
                                                                    'statusOrder' => true,
                                                                    'subTotal' => - subTotal
                                                                ];
                                                                _returns['updateStokReturTable2'.key3.'Stok'.(pos_stok+1)] = stok_u;
                                                                // this.update_data(_returns.table2.'/varian/'.key3.'/stok/'.(pos_stok+1),stok_u);
                                                            }
                                                            if(data.status.status == 'cancel' ){
                                                                stok_u = [
                                                                    'date' => data.create,
                                                                    'description'=> 'Cancel Order #'.request.code,
                                                                    'status' => false,
                                                                    'statusStok'=> statusStok,
                                                                    'stokIn' => stokIn + jum,
                                                                    'stokOut' => 0 - jum,
                                                                    'updateID'=> UID,//Session::get('uid'),
                                                                    'statusOrder' => true,
                                                                    'subTotal' => - subTotal
                                                                ];
                                                                _returns['updateStokCancelTable2'.key3.'Stok'.(pos_stok+1)] = stok_u;
                                                                // this.update_data(_returns.table2.'/varian/'.key3.'/stok/'.(pos_stok+1),stok_u);
                                                            }
                                                        }
                                                        sku1 = false;
                                                        sup1 = false;
                                                    };
                                                };
                                            }
                                        };
                                    }
                                };
                            }
                    }
                        if(value.listBarangFree.length > 0 ){
                            foreach (value.listBarangFree as keyP => valueP){
                                foreach (valueP as kP => vP){
                                    if(kP == 'id'){
                                        id = vP;
                                    }
                                    if(kP == 'sku'){
                                        sku = vP;
                                    }
                                    if(kP == 'stok'){
                                        stok = vP;
                                    }
                                    if(kP == 'id_suplier'){
                                        sup = vP;
                                    }
                                    if(kP == 'jumlah'){
                                        jum = vP;
                                    }
                                    if(kP == 'total'){
                                        subTotal = vP;
                                    }
                                };
                                if(!empty(id) && !empty(sku) && !empty(sup) && !empty(stok) && !empty(jum)){
                                    _returns.table3 = 'users/'.UID.'/produk/'.id;
                                    _feedback = this.get_data(_returns.table3);
                                    if(!empty(_feedback)){
                                        foreach(_feedback as key5 => value5){
                                            if(key5 == 'varian'){
                                                foreach(value5 as key3 => value3){
                                                    foreach(value3 as key4 => value4){
                                                        if(key4 == 'sku' ){
                                                            if(value4 == sku){
                                                                sku1 = true;
                                                            }else{
                                                                sku1 = false;                                                                
                                                            }
                                                        }
                                                        if(key4 == 'stok' ){
                                                            if(value4.length > 0){
                                                                saleStok = value4[(value4.length)-1];
                                                                foreach(saleStok as KpromoStok => VpromoStok){
                                                                    if(KpromoStok == 'stokIn'){
                                                                        stokIn = VpromoStok;
                                                                    }
                                                                    if(KpromoStok == 'stokOut'){
                                                                        stokOut = VpromoStok;
                                                                    }
                                                                    if(KpromoStok == 'stokIn'){
                                                                        stokIn = VpromoStok;
                                                                    }
                                                                    if(KpromoStok == 'statusStok'){
                                                                        statusStok = VpromoStok;
                                                                    }
                                                                };
                                                                if(statusStok == 'stok_terbatas'){
                                                                    if(stokIn != stok){
                                                                        stok = stokIn;
                                                                    }
                                                                    stokIn = stok - jum;
                                                                }else if(statusStok == 'stok_tersedia'){
                                                                    if(stokIn != stok){
                                                                        stok = stokIn;
                                                                    }
                                                                    stokIn = stok - jum;
                                                                }else if(statusStok == 'stok_habis'){
                                                                
                                                                }
                                                                pos_stok = value4.length;
                                                            }
                                                        }
                                                    };
                                                    if(sku1 == true ){
                                                        if(statusStok == 'stok_terbatas'){
                                                            if(stokIn == 0 || stokIn < 0){
                                                                statusStok = 'stok_habis';
                                                            }
                                                        }
                                                        stok_u = [
                                                            'date' => data.create,
                                                            'description'=> 'Order #'.request.code,
                                                            'status' => true,
                                                            'statusStok'=> statusStok,
                                                            'stokIn' => stokIn,
                                                            'stokOut' => jum,
                                                            'updateID'=> UID,//Session::get('uid'),
                                                            'statusOrder' => true,
                                                            'subTotal' => subTotal
                                                        ];

                                                        if(updateProdukStok == true){
                                                            // _feedback1 = this.update_data(_returns.table3.'/varian/'.key3.'/stok/'.pos_stok,stok_u);
                                                            // _feedback1 = this.update_data(_returns.table2.'/varian/'.key3.'/stok/'.pos_stok,stok_u);
                                                            _returns['updateStokTable3'.key3.'Stok'.pos_stok] = stok_u;
                                                            _returns['updateStokTable2'.key3.'Stok'.pos_stok] = stok_u;
                                                            if(data.status.status == 'retur'){
                                                                stok_u = [
                                                                    'date' => data.create,
                                                                    'description'=> 'Retur Order #'.request.code,
                                                                    'status' => false,
                                                                    'statusStok'=> statusStok,
                                                                    'stokIn' => stokIn + jum,
                                                                    'stokOut' => 0 - jum,
                                                                    'updateID'=> Session::get('uid'),
                                                                    'statusOrder' => true,
                                                                    'subTotal' => - subTotal
                                                                ];
                                                                _returns['updateStokReturTable2'.key3.'Stok'.(pos_stok+1)] = stok_u;
                                                                // this.update_data(_returns.table2.'/varian/'.key3.'/stok/'.(pos_stok+1),stok_u);
                                                            }
                                                            if(data.status.status == 'cancel' ){
                                                                stok_u = [
                                                                    'date' => data.create,
                                                                    'description'=> 'Cancel Order #'.request.code,
                                                                    'status' => false,
                                                                    'statusStok'=> statusStok,
                                                                    'stokIn' => stokIn + jum,
                                                                    'stokOut' => 0 - jum,
                                                                    'updateID'=> Session::get('uid'),
                                                                    'statusOrder' => true,
                                                                    'subTotal' => - subTotal
                                                                ];
                                                                _returns['updateStokCancelTable2'.key3.'Stok'.(pos_stok+1)] = stok_u;
                                                                // this.update_data(_returns.table2.'/varian/'.key3.'/stok/'.(pos_stok+1),stok_u);
                                                            }
                                                        }
                                                        sku1 = false;
                                                        sup1 = false;
                                                    };
                                                };
                                            }
                                        };
                                    }
                                };
                            }
                        }*/                            
                }
            });

            if(data.loyalty.point && updateProdukStok == true){
                console.log('ada data loyalty point')
                /*    _returns.tablePoint = 'customer/'.request.idCode.'/point';
                    getDataPoint = this.get_data(_returns.tablePoint);
                    pointOld = 0;
                    if(getDataPoint.length > 0 ){
                        lPoint = ((getDataPoint.length) - 1);
                        foreach(getDataPoint as keyA => valueA){
                            if(keyA == lPoint){
                                pointOld = valueA['pointNew'];
                            }
                        }
                        toUpdatePoint = [
                            'listLoyalty' => data.loyalty.listLoyalty,
                            'pointOld' => pointOld,
                            'pointNew' => (data.loyalty.point + pointOld),
                            'idOrder' => request.code,
                            'idStaffInput'=> UID,//Session::get('uid')
                        ];
                        _returns['point'.(lPoint+1)] = toUpdatePoint;
                        // this.update_data(_returns.tablePoint.'/'.(lPoint+1),toUpdatePoint);
                    }else{
                        toUpdatePoint = [
                            'listLoyalty' => data.loyalty.listLoyalty,
                            'pointOld' => pointOld,
                            'pointNew' => data.loyalty.point,
                            'idOrder' => request.code,
                            'idStaffInput'=> UID,//Session::get('uid')
                        ];
                        _returns['point0'] = toUpdatePoint;
                        // this.update_data(_returns.tablePoint.'/'.(0),toUpdatePoint);
                    }*/
            }
        }
        
        // update data transaksi
        // status  = this.update_data(_returns.table,data);
        _returns.order.push({
            link: 'users/'+UID+'/order/'+(request.idCode)+'/'+(request.code),
            id_customer: request.idCode,
            key_po: request.code,
            val_po: data,
        });

            // if(empty(status)){
            //     status = true;
            // }
            // if(updateProdukStok == true){
            //     _returns['message'] = updateProdukStok;
            //     _returns['status'] = status;
            //     _returns['IdReferal'] = request.code;
            //     _returns['updateProdukStok'] = updateProdukStok;
            //     _returns['statusdataprod '] = data.status.status;
            // }else{
            //     _returns['message'] = updateProdukStok;
            //     _returns['status'] = status;
            //     _returns['IdReferal'] = request.code;
            //     _returns['updateProdukStok'] = updateProdukStok;
            //     _returns['statusdataprod '] = data.status.status;
            // }
            // _returns['status'] = updateProdukStok;
            // return _returns;
            
            // db = firebase("db");
            // reference = db.getReference('users/'.UID.'/order/').orderByKey().equalTo(request.idCode);
            // snapshot = reference.getSnapshot();
            // dataOrder = snapshot.getValue();

            // dataGetCustomer34 = this.get_data('customer/'.request.idCode);
            // dataGetCustomer34 = json_decode(json_encode(dataGetCustomer34));
        
        let dataGetCustomer34 = getDataByKeyVal(allCustomer,'id',request.idCode);
        // _returns.dataCus = dataGetCustomer34;
        
        
        let dataOrder = getDataByKey(allData,'order');
        let ubahData = [];
        let countDataOrder = 0;
        if(dataOrder){
            _foreach(dataOrder, function (v1, k1, o1) {
                if(k1 == request.idCode){
                    _foreach(v1, function (v2, k2, o2) {
                        if(v2){
                            ubahData.push({key:k2,val:v2});
                            countDataOrder++;
                        }
                    });
                }
            });
        }

        // let tmp_PO = dataOrder[request.idCode].length;

        // let ubahData = dataOrder[request.idCode];
        

        if(dataGetCustomer34){
            if(dataGetCustomer34.origin.kategori.toLowerCase() == 'leads' && countDataOrder > 0){
                if(updateProdukStok == true ){
                    // this.update_data('customer/'.request.idCode.'/kategori','Pelanggan');
                    _returns.updateCustomer.push({
                        link:'customer/'+request.idCode+'/kategori',
                        id_customer:request.idCode,
                        data: 'Pelanggan'
                    });
                    if(ubahData.length > 0){
                        _foreach(ubahData, function (v, k, o) {
                            if(v){
                                _returns.updateOrder.push({
                                    link:'users/'+UID+'/order/'+request.idCode+'/'+v.key+'/customer/ktg',
                                    id_customer:request.idCode,
                                    data: 'Pelanggan'
                                });
                            }
                        });
                    }
                }
            }
        }
            // this.mailPO(request.idCode,request.code,data,request.status,UID);
        

        if(data.marketPlace){
            // _returns.table = 'users/'.UID.'/marketplace/'.data.marketPlace.marketPlace.'/transaksiImport/';
            // _returns['idMarketPlace'] = this.create_data(_returns.table,data.marketPlace);
            _returns.updateMarketplace.push({
                link:'users/'+UID+'/marketplace/'+data.marketPlace.marketPlace+'/transaksiImport/',
                name : 'transaksiImport',
                market_id: data.marketPlace.marketPlace,
                data : data.marketPlace
            });
        }
    }
    return _returns;
};

module.exports = orderSave;