import type { IconDefinition, IconOptions } from './types.js';
export const jsxAttributeNames: Readonly<Record<string, string>>;
export function validateSize(size: number | string): string;
export function validateOptions(options: IconOptions): void;
export function validateIconDefinition(definition: IconDefinition): Set<string>;
export function validateAttributes(tag: string, attrs: Record<string, string>, ids: Set<string>, references: Set<string>): void;
