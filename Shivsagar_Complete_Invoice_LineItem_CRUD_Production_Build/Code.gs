const SS_ID='1H8Xf0b2ICha1DYPYmcbepRu7gWT3ZHwWnjV6dcVv5Ns';
const SESSION_TTL=21600;
const SCHEMAS={
Users:['id','name','username','passwordHash','role','branchId','active','createdAt','updatedAt'],
Branches:['id','name','code','address','phone','gstin','active','createdAt'],
Products:['id','sku','barcode','name','category','unit','hsn','gstRate','purchasePrice','sellingPrice','mrp','stock','reorderLevel','batch','expiry','supplierId','branchId','active','createdAt','updatedAt'],
Customers:['id','name','phone','whatsapp','email','address','gstin','openingBalance','creditLimit','branchId','active','createdAt','updatedAt'],
Suppliers:['id','name','phone','email','address','gstin','openingBalance','creditLimit','branchId','active','createdAt','updatedAt'],
Sales:['id','invoiceNo','date','customerId','branchId','subtotal','discount','taxableAmount','gstAmount','total','paymentMode','paidAmount','creditAmount','status','notes','createdBy','createdAt'],
SaleItems:['id','saleId','productId','sku','productName','qty','unitPrice','discount','gstRate','gstAmount','lineTotal','batch','expiry','createdAt'],
Purchases:['id','grnNo','invoiceNo','date','supplierId','branchId','subtotal','discount','taxableAmount','gstAmount','total','paidAmount','creditAmount','status','notes','createdBy','createdAt'],
PurchaseItems:['id','purchaseId','productId','sku','productName','qty','unitCost','discount','gstRate','gstAmount','lineTotal','batch','expiry','createdAt'],
SalesReturns:['id','returnNo','date','saleId','invoiceNo','customerId','branchId','subtotal','gstAmount','total','refundMode','reason','createdBy','createdAt'],
PurchaseReturns:['id','returnNo','date','purchaseId','grnNo','supplierId','branchId','subtotal','gstAmount','total','adjustmentMode','reason','createdBy','createdAt'],
Payments:['id','date','type','partyId','partyName','referenceType','referenceId','invoiceNo','branchId','amount','paymentMode','referenceNo','notes','createdBy','createdAt'],
StockAdjustments:['id','date','productId','sku','productName','branchId','type','qty','reason','reference','batch','expiry','createdBy','createdAt'],
Expenses:['id','date','category','description','amount','gstAmount','paymentMode','branchId','referenceNo','createdBy','createdAt'],
Settings:['key','value'],
AuditLog:['id','timestamp','userId','username','action','entity','entityId','details','branchId']
};
const ENTITY_MAP={dashboard:'__dashboard',products:'Products',sales:'Sales',saleItems:'SaleItems',purchases:'Purchases',purchaseItems:'PurchaseItems',customers:'Customers',suppliers:'Suppliers',payments:'Payments',expenses:'Expenses',salesReturns:'SalesReturns',purchaseReturns:'PurchaseReturns',stock:'StockAdjustments',users:'Users',branches:'Branches',settings:'Settings',audit:'AuditLog'};
function entityName(n){const x=ENTITY_MAP[n]||n;if(x==='__dashboard')return x;if(!SCHEMAS[x])throw Error('Invalid entity: '+n);return x}
function setupDatabase(){const ss=SpreadsheetApp.openById(SS_ID);Object.keys(SCHEMAS).forEach(n=>{let s=ss.getSheetByName(n)||ss.insertSheet(n);if(s.getLastRow()===0)s.appendRow(SCHEMAS[n])});let u=ss.getSheetByName('Users');if(u.getLastRow()===1)u.appendRow([Utilities.getUuid(),'Owner','admin','CHANGE_ME','Administrator','',true,new Date().toISOString(),new Date().toISOString()]);}
function doGet(){return out({ok:true,service:'Shivsagar API'})}
function doPost(e){try{let x=JSON.parse(e.postData.contents||'{}'),r;if(x.action==='login')r=login(x.payload);else if(x.action==='list')r=list(x.token,x.payload);else if(x.action==='create')r=create(x.token,x.payload);
else if(x.action==='update')r=update(x.token,x.payload);
else if(x.action==='delete')r=deleteRecord(x.token,x.payload);
else if(x.action==='transaction')r=transaction(x.token,x.payload);
else if(x.action==='getTransaction')r=getTransaction(x.token,x.payload);
else if(x.action==='updateTransaction')r=updateTransaction(x.token,x.payload);
else throw Error('Unknown action');return out(r)}catch(err){return out({ok:false,message:err.message})}}
function login(p){if(!p?.username||!p?.password)throw Error('Username and password are required');let u=read('Users').find(x=>String(x.username)===String(p.username)&&String(x.active).toLowerCase()!=='false');if(!u||String(u.passwordHash)!==String(p.password))throw Error('Invalid username or password');let t=Utilities.getUuid();CacheService.getScriptCache().put('sess_'+t,JSON.stringify({id:u.id,name:u.name,username:u.username,role:u.role,branchId:u.branchId}),SESSION_TTL);return{ok:true,token:t,user:{id:u.id,name:u.name,username:u.username,role:u.role,branchId:u.branchId}}}
function auth(t){if(!t)throw Error('Authentication required');let s=CacheService.getScriptCache().get('sess_'+t);if(!s)throw Error('Session expired; please login again');return JSON.parse(s)}
function list(t,p){let u=auth(t),n=entityName(p.entity);if(n==='__dashboard')return{ok:true,rows:[{products:read('Products').length,sales:read('Sales').length,purchases:read('Purchases').length,customers:read('Customers').length,payments:read('Payments').length,expenses:read('Expenses').length}]};return{ok:true,rows:read(n).filter(r=>!u.branchId||!r.branchId||String(r.branchId)===String(u.branchId))}}
function create(t,p){let u=auth(t),n=entityName(p.entity);if(n==='__dashboard')throw Error('Dashboard is read-only');authorize(u,n,'CREATE');let r={};SCHEMAS[n].forEach(k=>r[k]=p.data?.[k]??'');r.id=Utilities.getUuid();if(SCHEMAS[n].includes('createdAt'))r.createdAt=new Date().toISOString();if(SCHEMAS[n].includes('createdBy'))r.createdBy=u.username;if(SCHEMAS[n].includes('branchId')&&!r.branchId)r.branchId=u.branchId;append(n,r);audit(u,'CREATE',n,r.id,r);return{ok:true,row:r}}
function update(t,p){let u=auth(t),n=entityName(p.entity);if(n==='__dashboard')throw Error('Dashboard is read-only');if(!SCHEMAS[n])throw Error('Invalid entity');authorize(u,n,'UPDATE');if(!p.id)throw Error('Record id is required');let s=SpreadsheetApp.openById(SS_ID).getSheetByName(n);let h=s.getRange(1,1,1,s.getLastColumn()).getValues()[0];let vals=s.getDataRange().getValues();let idx=vals.findIndex((r,i)=>i>0&&String(r[h.indexOf('id')])===String(p.id));if(idx<1)throw Error('Record not found');let old=Object.fromEntries(h.map((k,i)=>[k,vals[idx][i]]));let merged={...old,...(p.data||{}),id:p.id,updatedAt:new Date().toISOString()};if(h.includes('createdAt'))merged.createdAt=old.createdAt;if(h.includes('createdBy'))merged.createdBy=old.createdBy;s.getRange(idx+1,1,1,h.length).setValues([h.map(k=>merged[k]??'')]);audit(u,'UPDATE',n,p.id,merged);return{ok:true,row:merged}}
function deleteRecord(t,p){let u=auth(t),n=entityName(p.entity);if(n==='__dashboard')throw Error('Dashboard is read-only');if(!SCHEMAS[n])throw Error('Invalid entity');authorize(u,n,'DELETE');if(!p.id)throw Error('Record id is required');let s=SpreadsheetApp.openById(SS_ID),sh=s.getSheetByName(n),h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0],idc=h.indexOf('id'),vals=sh.getDataRange().getValues(),idx=vals.findIndex((r,i)=>i>0&&String(r[idc])===String(p.id));if(idx<1)throw Error('Record not found');let old=Object.fromEntries(h.map((k,i)=>[k,vals[idx][i]]));sh.deleteRow(idx+1);audit(u,'DELETE',n,p.id,old);return{ok:true}}


