import{inflateSync}from'node:zlib';
/** Minimal original decoder for non-interlaced Chromium RGB/RGBA screenshots. */
export function pngPixels(bytes){
 if(!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error('Not PNG');
 let width,height,channels;const chunks=[];
 for(let p=8;p<bytes.length;){const n=bytes.readUInt32BE(p),kind=bytes.toString('ascii',p+4,p+8),data=bytes.subarray(p+8,p+8+n);if(kind==='IHDR'){width=data.readUInt32BE(0);height=data.readUInt32BE(4);channels=data[9]===2?3:data[9]===6?4:0;if(data[8]!==8||!channels||data[12]!==0)throw Error('Unsupported screenshot PNG');}if(kind==='IDAT')chunks.push(data);p+=12+n;}
 const packed=inflateSync(Buffer.concat(chunks)),stride=width*channels,out=Buffer.alloc(stride*height);
 const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
 for(let y=0;y<height;y++){const mode=packed[y*(stride+1)],at=y*stride;for(let x=0;x<stride;x++){const raw=packed[y*(stride+1)+1+x],a=x>=channels?out[at+x-channels]:0,b=y?out[at+x-stride]:0,c=y&&x>=channels?out[at+x-stride-channels]:0;out[at+x]=(raw+(mode===0?0:mode===1?a:mode===2?b:mode===3?Math.floor((a+b)/2):mode===4?paeth(a,b,c):(()=>{throw Error('Unsupported PNG filter');})()))&255;}}
 return{width,height,rgb:(x,y)=>Array.from(out.subarray(Math.floor(y)*stride+Math.floor(x)*channels,Math.floor(y)*stride+Math.floor(x)*channels+3))};
}
