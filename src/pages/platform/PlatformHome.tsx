import { Link } from 'react-router-dom';
import { useState } from 'react';
import { FEATURES } from '../../config/features';
import styles from './PlatformHome.module.scss';

const PlatformHome = () => {
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  const toggleFeature = (key: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const totalCost = selectedFeatures.length * 10;

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={styles.platformHome}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroHeadline}>
            The all-in-one platform for gyms & fitness studios
          </h1>
          <p className={styles.heroSubtitle}>
            Launch your professional gym website in minutes. Class booking, WOD
            programming, coach profiles, payments — all customisable to your brand.
          </p>
          <div className={styles.heroCtas}>
            <Link to="/signup" className={styles.ctaPrimary}>
              Get Started
            </Link>
            <button
              onClick={() => scrollToSection('features')}
              className={styles.ctaSecondary}
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className={styles.features}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Everything you need to run your gym</h2>
          <p className={styles.sectionSubtitle}>
            Only pay for what you use — £10/month per feature
          </p>

          <div className={styles.featuresGrid}>
            {FEATURES.map((feature) => (
              <div key={feature.key} className={styles.featureCard}>
                <div className={styles.featureIcon}>{feature.icon}</div>
                <h3 className={styles.featureName}>{feature.name}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className={styles.howItWorks}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>How It Works</h2>
          <div className={styles.stepsGrid}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <h3 className={styles.stepTitle}>Sign up</h3>
              <p className={styles.stepDescription}>
                Create your account in seconds. No credit card required to start.
              </p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <h3 className={styles.stepTitle}>Customise your brand</h3>
              <p className={styles.stepDescription}>
                Choose your colors, fonts, and upload your logo. Make it yours.
              </p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <h3 className={styles.stepTitle}>Choose your features</h3>
              <p className={styles.stepDescription}>
                Pick only the features you need. Add or remove anytime.
              </p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>4</div>
              <h3 className={styles.stepTitle}>Launch your site</h3>
              <p className={styles.stepDescription}>
                Go live instantly with your custom gym website. No technical skills needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Pricing */}
      <section className={styles.pricing}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Simple, transparent pricing</h2>
          <p className={styles.pricingTagline}>
            £10/month per feature. No contracts. Cancel anytime.
          </p>

          <div className={styles.pricingCalculator}>
            <h3 className={styles.calculatorTitle}>Build your plan</h3>
            <div className={styles.featureChecklist}>
              {FEATURES.map((feature) => (
                <label key={feature.key} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedFeatures.includes(feature.key)}
                    onChange={() => toggleFeature(feature.key)}
                    className={styles.checkbox}
                  />
                  <span className={styles.featureCheckboxName}>
                    {feature.icon} {feature.name}
                  </span>
                  <span className={styles.featurePrice}>£10/mo</span>
                </label>
              ))}
            </div>
            <div className={styles.totalCost}>
              <span className={styles.totalLabel}>Your monthly cost:</span>
              <span className={styles.totalAmount}>£{totalCost}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PlatformHome;
