/** Presentation-only words. The caller supplies status; these are not service claims. */
export interface PrimitiveLabels {
  idle: string; busy: string; success: string; warning: string; error: string;
}
export const primitiveEnglish: Readonly<PrimitiveLabels> = Object.freeze({
  idle: 'Idle', busy: 'Busy', success: 'Success', warning: 'Warning', error: 'Error'
});
export const primitiveChinese: Readonly<PrimitiveLabels> = Object.freeze({
  idle: '空闲', busy: '忙碌', success: '成功', warning: '警告', error: '错误'
});
