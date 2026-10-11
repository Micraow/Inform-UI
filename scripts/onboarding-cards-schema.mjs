/** Original, finite onboarding presentations; no service or client dispatcher. */
export function installOnboardingCardsSchema({node,defs}) {
 const text=(max=500,min=1)=>({type:'string',minLength:min,maxLength:max}),bool={type:'boolean'};
 const object=(properties,required=[])=>({type:'object',properties,required,additionalProperties:false});
 const array=(items,max=30)=>({type:'array',maxItems:max,items});
 const common={label:text(200),status:{enum:['resolved','pending','failed']},fallback:text(2000),disabled:bool,requestedLabel:text(500),cancelledLabel:text(500),emptyLabel:text(500)};
 const image={imageSrc:text(2048),darkImageSrc:text(2048)};
 const resolved=(name,required)=>Object.assign(defs[name],{if:{properties:{status:{enum:['pending','failed']}},required:['status']},then:{},else:{properties:Object.fromEntries(required.map(key=>[key,{}])),required}});
 const feature=object({id:text(80),featureId:text(80),title:text(300),description:text(1200),...image,artworkLabel:text(200),tooltip:text(500),disabled:bool},['id','featureId','title','description']);
 const benefit=object({id:text(80),featureId:text(80),title:text(300),description:text(1200),symbol:text(12),disabled:bool},['id','title','description']);
 node('onboarding-feature-card',{...common,title:text(300),welcomeHeading:text(300),welcomeBody:text(12000),features:array(feature,12),benefits:array(benefit,20),previousLabel:text(200),nextLabel:text(200)},['label'],'base');
 resolved('OnboardingFeatureCardNode',['title','features','benefits']);
 const plugin=object({id:text(200),label:text(300),description:text(1200),status:{enum:['available','connected','unavailable']},statusLabel:text(300),connectLabel:text(300),...image,disabled:bool},['id','label','status']);
 node('onboarding-plugin-suggestions',{...common,title:text(300),plugins:array(plugin,30),canBrowse:bool,canConnect:bool,browseLabel:text(300)},['label'],'base');
 resolved('OnboardingPluginSuggestionsNode',['title','plugins']);
 const task=object({id:text(80),label:text(300),description:text(1200),prompt:text(4000),starterPromptId:text(200),requiresSitePreview:bool,completed:bool,disabled:bool,...image,imageWidth:{type:'integer',minimum:16,maximum:160},symbol:text(12)},['id','label']);
 node('onboarding-starter-tasks',{...common,heading:text(500),variant:{enum:['pills','cards','selection']},tasks:array(task,20),selectedTaskId:text(80),canRequestSitePreview:bool,actionLabel:text(200),resetLabel:text(200)},['label'],'base');
 resolved('OnboardingStarterTasksNode',['heading','tasks']);
}
