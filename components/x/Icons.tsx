// Inline X-style icons (stroke, currentColor). Same shapes SOCIALTRACE gets from lucide.
type P = { size?: number; className?: string };
const S = ({ size = 18, className, children }: P & { children: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    {children}
  </svg>
);

export const IconReply = (p: P) => <S {...p}><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></S>;
export const IconRepost = (p: P) => (
  <S {...p}><path d="m2 9 3-3 3 3" /><path d="M13 18H7a2 2 0 0 1-2-2V6" /><path d="m22 15-3 3-3-3" /><path d="M11 6h6a2 2 0 0 1 2 2v10" /></S>
);
export const IconHeart = (p: P) => (
  <S {...p}><path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z" /></S>
);
export const IconViews = (p: P) => <S {...p}><path d="M18 20V10M12 20V4M6 20v-6" /></S>;
export const IconBookmark = (p: P) => <S {...p}><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z" /></S>;
export const IconShare = (p: P) => <S {...p}><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><path d="m16 6-4-4-4 4" /><path d="M12 2v13" /></S>;
export const IconPin = (p: P) => <S {...p}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></S>;
export const IconCalendar = (p: P) => <S {...p}><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></S>;
export const IconBack = (p: P) => <S {...p}><path d="m12 19-7-7 7-7M19 12H5" /></S>;
export const IconHome = (p: P) => <S {...p}><path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /><path d="M9 22V12h6v10" /></S>;
export const IconSearch = (p: P) => <S {...p}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></S>;
export const IconBell = (p: P) => <S {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></S>;
export const IconMail = (p: P) => <S {...p}><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-10 5L2 7" /></S>;
export const IconUser = (p: P) => <S {...p}><circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 0 0-16 0" /></S>;
