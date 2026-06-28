import React from 'react'
import { Link } from 'react-router-dom'
import AdBanner from './AdBanner';

const Footer = () => {
  return (
    <footer className="relative z-10 border-t border-light-100/10 mt-auto py-10 px-4 sm:px-6">
      {/* Footer Banner Ad */}
      <div className="max-w-7xl mx-auto mb-8">
        <AdBanner format="leaderboard" />
      </div>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">

        {/* Brand */}
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="CineVault Logo" className="w-8 h-8 object-contain" />
          <span className="text-white font-bold text-lg">CineVault</span>
        </div>

        {/* Legal Links */}
        <nav className="flex flex-wrap items-center justify-center gap-6">
          <Link to="/privacy-policy" className="text-gray-100 hover:text-white transition-colors duration-200 text-sm">
            Privacy Policy
          </Link>
          <Link to="/terms-of-service" className="text-gray-100 hover:text-white transition-colors duration-200 text-sm">
            Terms of Service
          </Link>
          <Link to="/dmca" className="text-gray-100 hover:text-white transition-colors duration-200 text-sm">
            DMCA Notice
          </Link>
          <Link to="/contact" className="text-gray-100 hover:text-white transition-colors duration-200 text-sm">
            Contact Us
          </Link>
        </nav>

        {/* Copyright */}
        <p className="text-gray-100 text-xs text-center md:text-right">
          © {new Date().getFullYear()} CineVault. All rights reserved.
        </p>
      </div>

      {/* Browse by Year — SEO + internal linking */}
      <div className="max-w-7xl mx-auto mt-6 pt-6 border-t border-light-100/5">
        <p className="text-gray-100/60 text-xs mb-2 text-center md:text-left">Browse by Year</p>
        <div className="flex flex-wrap justify-center md:justify-start gap-2">
          {Array.from({ length: 10 }).map((_, i) => {
            const y = new Date().getFullYear() - i;
            return (
              <Link
                key={y}
                to={`/year/${y}`}
                className="px-3 py-1 rounded-full text-xs bg-gray-800 text-gray-100 hover:text-white hover:bg-gray-700 transition-colors"
              >
                {y}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="max-w-7xl mx-auto mt-6 pt-6 border-t border-light-100/5">
        <p className="text-gray-100/60 text-xs text-center leading-relaxed">
          CineVault is a movie discovery platform. All movie metadata is provided by TMDB.
          CineVault is not affiliated with or endorsed by TMDB. All trademarks belong to their respective owners.
        </p>
      </div>
    </footer>
  )
}

export default Footer
