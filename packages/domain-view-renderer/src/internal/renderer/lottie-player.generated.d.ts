import type{AnimationConfigWithData,AnimationItem}from'lottie-web';
export interface LottiePlayer {loadAnimation(config:AnimationConfigWithData<'svg'> & {autoloadSegments?:boolean;rendererSettings?:{runExpressions?:boolean}}):AnimationItem;setIDPrefix(prefix:string):void;destroy():void;}
export function createLottiePlayer(environment:{window:unknown;document:Document;navigator:unknown;setTimeout:typeof globalThis.setTimeout;clearTimeout:typeof globalThis.clearTimeout;setInterval:typeof globalThis.setInterval;clearInterval:typeof globalThis.clearInterval}):LottiePlayer;
