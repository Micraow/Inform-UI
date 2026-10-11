import{readFile,writeFile}from'node:fs/promises';import{createHash}from'node:crypto';
/** Official MIT lottie-web SVG build, scoped to the renderer owner document. */
export async function generateLottiePlayer(){
 const source=await readFile(new URL('../node_modules/lottie-web/build/player/lottie.js',import.meta.url),'utf8');
 if(createHash('sha256').update(source).digest('hex')!=='134b7463eec8de573fb3c6778c3c13368fb89f336b1b905e752f0be80de6a4c9')throw Error('Unexpected lottie-web SVG source; review before changing the pinned engine.');
 const automatic='var readyStateCheckInterval = setInterval(checkReady, 100);';if(source.split(automatic).length!==2)throw Error('Unexpected lottie ready-state bootstrap');
 const expression="var expression_function = eval('[function _expression_function(){' + val + ';scoped_bm_rt=$bm_rt}]')[0];";if(source.split(expression).length!==2)throw Error('Unexpected expression fallback');
 const module=source.replace(expression,"var expression_function = function(){throw Error('Animation expressions are disabled');};").replace(automatic,'var readyStateCheckInterval = null; // Inform UI owns all mounts; no document scanning.');
 await writeFile(new URL('../src/renderer/lottie-player.generated.js',import.meta.url),`/*! lottie-web 5.13.0, MIT, Copyright Airbnb. See THIRD_PARTY_NOTICES.md. */\nexport function createLottiePlayer(environment){\nconst {window,document,navigator,setTimeout,clearTimeout,setInterval,clearInterval}=environment;\nconst module={exports:{}},exports=module.exports;\n${module}\nreturn module.exports;\n}\n`);
}
