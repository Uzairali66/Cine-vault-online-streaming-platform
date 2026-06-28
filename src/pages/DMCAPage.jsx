import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import PageLayout from '../components/layout/PageLayout';
import LegalCard from '../components/layout/LegalCard';

const DMCAPage = () => {
  return (
    <PageLayout>
      <SEO
        title="DMCA - CineVault"
        description="CineVault respects intellectual property rights. Submit DMCA takedown notices to dmca@cinevault.com. CineVault does not host any copyrighted content."
        url="/dmca"
        type="website"
      />

      <LegalCard title="DMCA & Public Domain Notice">
        <p className="text-gray-100 text-sm mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="space-y-8 text-light-200 leading-relaxed">
          <section>
            <h2 className="!text-xl mb-3">1. Copyright Compliance</h2>
            <p>CineVault respects the intellectual property rights of others and expects its users to do the same. In accordance with the Digital Millennium Copyright Act (DMCA), we will respond expeditiously to claims of copyright infringement committed using our platform.</p>
          </section>

          <section>
            <h2 className="!text-xl mb-3">2. No Copyrighted Content Hosting</h2>
            <p className="mb-3">CineVault does not host, store, upload, or distribute any copyrighted movies, TV shows, or video content on its servers. All video content accessible through our platform falls into one of the following categories:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong className="text-white">Public Domain:</strong> Content whose copyright has expired and is freely available for public use.</li>
              <li><strong className="text-white">Creative Commons:</strong> Content licensed under Creative Commons or similar open licensing.</li>
              <li><strong className="text-white">Embedded Third-Party Content:</strong> Trailers and clips embedded from YouTube or similar platforms under their respective terms of service.</li>
            </ul>
          </section>

          <section>
            <h2 className="!text-xl mb-3">3. DMCA Takedown Procedure</h2>
            <p className="mb-3">If you believe that any content available through our platform infringes upon your copyright, please submit a written notification containing the following information to our designated Copyright Agent:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>A physical or electronic signature of the copyright owner or authorized representative.</li>
              <li>Identification of the copyrighted work claimed to have been infringed.</li>
              <li>Identification of the material that is claimed to be infringing, with sufficient detail to locate it.</li>
              <li>Your contact information, including address, telephone number, and email address.</li>
              <li>A statement that you have a good faith belief that the use is not authorized by the copyright owner.</li>
              <li>A statement, under penalty of perjury, that the information in the notification is accurate.</li>
            </ul>
          </section>

          <section>
            <h2 className="!text-xl mb-3">4. Designated Copyright Agent</h2>
            <p className="mb-2">All DMCA takedown notices should be directed to:</p>
            <div className="bg-primary/50 rounded-xl p-4 border border-light-100/10">
              <p><strong className="text-white">Copyright Agent:</strong> CineVault Legal Team</p>
              <p><strong className="text-white">Email:</strong> dmca@cinevault.com</p>
              <p><strong className="text-white">Response Time:</strong> We aim to respond within 2-3 business days.</p>
            </div>
          </section>

          <section>
            <h2 className="!text-xl mb-3">5. Public Domain Content</h2>
            <p>Many films available on CineVault are in the public domain. In the United States, works published before 1929 are generally considered public domain. We take reasonable efforts to verify the public domain status of content before making it available through our streaming service. If you believe content labeled as public domain is actually under active copyright, please contact us immediately using the information above.</p>
          </section>

          <section>
            <h2 className="!text-xl mb-3">6. Repeat Infringer Policy</h2>
            <p>In accordance with the DMCA and other applicable laws, CineVault has adopted a policy of terminating, in appropriate circumstances, the accounts of users who are deemed to be repeat infringers. We may also limit access to our platform for users who repeatedly infringe the intellectual property rights of others.</p>
          </section>

          <section>
            <h2 className="!text-xl mb-3">7. Counter-Notification</h2>
            <p>If you believe that material you submitted was removed or access to it was disabled as a result of a mistake or misidentification, you may file a counter-notification with our Copyright Agent. The counter-notification must include your physical or electronic signature, identification of the material removed and its location before removal, a statement under penalty of perjury that you have a good faith belief the removal was a mistake, and your contact information.</p>
          </section>

          <section>
            <h2 className="!text-xl mb-3">8. Contact</h2>
            <p>For any copyright-related inquiries, please reach out through our <Link to="/contact" className="text-[#AB8BFF] hover:underline">Contact Page</Link> or email us directly at dmca@cinevault.com.</p>
          </section>
        </div>
      </LegalCard>
    </PageLayout>
  );
};

export default DMCAPage;
