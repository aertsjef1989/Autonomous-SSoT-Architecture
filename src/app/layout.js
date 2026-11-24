export const metadata = {
  title: "Balaerion — Live Limited-Route Prototype",
  description: "OmniRoute GDPR Gateway, ProspectHub OSINT, Voice Engine & Telegram Remote Bridge"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#08090D", color: "#F2F5F9", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,monospace" }}>
        {children}
      </body>
    </html>
  );
}
