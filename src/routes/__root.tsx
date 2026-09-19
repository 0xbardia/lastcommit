import { createRootRoute, HeadContent, Link, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { WalletButton, WalletProvider } from "@/components/wallet";
import appCss from "../styles.css?url";

const APP_NAME = "LastCommit";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "theme-color", content: "#141311" },
      {
        name: "description",
        content: "LastCommit determines when a project is truly abandoned — and proves what should happen next.",
      },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&display=swap",
      },
    ],
  }),
  component: Root,
});

function Root() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-bg text-ink antialiased">
        <PreviewHostBridge />
        <AuthProvider>
          <WalletProvider>
            <a className="skip-link" href="#main-content">Skip to content</a>
            <header className="border-b border-line">
              <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
                <Link
                  to="/"
                  className="font-mono text-xs tracking-[0.18em] uppercase text-paper no-underline"
                >
                  LastCommit
                </Link>
                <div className="flex flex-wrap items-center gap-4">
                  <nav className="flex gap-4 font-sans text-sm text-muted" aria-label="Primary">
                    <Link to="/app" className="hover:text-paper">
                      Explorer
                    </Link>
                    <Link to="/projects/new" className="hover:text-paper">
                      Register
                    </Link>
                    <Link to="/docs" className="hover:text-paper">
                      Docs
                    </Link>
                  </nav>
                  <WalletButton />
                </div>
              </div>
            </header>
            <div id="main-content"><Outlet /></div>
            <footer className="border-t border-line">
              <div className="mx-auto flex max-w-5xl flex-wrap justify-between gap-3 px-4 py-6 font-mono text-xs text-muted">
                <span>Proof of Abandonment protocol.</span>
                <span>Verdicts are GenLayer consensus, not a private model.</span>
              </div>
            </footer>
          </WalletProvider>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
