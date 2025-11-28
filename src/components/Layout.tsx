import React, { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import styles from './Layout.module.scss';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => (
  <div className={styles.layout}>
    <Navbar />
    <main className={styles.main}>
      <div className="container">
        {children}
      </div>
    </main>
    <Footer />
  </div>
);

export default Layout;
