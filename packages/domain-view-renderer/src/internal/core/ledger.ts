import type {AssetDistributionNode, LedgerAccount, TransactionListNode} from '../schema/document.js';
import type {Issue} from './index.js';
import {validInputDate} from './extensions.js';

export type LedgerNode = AssetDistributionNode | TransactionListNode;
/** Only supplied, literal records. Currency codes are not an exchange-rate registry. */
export function inspectLedger(node: LedgerNode, path: string, add: (issue: Issue) => void, safeURL: (url: string) => boolean): void {
  const records = node.type === 'asset-distribution' ? node.accounts : node.transactions;
  const property = node.type === 'asset-distribution' ? 'accounts' : 'transactions', ids = new Set<string>();
  records.forEach((record, index) => {
    const at = `${path}/${property}/${index}`;
    if (ids.has(record.id)) add({code:'LEDGER_ID',path:`${at}/id`,message:'Supplied record IDs must be unique within the component.'});
    ids.add(record.id);
    if ('date' in record && (!/^[1-9]\d{3}-\d{2}-\d{2}$/.test(record.date) || !validInputDate(record.date))) add({code:'LEDGER_DATE',path:`${at}/date`,message:'Use a real Gregorian date in YYYY-MM-DD format, years 1000–9999.'});
  });
  if (node.source?.url !== undefined && (!/^https?:\/\//i.test(node.source.url) || !safeURL(node.source.url))) add({code:'UNSAFE_URL',path:`${path}/source/url`,message:'Source links require allowed absolute HTTP(S) destinations.'});
}

/** Add shortest supplied decimal representations without inventing currency precision.
 * This is presentation arithmetic over at most 40 bounded numbers, not accounting reconciliation.
 */
export function ledgerSubtotal(values: readonly number[]): string | null {
  if (!values.length) return null;
  const parts = values.map(value => {
    const [coefficient, power = '0'] = String(value).split('e'), [whole, fraction = ''] = coefficient.split('.');
    return {digits:BigInt(whole + fraction), exponent:Number(power) - fraction.length};
  });
  const exponent = Math.min(0, ...parts.map(part => part.exponent));
  const sum = parts.reduce((total, part) => total + part.digits * 10n ** BigInt(part.exponent - exponent), 0n);
  if (sum === 0n) return '0';
  let digits = String(sum), places = -exponent;
  while (places > 0 && digits.endsWith('0')) { digits = digits.slice(0,-1); places--; }
  const power = digits.length - places - 1;
  if (power < -6) return `${digits[0]}${digits.length > 1 ? '.' + digits.slice(1) : ''}e${power}`;
  if (places === 0) return digits;
  digits = digits.padStart(places + 1, '0');
  return `${digits.slice(0,-places)}.${digits.slice(-places)}`;
}
export interface LedgerCurrencyGroup {
  currency: string;
  accounts: LedgerAccount[];
  subtotal: string | null;
  unknown: number;
}
/** Encounter order is stable, and input arrays/records are never mutated. */
export function ledgerGroups(accounts: readonly LedgerAccount[]): LedgerCurrencyGroup[] {
  const groups = new Map<string, LedgerCurrencyGroup>();
  for (const account of accounts) {
    let group = groups.get(account.currency);
    if (!group) { group = {currency:account.currency,accounts:[],subtotal:null,unknown:0}; groups.set(account.currency,group); }
    group.accounts.push(account);
    if (account.amount === null) group.unknown++;
  }
  for (const group of groups.values()) group.subtotal = ledgerSubtotal(group.accounts.flatMap(account => account.amount === null ? [] : [account.amount]));
  return [...groups.values()];
}
