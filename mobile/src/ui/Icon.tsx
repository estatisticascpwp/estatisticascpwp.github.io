import type { ReactNode } from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { C } from '../theme';

export type IconName =
  | 'home' | 'player' | 'team' | 'clock' | 'card' | 'chart' | 'target' | 'roster' | 'goal' | 'gear'
  | 'download' | 'upload' | 'trash' | 'edit' | 'save' | 'reset' | 'plus' | 'play' | 'pause' | 'open' | 'chev' | 'menu' | 'close' | 'swap' | 'share' | 'search' | 'check';

const P: Record<IconName, ReactNode> = {
  home: <Path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  player: <G><Circle cx="12" cy="7" r="4" /><Path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" /></G>,
  team: <G><Circle cx="8" cy="8" r="3.2" /><Circle cx="16.5" cy="9" r="2.7" /><Path d="M2.5 20c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5M14 14.6c3.6-.6 7 1.4 7 5.4" /></G>,
  clock: <G><Circle cx="12" cy="13" r="8" /><Path d="M12 9v4l3 2M9 2h6" /></G>,
  card: <G><Rect x="6" y="3" width="12" height="18" rx="2" /><Path d="M9 8h6M9 12h6" /></G>,
  chart: <Path d="M4 20V11M10 20V5M16 20v-7M21 20H3" />,
  target: <G><Circle cx="12" cy="12" r="8.5" /><Circle cx="12" cy="12" r="4.5" /><Circle cx="12" cy="12" r="1" /></G>,
  roster: <G><Rect x="4" y="3" width="16" height="18" rx="2" /><Circle cx="12" cy="10" r="2.8" /><Path d="M7.5 17.5c.6-2.3 2.4-3.4 4.5-3.4s3.9 1.1 4.5 3.4" /></G>,
  goal: <G><Path d="M3 19V6h18v13" /><Path d="M3 6l3 4h12l3-4M6 10v9M18 10v9M10 10v9M14 10v9" /></G>,
  gear: <G><Circle cx="12" cy="12" r="3" /><Path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" /></G>,
  download: <Path d="M12 3v12M7 10l5 5 5-5M5 21h14" />,
  upload: <Path d="M12 16V4M7 9l5-5 5 5M5 21h14" />,
  trash: <Path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />,
  edit: <Path d="M4 20h4L19 9l-4-4L4 16z" />,
  save: <Path d="M5 3h11l3 3v15H5zM8 3v5h7M8 21v-7h8v7" />,
  reset: <Path d="M4 12a8 8 0 1 0 2.6-5.9M4 4v5h5" />,
  plus: <Path d="M12 5v14M5 12h14" />,
  play: <Path d="M7 4l13 8-13 8z" />,
  pause: <Path d="M8 4v16M16 4v16" />,
  open: <Path d="M5 12h14M13 6l6 6-6 6" />,
  chev: <Path d="M6 9l6 6 6-6" />,
  menu: <Path d="M4 6h16M4 12h16M4 18h16" />,
  close: <Path d="M6 6l12 12M18 6L6 18" />,
  swap: <Path d="M7 4L3 8l4 4M3 8h14M17 12l4 4-4 4M21 16H7" />,
  share: <G><Path d="M12 3v12M8 7l4-4 4 4" /><Path d="M5 12v8h14v-8" /></G>,
  search: <G><Circle cx="11" cy="11" r="6.5" /><Path d="M20 20l-4.2-4.2" /></G>,
  check: <Path d="M5 12.5l4.5 4.5L19 7.5" />,
};

export function Icon({ name, size = 20, color = C.ink, strokeWidth = 2 }: { name: IconName; size?: number; color?: string; strokeWidth?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">{P[name]}</G>
    </Svg>
  );
}
