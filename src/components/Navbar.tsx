import React from 'react';
import styles from './Navbar.module.scss';

const Navbar: React.FC = () => (
  <nav className={styles.navbar}>
    <div className={styles.logo}>CrossFit Comet</div>
    <div className={styles.links}>
      <a href="/">Home</a>
      <a href="/about">About</a>
      <a href="/coaches">Coaches</a>
      <a href="/wod">WOD</a>
      <a href="/schedule">Schedule</a>
    </div>
    <div className={styles.actions}>
      <button>Sign In</button>
      <button>Join</button>
    </div>
  </nav>
);

export default Navbar;
