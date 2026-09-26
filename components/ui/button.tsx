import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// Links styled as buttons should use `buttonVariants()` on the <Link> itself
// rather than wrapping a <Button> in a <Link> (a button inside an anchor is
// invalid HTML and breaks keyboard focus).
const buttonStyles = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border bg-clip-padding font-sans text-sm font-medium whitespace-nowrap transition-[background-color,transform,box-shadow] duration-100 outline-none select-none focus-visible:ring-2 focus-visible:ring-highlighter focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Ink buttons sit on a hard shadow and sink into it when pressed.
        default:
          "border-foreground bg-primary text-primary-foreground shadow-[2px_2px_0_hsl(var(--foreground))] hover:bg-primary-hover active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        outline:
          "border-foreground bg-card text-foreground shadow-[2px_2px_0_hsl(var(--border))] hover:bg-secondary active:translate-x-[2px] active:translate-y-[2px] active:shadow-none aria-expanded:bg-secondary",
        secondary:
          "border-border bg-secondary text-secondary-foreground hover:border-input hover:bg-[hsl(43_38%_82%)] aria-expanded:bg-[hsl(43_38%_82%)]",
        ghost:
          "border-transparent text-foreground hover:bg-secondary aria-expanded:bg-secondary",
        destructive:
          "border-foreground bg-destructive text-destructive-foreground shadow-[2px_2px_0_hsl(var(--foreground))] hover:bg-[hsl(9_64%_37%)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        link: "link-pencil h-auto border-transparent px-0 text-primary",
      },
      size: {
        default: "h-10 gap-2 px-4",
        xs: "h-7 gap-1 px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-9 gap-1.5 px-3",
        lg: "h-11 gap-2 px-6 text-[15px]",
        icon: "size-10",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-9",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/** Class names for button-styled elements, merged so callers can override (e.g. `hidden`). */
function buttonVariants({ className, ...opts }: VariantProps<typeof buttonStyles> & { className?: string } = {}) {
  return cn(buttonStyles(opts), className)
}

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonStyles>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonStyles({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
