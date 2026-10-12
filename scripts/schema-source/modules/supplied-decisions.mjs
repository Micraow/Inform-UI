import {object,short,string,array,ref,choice,integer,bool,suppliedKey,travelDate} from '../primitives.mjs';
/** Existing supplied decision and place declarations, moved without wire changes. */
export function install({defs,node}){
// Original supplied job and product decision cards; all actions are explicitly local.
defs.DecisionSource=object({label:short,url:string(2048,1)},['label','url']);
defs.SuppliedPrice=object({amount:{type:'number',minimum:0,maximum:1e12},currency:{type:'string',pattern:'^[A-Z]{3}$(?![\\s\\S])',minLength:3,maxLength:3}},['amount','currency']);
defs.JobSalary=object({minimum:{type:'number',minimum:0,maximum:1e12},maximum:{type:'number',minimum:0,maximum:1e12},currency:{type:'string',pattern:'^[A-Z]{3}$(?![\\s\\S])',minLength:3,maxLength:3},period:choice('hour','month','year')},['minimum','maximum','currency','period']);
defs.SuppliedJob=object({id:suppliedKey,title:short,organization:short,location:short,workplace:choice('remote','hybrid','onsite','unknown'),employment:choice('full-time','part-time','contract','internship','unknown'),description:string(5000),salary:ref('JobSalary'),postedDate:travelDate,deadlineDate:travelDate,url:string(2048,1)},['id','title','organization','location','workplace','employment']);
node('jobs',{label:short,description:string(2000),jobs:array(ref('SuppliedJob'),0,40),source:ref('DecisionSource')},['label','jobs']);
defs.ProductVariant=object({id:suppliedKey,label:short,availability:choice('available','unavailable','unknown'),price:ref('SuppliedPrice')},['id','label','availability']);
node('product-card',{productId:suppliedKey,name:short,brand:short,seller:short,description:string(5000),availability:choice('available','unavailable','unknown'),price:ref('SuppliedPrice'),variants:array(ref('ProductVariant'),0,12),initialVariantId:suppliedKey,initialQuantity:integer(1,20),disabled:bool,image:object({src:string(300000,1),alt:string(2000,1)},['src','alt']),source:ref('DecisionSource')},['productId','name','availability']);
// Original supplied local-business hours and restaurant dining-review reader.
defs.PlaceSource=object({label:short,url:string(2048,1)},['label','url']);
const placeDay=choice('monday','tuesday','wednesday','thursday','friday','saturday','sunday');
const placeTime={type:'string',pattern:'^(?:[01][0-9]|2[0-3]):[0-5][0-9]$(?![\\s\\S])'};
defs.BusinessHoursPeriod=object({opens:placeTime,closes:placeTime,nextDay:bool},['opens','closes']);
defs.BusinessHoursDay=object({day:placeDay,status:choice('hours','closed','unknown'),periods:array(ref('BusinessHoursPeriod'),0,4),note:string(1000)},['day','status','periods']);
node('local-business',{name:short,category:short,address:string(1000,1),description:string(3000),phoneLabel:short,timezoneLabel:short,hours:array(ref('BusinessHoursDay'),0,7),initialDay:placeDay,services:array(short,0,20),accessibility:array(short,0,20),source:ref('PlaceSource')},['name','category','address','hours']);
const diningScore={type:'number',minimum:0,maximum:5};
defs.DiningReview=object({id:suppliedKey,author:short,text:string(6000,1),rating:diningScore,food:diningScore,service:diningScore,atmosphere:diningScore,visitDate:travelDate,occasion:choice('breakfast','lunch','dinner','other','unknown'),dishes:array(short,0,12),source:ref('PlaceSource')},['id','author','text','occasion']);
node('restaurant-reviews',{label:short,restaurantName:short,reviews:array(ref('DiningReview'),0,60),description:string(2000),source:ref('PlaceSource')},['label','restaurantName','reviews']);
}
