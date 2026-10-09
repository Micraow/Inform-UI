export interface ChoiceGalleryLabels {
  clear: string; noSelection: string; selected: string; accepted: string; rejected: string;
  source: string; opensNewTab: string; locationDisclosure: string; galleryDisclosure: string;
}
export const choiceGalleryEnglish: Readonly<ChoiceGalleryLabels> = Object.freeze({
  clear:'Clear local selection',noSelection:'No local selection.',selected:'Local selection',
  accepted:'Local choice selected.',rejected:'The local choice was not accepted.',
  source:'Source',opensNewTab:'Opens in a new tab',
  locationDisclosure:'These are supplied places. Choosing one only informs this page.',
  galleryDisclosure:'These images and captions are supplied and have not been verified.'
});
export const choiceGalleryChinese: Readonly<ChoiceGalleryLabels> = Object.freeze({
  clear:'清除本地选择',noSelection:'尚未进行本地选择。',selected:'本地选择',
  accepted:'已进行本地选择。',rejected:'本地选择未被接受。',
  source:'来源',opensNewTab:'在新标签页中打开',
  locationDisclosure:'这些是提供的地点。选择地点只会通知当前页面。',
  galleryDisclosure:'这些图片和说明均由作者提供，未经核实。'
});
