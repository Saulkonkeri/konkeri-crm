import "../globals.css"; // Esto hace que funcione Tailwind en tu página pública

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased bg-[#F9F7F5]">
        {children}
      </body>
    </html>
  );
}
