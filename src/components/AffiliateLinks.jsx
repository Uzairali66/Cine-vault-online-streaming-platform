const AffiliateLinks = ({ movieTitle }) => {
  // Encode movie title for affiliate URLs
  const encodedTitle = encodeURIComponent(movieTitle || 'Movie');

  const affiliates = [
    {
      name: 'Amazon',
      url: `https://www.amazon.com/s?k=${encodedTitle}+movie+poster&tag=your-tag-20`,
      label: 'Buy Poster on Amazon',
      icon: '🖼️',
    },
    {
      name: 'NordVPN',
      url: 'https://go.nordvpn.net/aff_c?offer_id=15&aff_id=your-id',
      label: 'Protect Your Privacy with NordVPN',
      icon: '🔒',
    },
  ];

  return (
    <div className="bg-dark-100 rounded-xl p-5 border border-light-100/10">
      <h3 className="!text-base mb-3 text-white">Related Products</h3>
      <div className="flex flex-col gap-3">
        {affiliates.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex items-center gap-3 bg-light-100/5 hover:bg-light-100/10 rounded-lg px-4 py-3 transition-colors duration-200"
          >
            <span className="text-xl">{link.icon}</span>
            <div className="flex-1 text-left">
              <p className="text-white text-sm font-medium">{link.label}</p>
              <p className="text-gray-100 text-xs">Affiliate link — we may earn a commission</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default AffiliateLinks;