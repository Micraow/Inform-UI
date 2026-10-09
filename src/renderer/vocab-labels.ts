export interface VocabLabels {
  language:string; pronunciation:string; partOfSpeech:string; meanings:string;
  translation:string; examples:string; show:string; hide:string; reset:string;
  assessment:string; again:string; familiar:string; againStatus:string;
  familiarStatus:string; resetStatus:string; note:string;
}
export const vocabEnglish:VocabLabels = {
  language:'Language', pronunciation:'Pronunciation', partOfSpeech:'Part of speech',
  meanings:'Meanings', translation:'Translation', examples:'Examples',
  show:'Show meaning', hide:'Hide meaning', reset:'Reset review',
  assessment:'Your self-assessment', again:'Again', familiar:'Familiar',
  againStatus:'Self-assessment: Again.', familiarStatus:'Self-assessment: Familiar.',
  resetStatus:'Review reset. Meanings are hidden and your self-assessment is cleared.',
  note:'Content was supplied in this document. Review marks are self-assessments for this page only, not verified mastery; they are not saved.'
};
export const vocabChinese:VocabLabels = {
  language:'语言', pronunciation:'发音', partOfSpeech:'词性',
  meanings:'释义', translation:'翻译', examples:'例句',
  show:'显示释义', hide:'隐藏释义', reset:'重置复习',
  assessment:'你的自我评估', again:'再练一次', familiar:'熟悉',
  againStatus:'自我评估：再练一次。', familiarStatus:'自我评估：熟悉。',
  resetStatus:'已重置复习。释义已隐藏，自我评估已清除。',
  note:'内容由本文档提供。复习标记仅为本页的自我评估，不代表已验证的掌握程度；不会保存。'
};
