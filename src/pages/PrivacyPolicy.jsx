import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import PageLayout from '../components/layout/PageLayout';
import LegalCard from '../components/layout/LegalCard';

const PrivacyPolicy = () => {
  return (
    <PageLayout>
      <SEO
        title="Privacy Policy - CineVault"
        description="CineVault's privacy policy explains how we collect, use, and protect your personal information when you visit our website."
        url="/privacy-policy"
        type="website"
      />

      <LegalCard title="Privacy Policy">
        <p className="text-gray-100 text-sm mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="space-y-8 text-light-200 leading-relaxed">
          <section>
            <h2 className="!text-xl mb-3">1. Introduction</h2>
            <p>Welcome to CineVault ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.</p>
          </section>

          <section>
            <h2 className="!text-xl mb-3">2. Information We Collect</h2>
            <p className="mb-3">We may collect information about you in a variety of ways, including:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong className="text-white">Usage Data:</strong> We automatically collect certain information when you visit our website, including your IP address, browser type, operating system, referring URLs, and pages viewed.</li>
              <li><strong className="text-white">Cookies:</strong> We use cookies and similar tracking technologies to track activity on our website and hold certain information. You can set your browser to refuse all or some browser cookies.</li>
              <li><strong className="text-white">Search Data:</strong> We collect and store search queries made on our platform to improve our movie recommendation engine and provide trending movie data.</li>
            </ul>
          </section>

          <section>
            <h2 className="!text-xl mb-3">3. How We Use Your Information</h2>
            <p className="mb-3">We use the information we collect for the following purposes:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>To provide, operate, and maintain our website.</li>
              <li>To improve, personalize, and expand our website.</li>
              <li>To understand and analyze how you use our website.</li>
              <li>To display relevant advertisements through third-party ad networks.</li>
              <li>To communicate with you for customer service and support.</li>
            </ul>
          </section>

          <section>
            <h2 className="!text-xl mb-3">4. Third-Party Advertising</h2>
            <p>We may use third-party advertising companies to serve ads when you visit our website. These companies may use information about your visits to this and other websites in order to provide advertisements about goods and services of interest to you. These third-party ad servers use cookies, JavaScript, and other technologies to measure the effectiveness of their ads.</p>
          </section>

          <section>
            <h2 className="!text-xl mb-3">5. Third-Party Services</h2>
            <p className="mb-3">Our website uses the following third-party services:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong className="text-white">TMDB (The Movie Database):</strong> We use TMDB's API to provide movie metadata, posters, and information. TMDB's privacy policy applies to their data processing.</li>
              <li><strong className="text-white">Appwrite:</strong> We use Appwrite as our backend service for storing search analytics data.</li>
              <li><strong className="text-white">YouTube:</strong> Movie trailers are embedded from YouTube. Google's privacy policy applies when viewing embedded content.</li>
            </ul>
          </section>

          <section>
            <h2 className="!text-xl mb-3">6. Data Retention</h2>
            <p>We will retain your usage data only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your data to the extent necessary to comply with our legal obligations.</p>
          </section>

          <section>
            <h2 className="!text-xl mb-3">7. Your Rights</h2>
            <p className="mb-3">Depending on your location, you may have the following rights regarding your personal data:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>The right to access the personal data we hold about you.</li>
              <li>The right to request correction of inaccurate data.</li>
              <li>The right to request deletion of your data.</li>
              <li>The right to opt-out of data collection via cookies.</li>
            </ul>
          </section>

          <section>
            <h2 className="!text-xl mb-3">8. Children's Privacy</h2>
            <p>Our website does not address anyone under the age of 13. We do not knowingly collect personally identifiable information from children under 13.</p>
          </section>

          <section>
            <h2 className="!text-xl mb-3">9. Changes to This Policy</h2>
            <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.</p>
          </section>

          <section>
            <h2 className="!text-xl mb-3">10. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us through our <Link to="/contact" className="text-[#AB8BFF] hover:underline">Contact Page</Link>.</p>
          </section>
        </div>
      </LegalCard>
    </PageLayout>
  );
};

export default PrivacyPolicy;
