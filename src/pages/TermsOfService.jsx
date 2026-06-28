import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import PageLayout from '../components/layout/PageLayout';
import LegalCard from '../components/layout/LegalCard';

const TermsOfService = () => {
  return (
    <PageLayout>
      <SEO
        title="Terms of Service - CineVault"
        description="CineVault's terms of service. CineVault is a movie discovery platform that provides metadata and links to third-party content. We do not host any copyrighted material."
        url="/terms-of-service"
        type="website"
      />

      <LegalCard title="Terms of Service">
        <p className="text-gray-100 text-sm mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="space-y-8 text-light-200 leading-relaxed">
          <section>
            <h2 className="!text-xl mb-3">1. Acceptance of Terms</h2>
            <p>By accessing and using CineVault ("the Service"), you accept and agree to be bound by the terms and conditions of this agreement. If you do not agree to these terms, you should not use this website.</p>
          </section>

          <section>
            <h2 className="!text-xl mb-3">2. Description of Service</h2>
            <p>CineVault is a movie discovery and information platform. We provide movie metadata, ratings, trailers, and recommendations using data sourced from The Movie Database (TMDB) API. We do not host, store, or distribute any copyrighted movie or TV show content.</p>
          </section>

          <section>
            <h2 className="!text-xl mb-3">3. Use of Content</h2>
            <p className="mb-3">All movie posters, descriptions, and metadata displayed on CineVault are provided by TMDB under their API terms of use. You agree to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Use the website for lawful purposes only.</li>
              <li>Not reproduce, duplicate, copy, sell, or exploit any portion of the Service without express written permission.</li>
              <li>Not use the website to distribute harmful, offensive, or illegal content.</li>
            </ul>
          </section>

          <section>
            <h2 className="!text-xl mb-3">4. Intellectual Property</h2>
            <p>The CineVault name, logo, and website design are the property of CineVault. Movie posters, titles, and descriptions are the property of their respective copyright holders and are displayed here under fair use for informational purposes via the TMDB API.</p>
          </section>

          <section>
            <h2 className="!text-xl mb-3">5. Disclaimer of Warranties</h2>
            <p>The Service is provided on an "AS IS" and "AS AVAILABLE" basis. We make no warranties, expressed or implied, regarding the accuracy, completeness, or reliability of any content displayed on the website. Movie information may contain inaccuracies or errors.</p>
          </section>

          <section>
            <h2 className="!text-xl mb-3">6. Limitation of Liability</h2>
            <p>In no event shall CineVault, its directors, employees, partners, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service.</p>
          </section>

          <section>
            <h2 className="!text-xl mb-3">7. Third-Party Links and Services</h2>
            <p>Our website may contain links to third-party websites, including YouTube for trailer playback and external movie databases. We are not responsible for the content, privacy policies, or practices of any third-party websites.</p>
          </section>

          <section>
            <h2 className="!text-xl mb-3">8. Advertisements</h2>
            <p>CineVault may display advertisements from third-party ad networks. These advertisements may use cookies and similar technologies. We are not responsible for the content of third-party advertisements. Your interaction with advertisers is solely between you and the advertiser.</p>
          </section>

          <section>
            <h2 className="!text-xl mb-3">9. Modifications to Terms</h2>
            <p>We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting to the website. Your continued use of the Service after any changes constitutes acceptance of those changes.</p>
          </section>

          <section>
            <h2 className="!text-xl mb-3">10. Governing Law</h2>
            <p>These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which CineVault operates, without regard to its conflict of law provisions.</p>
          </section>

          <section>
            <h2 className="!text-xl mb-3">11. Contact Us</h2>
            <p>If you have any questions about these Terms of Service, please contact us through our <Link to="/contact" className="text-[#AB8BFF] hover:underline">Contact Page</Link>.</p>
          </section>
        </div>
      </LegalCard>
    </PageLayout>
  );
};

export default TermsOfService;
