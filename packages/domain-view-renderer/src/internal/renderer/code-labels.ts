export interface CodeLabels { copy:string; copying:string; copied:string; failed:string }
export const codeEnglish: CodeLabels = {
 copy:'Copy code', copying:'Copying…', copied:'Code copied.',
 failed:'Could not copy. Select the code and copy it manually.'
};
export const codeChinese: CodeLabels = {
 copy:'复制代码', copying:'正在复制…', copied:'代码已复制。',
 failed:'无法复制。请选中代码并手动复制。'
};
