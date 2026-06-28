import React from 'react'

const PlayerModal = ({ isOpen, trailerKey, onClose, movieTitle }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h3 className="text-xl font-bold text-white truncate pr-4">{movieTitle}</h3>
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors duration-200 p-1 rounded-full hover:bg-zinc-800"
            aria-label="Close player"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Video Player */}
        <div className="relative aspect-video w-full bg-black">
          {trailerKey ? (
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`}
              title={`${movieTitle} Trailer`}
              className="absolute inset-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400 p-4 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-zinc-600 mb-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-lg font-semibold text-zinc-300">Official trailer not found</p>
              <p className="text-sm mt-1">We couldn't locate a streaming video source for this title.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PlayerModal
