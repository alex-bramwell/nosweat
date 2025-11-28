import React from 'react';
import styles from './Footer.module.scss';

const Footer: React.FC = () => (
  <footer className={styles.footer}>
    <div className={styles.links}>
      <a href="/">Home</a>
      <a href="/about">About</a>
      <a href="/coaches">Coaches</a>
      <a href="/wod">WOD</a>
      <a href="/schedule">Schedule</a>
    </div>
    <div>
      &copy; {new Date().getFullYear()} CrossFit Comet. All rights reserved.
    </div>
  </footer>
);

export default Footer;
