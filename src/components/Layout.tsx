import type { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import styles from './Layout.module.scss';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => (
  <div className={styles.layout}>
    <Navbar />
    <main className={styles.main}>
      {children}
    </main>
    <Footer />
  </div>
);

export default Layout;
