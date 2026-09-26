// Pencil-drawn icon set. Paths are drawn slightly off-true on purpose so they
// read as sketched, not machined. Names mirror the lucide icons they replace.
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, className = "", ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={`size-4 shrink-0 ${className}`}
      {...props}
    >
      {children}
    </svg>
  );
}

export const Plus = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12.2 4.6c-.1 4.9.1 9.8-.3 14.9" />
    <path d="M4.7 12.3c4.9-.3 9.8-.1 14.7.2" />
  </Icon>
);

export const Minus = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4.8 12.4c4.8-.4 9.7-.2 14.5.1" />
  </Icon>
);

export const X = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6.1 6.3c3.9 3.6 7.6 7.5 11.7 11.5" />
    <path d="M17.6 6c-3.9 3.9-7.6 7.9-11.5 11.9" />
  </Icon>
);

export const Check = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4.6 12.8c1.6 1.4 3 2.9 4.4 4.7 2.9-4.5 6.2-8.5 10.3-12" />
  </Icon>
);

export const Search = (p: IconProps) => (
  <Icon {...p}>
    <path d="M10.6 4.3c3.7-.2 6.5 2.6 6.4 6.1-.1 3.6-3 6.3-6.5 6.2-3.4-.1-6.1-2.9-6-6.3.1-3.2 2.6-5.8 6.1-6" />
    <path d="M15.4 15.6c1.4 1.3 2.8 2.7 4.3 4.3" />
  </Icon>
);

export const Menu = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4.3 6.6c5.2-.3 10.3-.1 15.4.2" />
    <path d="M4.6 12.2c5-.2 10-.1 14.9.1" />
    <path d="M4.2 17.6c5.1-.2 10.2 0 15.3.3" />
  </Icon>
);

export const ArrowLeft = (p: IconProps) => (
  <Icon {...p}>
    <path d="M19.4 12.3c-4.9-.3-9.8-.2-14.6 0" />
    <path d="M10.3 6.4c-1.9 2-3.7 3.8-5.6 5.9 1.9 1.9 3.8 3.8 5.5 5.9" />
  </Icon>
);

export const ArrowUpRight = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6.2 17.9c3.8-3.9 7.6-7.8 11.5-11.6" />
    <path d="M8.7 6.4c3-.1 6-.2 9 0 .2 2.9.1 5.9 0 8.9" />
  </Icon>
);

export const ChevronDown = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6.3 9.4c1.9 1.9 3.8 3.8 5.8 5.6 1.9-2 3.8-3.9 5.8-5.8" />
  </Icon>
);

export const Bell = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6.4 16.6c.6-1.4.8-3 .7-4.9-.1-3.1 2-5.6 4.9-5.7 2.9-.1 5 2.2 5 5.3 0 1.8.2 3.6.9 5.2-4 .4-7.8.3-11.5.1Z" />
    <path d="M10.2 19.2c.9 1.1 2.7 1.2 3.7-.1" />
  </Icon>
);

export const Link2 = (p: IconProps) => (
  <Icon {...p}>
    <path d="M10.4 7.9 9 7.8c-2.4-.1-4.4 1.8-4.5 4.2-.1 2.4 1.9 4.3 4.3 4.3l1.5-.1" />
    <path d="M13.6 16.2l1.5.1c2.4 0 4.3-1.9 4.3-4.3.1-2.4-1.8-4.3-4.2-4.3l-1.6.1" />
    <path d="M8.9 12.1c2-.1 4.1-.1 6.2.1" />
  </Icon>
);

export const Maximize = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4.8 9.2c-.1-1.5 0-3 .2-4.4 1.4-.1 2.9-.2 4.3 0" />
    <path d="M14.8 4.9c1.4-.1 2.9-.1 4.3.1.2 1.4.2 2.9.1 4.3" />
    <path d="M19.3 14.9c.1 1.4 0 2.9-.2 4.3-1.4.2-2.9.2-4.3.1" />
    <path d="M9.1 19.2c-1.4.1-2.9 0-4.3-.2-.1-1.4-.1-2.9 0-4.3" />
  </Icon>
);

export const Ellipsis = (p: IconProps) => (
  <Icon {...p} strokeWidth={2.6}>
    <path d="M5.9 12.2h.2M12 11.9h.2M18 12.1h.2" />
  </Icon>
);

export const MessageSquare = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5.2 6.1c4.5-.4 9.1-.3 13.6.1.3 2.8.2 5.6-.1 8.4-2.8.2-5.6.2-8.4.1-1.6 1.2-3.2 2.4-4.8 3.4.2-1.2.4-2.3.5-3.5-.6 0-1.1-.1-1.6-.2-.2-2.8-.1-5.6.8-8.3Z" />
  </Icon>
);
