export interface PersonLabels {
  role: string;
  organization: string;
  location: string;
  biography: string;
  facts: string;
  links: string;
  source: string;
  opensNewTab: string;
  suppliedNote: string;
}
export const personEnglish: Readonly<PersonLabels> = Object.freeze({
  role:'Role', organization:'Organization', location:'Location', biography:'Biography', facts:'Supplied facts', links:'Links', source:'Source', opensNewTab:'Opens in a new tab', suppliedNote:'This information was supplied and has not been independently verified.'
});
export const personChinese: Readonly<PersonLabels> = Object.freeze({
  role:'职务', organization:'机构', location:'地点', biography:'简介', facts:'提供的信息', links:'链接', source:'来源', opensNewTab:'在新标签页中打开', suppliedNote:'此信息由外部提供，未经独立核实。'
});
