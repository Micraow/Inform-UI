import {object,key,short,string,array,ref,choice,bool,integer,agendaDate,agendaTime,suppliedKey} from '../primitives.mjs';
/** Original canonical declarations moved intact into a maintained source module. */
export function install({defs,node}){
// Supplied venue wall times only; semantic checks enforce dates and unique choices.
defs.RestaurantAvailabilitySlot = object({id:key,date:{...agendaDate,minLength:10,maxLength:10},time:{...agendaTime,minLength:5,maxLength:5},available:bool},['id','date','time','available']);
defs.RestaurantAvailabilitySource = object({label:short,url:string(2048,1)},['label']);
node('restaurant-availability',{title:short,venue:short,partySize:integer(1,20),timeZoneLabel:string(100,1),description:string(2000),source:ref('RestaurantAvailabilitySource'),slots:array(ref('RestaurantAvailabilitySlot'),0,100)},['title','venue','partySize','timeZoneLabel','slots']);
// Original bounded local onboarding selection; no account/provider action.
defs.OnboardingOption = object({id:{...key,pattern:'^[A-Za-z_][A-Za-z0-9_.-]{0,79}$(?![\\s\\S])'},label:short,description:string(1000)},['id','label']);
node('onboarding-selection',{label:short,description:string(2000),options:array(ref('OnboardingOption'),2,12),mode:choice('single','multiple'),initial:array(key,0,12),minimum:integer(0,12),maximum:integer(1,12),disabled:bool,continueLabel:short},['label','options']);
defs.OnboardingSelectionNode.oneOf=[object({...defs.OnboardingSelectionNode.properties,mode:{const:'single'},initial:array(key,0,1),minimum:integer(0,1),maximum:{const:1}}),object({...defs.OnboardingSelectionNode.properties,mode:{const:'multiple'}},['mode'])];
// Original finite supplied-place and media contracts; no lookup or location services.
// Original bounded local poll composer; incomplete text is a valid initial draft.
defs.PollDraftOption=object({id:suppliedKey,label:string(200)},['id','label']);
node('create-interactive-poll',{label:short,description:string(2000),question:string(500),options:array(ref('PollDraftOption'),2,8),multiple:bool,disabled:bool},['label','options']);
defs.LocationChoiceOption = object({id:suppliedKey,label:short,address:string(1000),description:string(1000)},['id','label']);
defs.LocationChoiceSource = object({label:short,url:string(2048,1)},['label']);
node('location-choice-request',{label:short,description:string(2000),options:array(ref('LocationChoiceOption'),1,12),source:ref('LocationChoiceSource')},['label','options']);
defs.BusinessGalleryImage = object({id:suppliedKey,src:string(500000,1),alt:string(2000,1),caption:string(2000)},['id','src','alt']);
node('business-gallery',{label:short,description:string(2000),images:array(ref('BusinessGalleryImage'),1,12)},['label','images']);
}