function getTransaction(t,p){
  let u=auth(t),n=p.entity,id=p.id;
  if(!['Sales','Purchases','SalesReturns','PurchaseReturns'].includes(n))throw Error('Unsupported transaction');
  let rows=read(n),row=rows.find(r=>String(r.id)===String(id));if(!row)throw Error('Transaction not found');
  let itemSheet=n==='Sales'?'SaleItems':n==='Purchases'?'PurchaseItems':null;
  let items=itemSheet?read(itemSheet).filter(x=>String(x.saleId||x.purchaseId)===String(id)):[];
  return{ok:true,row,items}
}
function updateTransaction(t,p){
  let u=auth(t),n=p.entity,id=p.id;if(!['Sales','Purchases','SalesReturns','PurchaseReturns'].includes(n))throw Error('Unsupported transaction');
  authorize(u,n,'UPDATE');
  const ss=SpreadsheetApp.openById(SS_ID),sh=ss.getSheetByName(n);if(!sh)throw Error('Sheet missing: '+n);
  const h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0],vals=sh.getDataRange().getValues(),idc=h.indexOf('id'),idx=vals.findIndex((r,i)=>i>0&&String(r[idc])===String(id));if(idx<1)throw Error('Transaction not found');
  const old=Object.fromEntries(h.map((k,i)=>[k,vals[idx][i]])), oldItems=getTransaction(t,{entity:n,id}).items||[], newItems=p.data?.items||[];
  // Reverse old inventory, then apply new inventory. This keeps stock aligned with edited line quantities.
  if(Array.isArray(oldItems))oldItems.forEach(i=>{const q=Number(i.qty||0);if(n==='Sales')adjustStock(i.productId,q,u,'EDIT_REVERSE_SALE',id);if(n==='Purchases')adjustStock(i.productId,-q,u,'EDIT_REVERSE_PURCHASE',id);if(n==='SalesReturns')adjustStock(i.productId,-q,u,'EDIT_REVERSE_SALES_RETURN',id);if(n==='PurchaseReturns')adjustStock(i.productId,q,u,'EDIT_REVERSE_PURCHASE_RETURN',id)});
  const merged={...old,...(p.data||{}),id,updatedAt:new Date().toISOString()};delete merged.items;
  sh.getRange(idx+1,1,1,h.length).setValues([h.map(k=>merged[k]??'')]);
  const itemSheet=n==='Sales'?'SaleItems':n==='Purchases'?'PurchaseItems':null;
  if(itemSheet){
    const ish=ss.getSheetByName(itemSheet),ih=ish.getRange(1,1,1,ish.getLastColumn()).getValues()[0],iv=ish.getDataRange().getValues();
    const parentKey=n==='Sales'?'saleId':'purchaseId';
    for(let i=iv.length-1;i>0;i--)if(String(iv[i][ih.indexOf(parentKey)])===String(id))ish.deleteRow(i+1);
    newItems.forEach(i=>{let line={...i,id:Utilities.getUuid(),[parentKey]:id,createdAt:new Date().toISOString()};ish.appendRow(ih.map(k=>line[k]??''))});
    newItems.forEach(i=>{const q=Number(i.qty||0);if(n==='Sales')adjustStock(i.productId,-q,u,'EDIT_SALE',id);if(n==='Purchases')adjustStock(i.productId,q,u,'EDIT_PURCHASE',id)});
  }
  audit(u,'UPDATE_TRANSACTION',n,id,{old,oldItems,newData:p.data});return{ok:true,row:merged}
}
function transaction(t,p){
  let u=auth(t),n=entityName(p.entity),d=p.data||{};
  if(!['Sales','Purchases','SalesReturns','PurchaseReturns'].includes(n))throw Error('Unsupported transaction');
  authorize(u,n,'CREATE');
  const now=new Date().toISOString(),id=Utilities.getUuid();
  d.id=id;d.createdAt=now;if(SCHEMAS[n].includes('createdBy'))d.createdBy=u.username;if(SCHEMAS[n].includes('branchId')&&!d.branchId)d.branchId=u.branchId;
  if(n==='Sales'&&!d.invoiceNo)d.invoiceNo=nextNumber('INV');
  if(n==='Purchases'&&!d.grnNo)d.grnNo=nextNumber('GRN');
  if((n==='Sales'||n==='Purchases')&&!Array.isArray(d.items))throw Error('Transaction items are required');
  append(n,d);
  if(Array.isArray(d.items)){
    const itemEntity=n==='Sales'?'SaleItems':n==='Purchases'?'PurchaseItems':null;
    if(itemEntity) d.items.forEach(i=>{let line={...i,id:Utilities.getUuid(),saleId:n==='Sales'?id:'',purchaseId:n==='Purchases'?id:'',createdAt:now};if(itemEntity==='SaleItems')append('SaleItems',line);else append('PurchaseItems',line)});
    d.items.forEach(i=>{
      const qty=Number(i.qty||0);
      if(n==='Sales')adjustStock(i.productId,-qty,u,'SALE',id);
      if(n==='Purchases')adjustStock(i.productId,qty,u,'PURCHASE',id);
      if(n==='SalesReturns')adjustStock(i.productId,qty,u,'SALES_RETURN',id);
      if(n==='PurchaseReturns')adjustStock(i.productId,-qty,u,'PURCHASE_RETURN',id);
    });
  }
  if(n==='Sales'&&Number(d.paidAmount||0)>0)append('Payments',{id:Utilities.getUuid(),date:now,type:'RECEIPT',partyId:d.customerId||'',partyName:d.customerName||'',referenceType:'SALE',referenceId:id,invoiceNo:d.invoiceNo,branchId:u.branchId,amount:d.paidAmount,paymentMode:d.paymentMode||'Cash',referenceNo:'',notes:'POS payment',createdBy:u.username,createdAt:now});
  audit(u,'TRANSACTION',n,id,d);return{ok:true,id,invoiceNo:d.invoiceNo||d.grnNo}
}
function nextNumber(prefix){
  const n=read(prefix==='INV'?'Sales':'Purchases').length+1;
  return prefix+'-'+Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'yyyyMMdd')+'-'+String(n).padStart(5,'0');
}
function adjustStock(productId,delta,u,type,reference){
  if(!productId)return;
  const sh=SpreadsheetApp.openById(SS_ID).getSheetByName('Products');if(!sh)return;
  const h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0],idc=h.indexOf('id'),stockc=h.indexOf('stock'),vals=sh.getDataRange().getValues();
  const idx=vals.findIndex((r,i)=>i>0&&String(r[idc])===String(productId));if(idx<1)throw Error('Product not found: '+productId);
  const old=Number(vals[idx][stockc]||0),next=old+delta;if(next<0)throw Error('Insufficient stock for product '+productId);
  sh.getRange(idx+1,stockc+1).setValue(next);
  if(SCHEMAS.StockAdjustments)append('StockAdjustments',{id:Utilities.getUuid(),date:new Date().toISOString(),productId:productId,sku:'',productName:'',branchId:u.branchId,type:type,qty:delta,reason:type,reference:reference,batch:'',expiry:'',createdBy:u.username,createdAt:new Date().toISOString()});
}

function authorize(u,n,op){if(u.role!=='Administrator'&&op==='DELETE')throw Error('Only Administrator can delete records');if(u.role!=='Administrator'&&u.role!=='Manager'&&op==='UPDATE')throw Error('Insufficient permission to update records')}
function audit(u,action,entity,id,data){append('AuditLog',{id:Utilities.getUuid(),timestamp:new Date().toISOString(),userId:u.id,username:u.username,action,entity,entityId:id,details:JSON.stringify(data),branchId:u.branchId})}
function read(n){let s=SpreadsheetApp.openById(SS_ID).getSheetByName(n);if(!s||s.getLastRow()<2)return[];let h=s.getRange(1,1,1,s.getLastColumn()).getValues()[0];return s.getRange(2,1,s.getLastRow()-1,h.length).getValues().map(a=>Object.fromEntries(h.map((k,i)=>[k,a[i]])))}
function append(n,r){SpreadsheetApp.openById(SS_ID).getSheetByName(n).appendRow(SCHEMAS[n].map(k=>r[k]??''))}
function out(x){return ContentService.createTextOutput(JSON.stringify(x)).setMimeType(ContentService.MimeType.JSON)}
