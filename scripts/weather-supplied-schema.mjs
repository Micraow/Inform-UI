/** Additive Weather contract. The existing required snapshot and numeric fields are unchanged. */
export function installWeatherSuppliedSchema({defs}) {
 const text=(max=500)=>({type:'string',minLength:1,maxLength:max}),bool={type:'boolean'};
 const object=(properties,required=[])=>({type:'object',properties,required,additionalProperties:false});
 const labelPair=object({celsius:text(),fahrenheit:text(),a11yCelsius:text(),a11yFahrenheit:text()},['celsius','fahrenheit']);
 const followUps={type:'array',maxItems:12,items:object({id:text(80),label:text(200),query:text(2000),disabled:bool},['id','label','query'])};
 const action={label:text(200),available:bool};
 const p=defs.WeatherNode.properties;
 Object.assign(p,{presentation:{enum:['chart','table','compact']},initialMetric:{enum:['temperature','precipitation']},initialUnit:{enum:['celsius','fahrenheit']},useCurrent:bool,showDatePicker:bool,disabled:bool,regionLabel:text(200),tableDateLabel:text(300),resetLabel:text(200),requestedLabel:text(500),cancelledLabel:text(500),labels:object(Object.fromEntries(['current','hourly','daily','temperature','precipitation','conditions','time','unit','metric','view','high','low','observation','selected','chartView','tableView','missing','source','updated'].map(key=>[key,text(200)]))),share:object({...action,placement:{enum:['top','bottom']}},['label']),locationAction:object({...action,query:text(2000)},['label']),followUps,chartWindow:object({points:{type:'integer',minimum:1,maximum:48},startTime:{...p.current.properties.time}},['points'])});
 Object.assign(p.current.properties,{description:text(2000),temperatureLabels:labelPair});
 Object.assign(p.daily.items.properties,{label:text(200),description:text(2000),highLabels:labelPair,lowLabels:labelPair,followUps});
 Object.assign(p.hourly.items.properties,{label:text(200),description:text(2000),condition:{...p.current.properties.condition},temperatureLabels:labelPair});
}
