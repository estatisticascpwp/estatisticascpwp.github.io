/** Cores e tipos de letra — os mesmos tokens da versão web (app.css). */
export const C = {
  green: '#006633', deep: '#004d2a', green2: '#0d7d45', yellow: '#fcd116', yellow2: '#e9bf00',
  ink: '#102b24', muted: '#5a706a', line: '#d5dfdb', soft: '#e9efed', bg: '#edf2f0', panel: '#ffffff', panelAlt: '#fbfcfc',
  pool: '#2a7db5', pool2: '#2777ae', red: '#d93232',
  okbg: '#d6f2de', ok: '#0d6b33', warnbg: '#fff3c4', warn: '#6b5100', badbg: '#fde0df', bad: '#b21f1f', neutral: '#e7ecec',
  goodTag: '#c8f0d5', goodTagText: '#075b2d', badTag: '#ffe0df', warnTag: '#fff0a5', neutralText: '#3e5552',
  rowAlt: '#f6f9f8', rowHl: '#e3f0fb', inpool: '#e3f5ea', capBg: '#e4ece9', gkCapBg: '#fbe1df', gkCapText: '#b21f1f',
  white: '#ffffff', overlay: 'rgba(8,30,22,0.45)',
};
export const F = {
  body: 'Barlow_400Regular', bodyMed: 'Barlow_500Medium', bodySemi: 'Barlow_600SemiBold', bodyBold: 'Barlow_700Bold',
  dispSemi: 'BarlowCondensed_600SemiBold', disp: 'BarlowCondensed_700Bold', dispX: 'BarlowCondensed_800ExtraBold',
};
export const TONE = {
  good: { bg: C.goodTag, fg: C.goodTagText },
  bad: { bg: C.badTag, fg: C.bad },
  warn: { bg: C.warnTag, fg: C.warn },
  neutral: { bg: C.neutral, fg: C.neutralText },
  info: { bg: '#dfeaf5', fg: '#1d4f7a' },
};
