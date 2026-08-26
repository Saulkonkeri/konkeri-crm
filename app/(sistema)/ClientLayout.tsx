'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '../../components/Sidebar';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const esLogin = pathname === '/login';

  // Si estamos en el Login, mostramos la pantalla completa sin menú lateral
  if (esLogin) {
    return <main className="min-h-screen bg-[#F4F4F4]">{children}</main>;
  }

  // Si estamos en cualquier otra parte del sistema, mostramos el menú lateral
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 pl-64 min-h-screen bg-[#F4F4F4]">
        {children}
      </main>
    </div>
  );
}