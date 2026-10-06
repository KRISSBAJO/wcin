// Everything under /admin (the panel and the login page) uses the interface typeface and scale
// defined by the `.admin` rules in globals.css, instead of the website's display fonts.
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin">{children}</div>;
}
