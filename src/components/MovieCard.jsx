import React from 'react'
import { getLanguageLabel, getLanguageFlag } from '../utils/languages';

const MovieCard = ({
  movie: { title, name, vote_average, poster_path, release_date, first_air_date, original_language },
  onClick,
  mediaType   // optional: 'movie' | 'tv'
}) => {
  const displayTitle = title || name || 'Untitled';
  const displayYear = release_date ? release_date.split('-')[0] : first_air_date ? first_air_date.split('-')[0] : 'N/A';

  const langCode = original_language;
  const langFlag = getLanguageFlag(langCode);
  const langName = langCode?.toUpperCase() || '';
  const isKorean = langCode === 'ko';

  return (
    <div
      className='movie-card cursor-pointer hover:scale-[1.03] active:scale-[0.98] transition-all duration-300'
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(e); }}
    >
      <img
        src={poster_path ? `https://image.tmdb.org/t/p/w342/${poster_path}` : "/no-movie.png"}
        alt={displayTitle}
        loading="lazy"
        decoding="async"
      />

      <div className='mt-4 max-xs:mt-2'>
        <h3>{displayTitle}</h3>

        <div className='content'>
          <div className='rating'>
            <img src="star.svg" alt="star-icon" />
            <p>{vote_average ? vote_average.toFixed(1) : 'N/A'}</p>
          </div>

          <span>•</span>
          <p className='lang' title={langName}>
            {langFlag} {langCode?.toUpperCase() || '?'}
          </p>
          <span>•</span>
          <p className='year'>{displayYear}</p>
        </div>

        {/* Language badges row */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {/* Korean badge */}
          {isKorean && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-500/20 text-violet-300 text-[10px] rounded-full border border-violet-500/30 font-medium">
              🇰🇷 K-{mediaType === 'tv' ? 'Drama' : 'Movie'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default MovieCard