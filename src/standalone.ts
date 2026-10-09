import {mount} from './renderer/index.js';
const data=document.getElementById('iui-data');
const host=document.getElementById('iui');
if(data&&host){
  try { mount(host,JSON.parse(data.textContent??''),{styles:false}); }
  catch(error){host.textContent=error instanceof Error?error.message:'The document could not be rendered';host.setAttribute('role','alert');}
}
