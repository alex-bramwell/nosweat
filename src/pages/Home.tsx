import Hero from '../components/sections/Hero';
import Programs from '../components/sections/Programs';
import WOD from '../components/sections/WOD';
import CTA from '../components/sections/CTA';
import { FeatureGate } from '../components/common';

const Home = () => {
  return (
    <>
      <Hero />
      <Programs />
      <FeatureGate feature="wod_programming">
        <WOD />
      </FeatureGate>
      <FeatureGate feature="class_booking">
        <CTA />
      </FeatureGate>
    </>
  );
};

export default Home;
