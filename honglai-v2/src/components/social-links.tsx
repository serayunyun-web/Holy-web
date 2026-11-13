import type { ReactNode } from "react";

const CONTACT_EMAIL = "hongguan8888@gmail.com";
const EMAIL_SUBJECT = "【網站詢問】";

type SocialLink = { id: string; label: string; title: string; href: string | null; external: boolean; icon: ReactNode };

// Set LINE's href once the official account link is ready; until then it shows as a non-clickable icon.
const socialLinks: SocialLink[] = [
  {
    id: "facebook",
    label: "鴻萊興業 Facebook 粉絲專頁（另開新視窗）",
    title: "Facebook 粉絲專頁",
    href: "https://www.facebook.com/profile.php?id=61550895434655",
    external: true,
    icon: <path d="M13.6 21v-7.6h2.6l.4-3h-3V8.5c0-.9.3-1.5 1.5-1.5h1.6V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8v3h2.5V21h3.1Z" fill="currentColor" />,
  },
  {
    id: "line",
    label: "鴻萊興業 LINE 官方帳號（另開新視窗）",
    title: "LINE 官方帳號",
    href: null,
    external: true,
    icon: (
      <>
        <path d="M12 3.6c-5 0-9 3.2-9 7.2 0 3.6 3.2 6.6 7.5 7.1.3.1.7.2.8.5.1.3.1.6 0 .9l-.1.8c0 .2-.2.9.8.5 1-.4 5.5-3.3 7.5-5.6 1.4-1.5 2.5-2.9 2.5-4.2 0-4-4-7.2-9-7.2Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
        <text fill="currentColor" fontFamily="Arial, sans-serif" fontSize="5.2" fontWeight="700" textAnchor="middle" x="12" y="12.7">LINE</text>
      </>
    ),
  },
  {
    id: "email",
    label: `寄信給鴻萊興業：${CONTACT_EMAIL}`,
    title: CONTACT_EMAIL,
    href: `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(EMAIL_SUBJECT)}`,
    external: false,
    icon: (
      <>
        <rect fill="none" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" width="17" x="3.5" y="5.5" />
        <path d="m4.5 7 7.5 6 7.5-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
      </>
    ),
  },
];

type SocialLinksProps = { className?: string; direction?: "row" | "column" };

export function SocialLinks({ className = "", direction = "row" }: SocialLinksProps) {
  return (
    <ul aria-label="社群與聯絡方式" className={`social-links social-links-${direction} ${className}`.trim()}>
      {socialLinks.map((link) => (
        <li key={link.id}>
          {link.href === null ? (
            <span aria-label={`${link.title}（即將開放）`} className="social-link is-pending" role="img" title={`${link.title}（即將開放）`}>
              <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">{link.icon}</svg>
            </span>
          ) : <a
            aria-label={link.label}
            className="social-link"
            href={link.href ?? undefined}
            rel={link.external ? "noopener noreferrer" : undefined}
            target={link.external ? "_blank" : undefined}
            title={link.title}
          >
            <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">{link.icon}</svg>
          </a>}
        </li>
      ))}
    </ul>
  );
}
