import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import Layout from '@/components/common/Layout';
import CartSidebar from '@/components/cart/CartSidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Ferremas - Tu Ferretería de Confianza',
  description: 'Herramientas y materiales de construcción de calidad. Encuentra todo lo que necesitas para tus proyectos.',
  keywords: 'ferretería, herramientas, construcción, chile, santiago',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          <CartProvider>
            <Layout>
              {children}
            </Layout>
            <CartSidebar />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
