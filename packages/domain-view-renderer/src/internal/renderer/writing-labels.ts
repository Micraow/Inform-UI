export interface WritingLabels {
 copy:string; select:string; revert:string; copying:string; copied:string; earlier:string;
 failed:string; selected:string; reverted:string; unchanged:string; changed:string;
 local:string; tooLong:string; count:(length:number)=>string;
}
export const writingEnglish:WritingLabels={
 copy:'Copy',select:'Select text',revert:'Revert',copying:'Copying…',copied:'Current draft copied.',
 earlier:'An earlier version was copied. Your current draft has changed.',
 failed:'Could not copy. Select the text and copy it manually.',
 selected:'Text selected. Copy it manually using your browser or keyboard.',reverted:'Original text restored.',
 unchanged:'Unchanged',changed:'Edited locally',local:'Local draft only. Changes are not saved or sent.',
 tooLong:'The draft exceeds 12000 Unicode code points. Shorten it before copying.',
 count:length=>`${length} / 12000 Unicode code points`
};
export const writingChinese:WritingLabels={
 copy:'复制',select:'选择文本',revert:'还原',copying:'正在复制…',copied:'当前草稿已复制。',
 earlier:'已复制较早的版本。当前草稿已更改。',failed:'无法复制。请选中文本并手动复制。',
 selected:'已选中文本。请使用浏览器或键盘手动复制。',reverted:'已还原原始文本。',
 unchanged:'未更改',changed:'已在本地编辑',local:'仅限本地草稿。更改不会保存或发送。',
 tooLong:'草稿超过 12000 个 Unicode 码点。请缩短后再复制。',count:length=>`${length} / 12000 个 Unicode 码点`
};
