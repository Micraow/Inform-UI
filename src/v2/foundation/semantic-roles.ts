import colors from '../../../docs/color-tokens.json';

/**
 * Public Apps SDK UI primitives/roles are pinned in docs/color-tokens.json.
 * Text-safe substitutions below are Inform UI choices, not claims about an
 * upstream guarantee. Original source swatches remain available unchanged.
 */
export const semanticRoleNames = ['info', 'success', 'warning', 'error'] as const;
export const iconSizes = [16, 20, 24, 32, 48] as const;
const roles = (v: typeof colors.light, dark: boolean) => Object.freeze({
  info: Object.freeze({foreground: v.info, background: v['info-soft'], softForeground: v['info-soft-text']}),
  success: Object.freeze({foreground: v.success, background: v['success-soft'], softForeground: dark ? v['success-soft-text'] : v.success}),
  warning: Object.freeze({foreground: dark ? v['series-orange'] : v.warning, background: v['warning-soft'], softForeground: dark ? v['series-orange'] : v['warning-soft-text']}),
  error: Object.freeze({foreground: dark ? v['series-red'] : v.danger, background: v['danger-soft'], softForeground: dark ? v['series-red'] : v['danger-soft-text']}),
});
export const semanticThemeTokens = Object.freeze({light: roles(colors.light, false), dark: roles(colors.dark, true)});
const declarations = (theme: keyof typeof semanticThemeTokens) => Object.entries(semanticThemeTokens[theme]).flatMap(([name, value]) => [
  `--if-${name}:${value.foreground}`,
  `--if-${name}-soft:${value.background}`,
  `--if-${name}-soft-text:${value.softForeground}`,
]).join(';');
const boxSelectors = semanticRoleNames.map(name => `
.if-root .if-box[data-background=${name}]{color:var(--if-${name}-soft-text);background:var(--if-${name}-soft)}
`).join('');
const selectors = semanticRoleNames.map(name => `
.if-root [data-tone=${name}]{color:var(--if-${name})}
.if-root :is(.if-badge,.if-alert)[data-tone=${name}]{color:var(--if-${name}-soft-text);background:var(--if-${name}-soft);border-color:color-mix(in srgb,var(--if-${name}-soft-text) 24%,transparent)}
`).join('');
export const semanticCSS = `
.if-root{${declarations('light')}}
.if-root[data-theme=dark]{${declarations('dark')}}
${selectors}
${boxSelectors}
.if-root .if-badge{border:1px solid transparent;max-width:100%;overflow-wrap:anywhere;line-height:1.4}
.if-root .if-alert{border-color:var(--if-border);background:var(--if-surface);line-height:1.5}
.if-root .if-icon[data-tone]{overflow:visible}
`;
