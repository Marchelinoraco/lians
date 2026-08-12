import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db } from '@/db';
import { users } from '@/db/schema';

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Panel admin hidup di subdomain dan dilayani lewat penulisan-ulang proxy,
  // sehingga host permintaan bukan host bawaan yang dikenali Auth.js.
  // Aman di sini karena hostname sudah disaring lebih dulu oleh resolveHost.
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const email = String(credentials?.email ?? '')
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? '');
        if (!email || !password) return null;

        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (!user) return null;

        const cocok = await bcrypt.compare(password, user.passwordHash);
        if (!cocok) return null;

        // Disimpan ke variabel dulu, bukan dikembalikan sebagai literal:
        // `role` bukan bagian dari tipe User bawaan Auth.js, dan pemeriksaan
        // properti berlebih hanya berlaku untuk objek literal yang langsung
        // dikembalikan. Nilainya dibaca lagi di callback jwt di bawah.
        const identitas = { id: user.id, email: user.email, name: user.name, role: user.role };
        return identitas;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = (user as { role?: string }).role ?? 'admin';
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      // Peran dititipkan lewat token, tidak dibaca ulang dari database:
      // callback ini berjalan pada setiap permintaan ke panel admin.
      (session.user as { role?: string }).role =
        typeof token.role === 'string' ? token.role : 'admin';
      return session;
    },
  },
});
