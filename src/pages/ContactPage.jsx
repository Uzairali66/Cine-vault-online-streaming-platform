import { useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import PageLayout from '../components/layout/PageLayout';
import BackLink from '../components/layout/BackLink';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Contact form submitted:', formData);
    setSubmitted(true);
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <PageLayout width="3xl">
      <SEO
        title="Contact Us - CineVault"
        description="Get in touch with the CineVault team. Send us a message and we'll respond within 24-48 hours."
        url="/contact"
        type="website"
      />

      <BackLink to="/" label="Back to Home" className="mb-8" />

      <div className="legal-card max-w-2xl mx-auto w-full">
        <h1 className="legal-card__title">Contact Us</h1>
        <p className="text-light-200 mb-8">Have a question, suggestion, or found an issue? We'd love to hear from you. Fill out the form below and we'll get back to you as soon as possible.</p>

        {submitted ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="!text-xl text-green-400 mb-2">Message Sent!</h2>
            <p className="text-light-200">Thank you for reaching out. We'll respond to your message shortly.</p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-4 text-[#AB8BFF] hover:underline text-sm"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-white font-medium mb-2">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-light-100/5 border border-light-100/10 rounded-lg px-4 py-3 text-white placeholder-gray-100 outline-none focus:border-[#AB8BFF] transition-colors"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-white font-medium mb-2">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full bg-light-100/5 border border-light-100/10 rounded-lg px-4 py-3 text-white placeholder-gray-100 outline-none focus:border-[#AB8BFF] transition-colors"
                placeholder="Enter your email address"
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-white font-medium mb-2">Subject</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full bg-light-100/5 border border-light-100/10 rounded-lg px-4 py-3 text-white placeholder-gray-100 outline-none focus:border-[#AB8BFF] transition-colors"
                placeholder="What is this about?"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-white font-medium mb-2">Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={5}
                className="w-full bg-light-100/5 border border-light-100/10 rounded-lg px-4 py-3 text-white placeholder-gray-100 outline-none focus:border-[#AB8BFF] transition-colors resize-none"
                placeholder="Write your message here..."
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#D6C7FF] to-[#AB8BFF] text-dark-100 font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity duration-200"
            >
              Send Message
            </button>
          </form>
        )}
      </div>

      <div className="max-w-2xl mx-auto w-full mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-dark-100 rounded-2xl p-6 shadow-inner shadow-light-100/10 text-center">
          <h2 className="!text-lg mb-2">Email</h2>
          <p className="text-light-200 text-sm">support@cinevault.com</p>
        </div>
        <div className="bg-dark-100 rounded-2xl p-6 shadow-inner shadow-light-100/10 text-center">
          <h2 className="!text-lg mb-2">Response Time</h2>
          <p className="text-light-200 text-sm">We typically respond within 24-48 hours</p>
        </div>
      </div>
    </PageLayout>
  );
};

export default ContactPage;
