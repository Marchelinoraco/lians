import type { ReactNode } from 'react';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';
import '@/app/globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

export const metadata = {
  title: 'Masuk — Admin LIANS',
  robots: { index: false, follow: false },
};

/**
 * Root layout tersendiri untuk halaman login: ia berada di luar
 * src/app/admin, yang layout-nya memaksa sesi. Halaman login jelas tidak
 * boleh mensyaratkan sesi.
 */
export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id-ID" className={jakarta.variable}>
      <body className="font-sans antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
