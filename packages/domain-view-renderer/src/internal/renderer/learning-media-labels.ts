export interface LearningMediaLabels {
 note:string; matching:string; answer:string; check:string; reveal:string; retry:string;
 missing:string; correct:string; incorrect:string; editing:string; reference:string; reset:string;
 imageLoad:string; audioLoad:string; mediaError:string; transcript:string; audio:string;
 disclosure:(host:string)=>string;
}
export const learningMediaEnglish:LearningMediaLabels={
 note:'Local practice using supplied media and public teaching answers. Nothing is submitted, recorded or saved.',
 matching:'Text answers are case-sensitive and matched exactly after trimming outer whitespace.',
 answer:'Your answer',check:'Check answer',reveal:'Show supplied answer',retry:'Try again',
 missing:'Choose an option or enter an answer first.',correct:'Matches the supplied answer.',incorrect:'Does not match the supplied answer. Try again or show the answer.',
 editing:'Answer changed. Check it again.',reference:'Supplied answer',reset:'Practice reset.',
 imageLoad:'Load supplied image',audioLoad:'Enable supplied audio',mediaError:'This supplied media could not be loaded. The text alternative remains available.',
 transcript:'Supplied transcript',audio:'Supplied practice audio',
 disclosure:host=>`Loading this media shares your IP address with ${host}.`,
};
export const learningMediaChinese:LearningMediaLabels={
 note:'使用所提供的媒体和公开教学答案进行本地练习。不提交、录音或保存内容。',
 matching:'文本答案区分大小写，仅去除首尾空白后进行精确匹配。',
 answer:'你的答案',check:'检查答案',reveal:'显示所提供的答案',retry:'再试一次',
 missing:'请先选择选项或填写答案。',correct:'与所提供的答案匹配。',incorrect:'与所提供的答案不匹配。请重试或查看答案。',
 editing:'答案已修改，请重新检查。',reference:'所提供的答案',reset:'练习已重置。',
 imageLoad:'加载所提供的图片',audioLoad:'启用所提供的音频',mediaError:'无法加载所提供的媒体，仍可查看文字替代内容。',
 transcript:'所提供的文字稿',audio:'所提供的练习音频',
 disclosure:host=>`加载此媒体会向 ${host} 分享你的 IP 地址。`,
};
