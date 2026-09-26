import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/** Global nav + page content + footer for every page except the board workspace. */
export default function SiteShell({ children, footer = true }: { children: React.ReactNode; footer?: boolean }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] focus:rounded focus:bg-card focus:px-3 focus:py-2 focus:text-sm"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="flex-1">
        {children}
      </main>
      {footer && <Footer />}
    </div>
  );
}
