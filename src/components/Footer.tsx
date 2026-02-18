import React from 'react';
import { Link } from 'react-router-dom';
import { useTenant, useGymPath } from '../contexts/TenantContext';
import styles from './Footer.module.scss';

const Footer: React.FC = () => {
  const { gym, branding } = useTenant();
  const gymPath = useGymPath();

  return (
  <footer className={styles.footer}>
    <div className={styles.links}>
      <Link to={gymPath('/')}>Home</Link>
      <a href={gymPath('/about')}>About</a>
      <a href={gymPath('/coaches')}>Coaches</a>
      <a href={`${gymPath('/')}#wod`}>WOD</a>
      <Link to={gymPath('/schedule')}>Schedule</Link>
    </div>
    <div className={styles.affiliate}>
      <div className={styles.copyright}>
        &copy; {new Date().getFullYear()} {gym?.name}. All rights reserved.
      </div>
      {branding.footer_text && (
        <div className={styles.disclaimer}>
          {branding.footer_text}
        </div>
      )}
    </div>
  </footer>
  );
};

export default Footer;
