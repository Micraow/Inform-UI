/** Original finite location permission request. Never invokes geolocation. */
export function installAskLocationSchema({node,defs}) {
 const text=(max=500)=>({type:'string',minLength:1,maxLength:max});
 node('ask-user-location',{label:text(200),status:{enum:['resolved','pending','failed']},fallback:text(2000),title:text(500),description:text(2000),learnMoreUrl:text(2048),learnMoreLabel:text(200),notNowLabel:text(200),turnOnLabel:text(200),dismissed:{type:'boolean'},disabled:{type:'boolean'},resetLabel:text(200),requestedLabel:text(1000),cancelledLabel:text(1000)},['label'],'base');
 Object.assign(defs.AskUserLocationNode,{if:{properties:{status:{enum:['pending','failed']}},required:['status']},then:{},else:{properties:{title:{},description:{},learnMoreUrl:{},learnMoreLabel:{},notNowLabel:{},turnOnLabel:{}},required:['title','description','learnMoreUrl','learnMoreLabel','notNowLabel','turnOnLabel']}});
}
