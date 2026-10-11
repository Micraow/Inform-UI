/** Original bounded supplied snapshot. This module contains no captured runtime source. */
export function installTransactionDetail({defs,node}) {
 const str=(max=200)=>({type:'string',minLength:1,maxLength:max});
 const bool={type:'boolean'},key={type:'string',minLength:1,maxLength:200,pattern:String.raw`^[^\s\u0000-\u001f\u007f]+$(?![\s\S])`};
 const object=(properties,required=Object.keys(properties))=>({type:'object',properties,required,additionalProperties:false});
 const ref=name=>({$ref:'#/$defs/'+name});
 const image=object({src:str(500000),alt:str(2000)});
 const labels=object(Object.fromEntries(['merchant','date','account','category','budget','related','empty','masked'].map(name=>[name,str()])));
 const related={id:key,name:str(),dateLabel:str(),amountLabel:str(),maskedAmountLabel:str(),actionLabel:str(),pendingLabel:str(),logo:image,disabled:bool};
 const relatedRequired=['id','name','dateLabel','amountLabel','maskedAmountLabel','actionLabel'];
 defs.TransactionDetailRelated={oneOf:[object({...related,pending:{const:true}},[...relatedRequired,'pending','pendingLabel']),object({...related,pending:{const:false}},relatedRequired)]};
 defs.TransactionDetailBudget=object({limitLabel:str(),progressPct:{type:'number',minimum:0,maximum:100},color:{enum:['default','success','warning','danger','info','accent']}},['limitLabel','progressPct']);
 defs.TransactionDetailData=object({transactionId:key,name:str(),amountLabel:str(),maskedAmountLabel:str(),merchant:str(),dateLabel:str(),account:str(),category:str(),logo:image,labels,budget:ref('TransactionDetailBudget'),related:{type:'array',items:ref('TransactionDetailRelated'),minItems:0,maxItems:40}},['transactionId','name','amountLabel','maskedAmountLabel','merchant','dateLabel','account','category','labels','related']);
 node('ledger-transaction-detail',{label:str(),status:{enum:['pending','resolved','failed']},mobile:bool,sensitiveValuesHidden:bool,disabled:bool,fallback:str(2000),data:ref('TransactionDetailData')},['label'],'finance');
}
