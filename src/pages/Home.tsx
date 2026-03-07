import Hero from '../components/sections/Hero';
import Programs from '../components/sections/Programs';
import WOD from '../components/sections/WOD';
import CTA from '../components/sections/CTA';
import { FeatureGate } from '../components/common';
import { useBrandingWithOverrides } from '../hooks/useBrandingWithOverrides';
import { useIsBuilder } from '../contexts/BrandingOverrideContext';
import LockedSectionPlaceholder from '../components/GymAdmin/LockedSectionPlaceholder';

const Home = () => {
  const branding = useBrandingWithOverrides();
  const isBuilder = useIsBuilder();
  const vis = branding.visible_sections ?? {};
  const isVisible = (section: string) => vis[section] !== false;

  return (
    <>
      {isVisible('hero') && <Hero />}
      {isVisible('programs') && <Programs />}
      <FeatureGate
        feature="wod_programming"
        fallback={isBuilder ? <LockedSectionPlaceholder feature="wod_programming" /> : null}
      >
        {isVisible('wod') && <WOD />}
      </FeatureGate>
      <FeatureGate
        feature="class_booking"
        fallback={isBuilder ? <LockedSectionPlaceholder feature="class_booking" /> : null}
      >
        {isVisible('cta') && <CTA />}
      </FeatureGate>
    </>
  );
};

export default Home;
