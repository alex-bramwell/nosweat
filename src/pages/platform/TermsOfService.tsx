import styles from './TermsOfService.module.scss';

const TermsOfService = () => {
  return (
    <div className={styles.termsPage}>
      <header className={styles.termsHeader}>
        <h1 className={styles.termsTitle}>Terms of Service</h1>
        <p className={styles.termsEffective}>Effective date: March 14, 2026</p>
      </header>

      <div className={styles.termsContent}>
        <section className={styles.termsSection}>
          <h2 className={styles.termsSectionTitle}>1. Acceptance of Terms</h2>
          <p>
            By accessing or using the No Sweat Fitness platform ("Service"), including any websites,
            applications, APIs, or services operated by Alex Bramwell ("we," "us," or "our"), you
            agree to be bound by these Terms of Service. If you do not agree, do not use the Service.
          </p>
        </section>

        <section className={styles.termsSection}>
          <h2 className={styles.termsSectionTitle}>2. Description of Service</h2>
          <p>
            No Sweat Fitness provides a software-as-a-service platform that enables gym owners to
            create and manage white-label websites for their fitness businesses. The Service includes
            website building tools, scheduling, payment processing, member management, and related features.
          </p>
        </section>

        <section className={styles.termsSection}>
          <h2 className={styles.termsSectionTitle}>3. Account Registration</h2>
          <p>
            To use certain features, you must create an account. You agree to provide accurate information,
            maintain the security of your credentials, and accept responsibility for all activity under
            your account. You must be at least 18 years old to create an account.
          </p>
        </section>

        <section className={styles.termsSection}>
          <h2 className={styles.termsSectionTitle}>4. Intellectual Property</h2>
          <p>
            All content, code, design, graphics, logos, layouts, user interface elements, and underlying
            technology of the No Sweat Fitness platform are the exclusive intellectual property of
            No Sweat Fitness and are protected by copyright, trademark, and other intellectual property laws.
          </p>
          <p>
            You may not copy, reproduce, reverse engineer, decompile, disassemble, modify, distribute,
            sell, license, or create derivative works based on the Service, its design, or its source
            code, in whole or in part, without our prior written consent.
          </p>
          <p>
            This prohibition expressly includes using any automated system, artificial intelligence,
            machine learning tool, web scraper, or similar technology to extract, replicate, or
            reproduce the design, functionality, layout, or code of the Service.
          </p>
        </section>

        <section className={styles.termsSection}>
          <h2 className={styles.termsSectionTitle}>5. AI and Automated Access</h2>
          <p>
            You may not use artificial intelligence systems, large language models, automated scraping
            tools, bots, or any other automated means to access, crawl, scrape, index, or collect
            content from the Service for the purpose of training AI models, building competing products,
            or any other unauthorized use.
          </p>
          <p>
            Automated access to the Service is prohibited unless explicitly authorized in writing by
            No Sweat Fitness. Violation of this section may result in immediate termination of access
            and legal action.
          </p>
        </section>

        <section className={styles.termsSection}>
          <h2 className={styles.termsSectionTitle}>6. Prohibited Uses</h2>
          <p>You agree not to:</p>
          <ul className={styles.termsList}>
            <li>Copy, replicate, or clone the Service or any part of its design or functionality</li>
            <li>Use the Service to build a competing product or service</li>
            <li>Scrape, crawl, or extract data from the Service by automated means</li>
            <li>Attempt to gain unauthorized access to the Service or its systems</li>
            <li>Interfere with or disrupt the Service or its infrastructure</li>
            <li>Use the Service for any unlawful purpose</li>
            <li>Resell or redistribute the Service without authorization</li>
            <li>Remove or alter any proprietary notices or labels on the Service</li>
          </ul>
        </section>

        <section className={styles.termsSection}>
          <h2 className={styles.termsSectionTitle}>7. User Content</h2>
          <p>
            You retain ownership of content you upload to the Service (images, text, branding assets).
            By uploading content, you grant us a limited license to host, display, and process that
            content as necessary to provide the Service.
          </p>
        </section>

        <section className={styles.termsSection}>
          <h2 className={styles.termsSectionTitle}>8. Payment Terms</h2>
          <p>
            Paid features are billed through Stripe. By subscribing, you authorize recurring charges
            to your payment method. You may cancel at any time, but no refunds are issued for partial
            billing periods. We reserve the right to change pricing with 30 days notice.
          </p>
        </section>

        <section className={styles.termsSection}>
          <h2 className={styles.termsSectionTitle}>9. Termination</h2>
          <p>
            We may suspend or terminate your account at any time for violation of these Terms,
            with or without notice. Upon termination, your right to use the Service ceases immediately.
            You may terminate your account at any time by contacting us.
          </p>
        </section>

        <section className={styles.termsSection}>
          <h2 className={styles.termsSectionTitle}>10. Disclaimer of Warranties</h2>
          <p>
            The Service is provided "as is" and "as available" without warranties of any kind, whether
            express or implied, including but not limited to implied warranties of merchantability,
            fitness for a particular purpose, and non-infringement.
          </p>
        </section>

        <section className={styles.termsSection}>
          <h2 className={styles.termsSectionTitle}>11. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, No Sweat Fitness shall not be liable for any
            indirect, incidental, special, consequential, or punitive damages, or any loss of profits
            or revenues, whether incurred directly or indirectly, arising from your use of the Service.
          </p>
        </section>

        <section className={styles.termsSection}>
          <h2 className={styles.termsSectionTitle}>12. Governing Law</h2>
          <p>
            These Terms are governed by and construed in accordance with the laws of the jurisdiction
            in which No Sweat Fitness operates, without regard to conflict of law principles.
          </p>
        </section>

        <section className={styles.termsSection}>
          <h2 className={styles.termsSectionTitle}>13. Changes to Terms</h2>
          <p>
            We reserve the right to update these Terms at any time. Changes will be posted on this page
            with an updated effective date. Continued use of the Service after changes constitutes
            acceptance of the revised Terms.
          </p>
        </section>

        <section className={styles.termsSection}>
          <h2 className={styles.termsSectionTitle}>14. Contact</h2>
          <p>
            If you have questions about these Terms, please contact us at{' '}
            <a href="mailto:legal@nosweatfitness.com" className={styles.termsLink}>
              legal@nosweatfitness.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;
