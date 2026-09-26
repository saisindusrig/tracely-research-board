import { initials } from "@/lib/format";

const SIZES = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-20 text-2xl",
};

export default function Avatar({
  name,
  image,
  size = "sm",
  className = "",
}: {
  name?: string | null;
  image?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote avatars from GitHub; tiny, no optimization needed
      <img
        src={image}
        alt=""
        className={`${SIZES[size]} shrink-0 rounded-full border border-border object-cover ${className}`}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`${SIZES[size]} inline-flex shrink-0 items-center justify-center rounded-full border border-border bg-secondary font-medium text-secondary-foreground ${className}`}
    >
      {initials(name)}
    </span>
  );
}
