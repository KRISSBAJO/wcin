// One icon set for the whole site (Lucide), behind a small name-based API so pages stay readable.
import {
  ArrowRight, BookOpen, ChevronRight, Cross, Heart, Mail, MapPin, Menu, MessageSquare, Phone, Play, Users, X, Clock, Calendar, Sparkles,
  type LucideProps,
} from 'lucide-react';

export type IconName =
  | 'heart' | 'chat' | 'people' | 'book' | 'pin' | 'phone' | 'mail' | 'play' | 'arrow' | 'chevron'
  | 'menu' | 'close' | 'facebook' | 'instagram' | 'youtube' | 'cross' | 'clock' | 'calendar' | 'sparkles';

// Lucide no longer ships brand marks, so the three social logos stay as filled paths.
const brands: Record<'facebook' | 'instagram' | 'youtube', string> = {
  facebook: 'M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07c0 6.02 4.39 11.01 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.08 24 18.09 24 12.07z',
  instagram: 'M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.35-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 12 18.16 6.16 6.16 0 0 0 12 5.84zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z',
  youtube: 'M23.5 6.19a3 3 0 0 0-2.12-2.13C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.51A3 3 0 0 0 .5 6.19 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.81 3 3 0 0 0 2.12 2.13c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3 3 0 0 0 2.12-2.13A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.81zM9.6 15.57V8.43L15.82 12 9.6 15.57z',
};

const map: Record<Exclude<IconName, keyof typeof brands>, React.ComponentType<LucideProps>> = {
  heart: Heart, chat: MessageSquare, people: Users, book: BookOpen, pin: MapPin, phone: Phone, mail: Mail, play: Play,
  arrow: ArrowRight, chevron: ChevronRight, menu: Menu, close: X,
  cross: Cross, clock: Clock, calendar: Calendar, sparkles: Sparkles,
};

interface Props {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export default function Icon({ name, size = 24, className, strokeWidth = 2 }: Props) {
  if (name in brands) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d={brands[name as keyof typeof brands]} />
      </svg>
    );
  }
  const Cmp = map[name as keyof typeof map];
  const filled = name === 'play';
  return <Cmp size={size} className={className} strokeWidth={strokeWidth} aria-hidden="true" fill={filled ? 'currentColor' : 'none'} />;
}
