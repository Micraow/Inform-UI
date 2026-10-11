/** Original shape-preserving cubic interpolation. Null values delimit independent runs. */
export interface TrendPoint {day:number;value:number|null}
export interface CurvePoint {x:number;y:number}
export function monotoneRuns(points:readonly TrendPoint[],x:(day:number)=>number,y:(value:number)=>number):string[]{
 const runs:CurvePoint[][]=[];let run:CurvePoint[]=[];
 for(const p of points){if(p.value===null){if(run.length)runs.push(run);run=[];}else run.push({x:x(p.day),y:y(p.value)});}if(run.length)runs.push(run);
 return runs.map(a=>{if(a.length===1)return `M${a[0].x},${a[0].y}`;const d=a.slice(1).map((p,i)=>(p.y-a[i].y)/(p.x-a[i].x));const m=a.map((_,i)=>i===0?d[0]:i===a.length-1?d[d.length-1]:d[i-1]*d[i]<=0?0:2*d[i-1]*d[i]/(d[i-1]+d[i]));
  for(let i=0;i<d.length;i++){if(d[i]===0){m[i]=m[i+1]=0;continue;}const norm=Math.hypot(m[i]/d[i],m[i+1]/d[i]);if(norm>3){const scale=3/norm;m[i]*=scale;m[i+1]*=scale;}}
  let path=`M${a[0].x},${a[0].y}`;for(let i=0;i<a.length-1;i++){const p=a[i],q=a[i+1],h=(q.x-p.x)/3;path+=` C${p.x+h},${p.y+h*m[i]} ${q.x-h},${q.y-h*m[i+1]} ${q.x},${q.y}`;}return path;});
}
