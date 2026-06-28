export const MOVIE_GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 10770, name: 'TV Movie' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' },
];

export const TV_GENRES = [
  { id: 10759, name: 'Action & Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 10762, name: 'Kids' },
  { id: 9648, name: 'Mystery' },
  { id: 10763, name: 'News' },
  { id: 10764, name: 'Reality' },
  { id: 10765, name: 'Sci-Fi & Fantasy' },
  { id: 10766, name: 'Soap' },
  { id: 10767, name: 'Talk' },
  { id: 10768, name: 'War & Politics' },
  { id: 37, name: 'Western' },
];

export const MOVIE_CATEGORY_ROWS = [
  { key: 'popular-movies', name: 'Popular on CineVault', mediaType: 'movie', endpoint: '/movie/popular', browseTo: '/browse?mediaType=movie&sort=popularity.desc' },
  { key: 'top-rated-movies', name: 'Top Rated Movies', mediaType: 'movie', endpoint: '/movie/top_rated', browseTo: '/browse?mediaType=movie&sort=vote_average.desc' },
  { key: 'now-playing-movies', name: 'Now Playing Movies', mediaType: 'movie', endpoint: '/movie/now_playing', browseTo: '/browse?mediaType=movie&sort=primary_release_date.desc' },
  { key: 'latest-movies', name: 'Latest Movies', mediaType: 'movie', discoverParams: { sort_by: 'primary_release_date.desc', 'primary_release_date.lte': 'today' }, browseTo: '/browse?mediaType=movie&sort=primary_release_date.desc' },
  ...MOVIE_GENRES.map((genre) => ({
    key: `movie-genre-${genre.id}`,
    id: genre.id,
    name: `${genre.name} Movies`,
    mediaType: 'movie',
  })),
];

export const TV_CATEGORY_ROWS = [
  { key: 'popular-tv', name: 'Popular TV Shows', mediaType: 'tv', endpoint: '/tv/popular', browseTo: '/browse?mediaType=tv&sort=popularity.desc' },
  { key: 'top-rated-tv', name: 'Top Rated TV Shows', mediaType: 'tv', endpoint: '/tv/top_rated', browseTo: '/browse?mediaType=tv&sort=vote_average.desc' },
  { key: 'airing-today-tv', name: 'Airing Today', mediaType: 'tv', endpoint: '/tv/airing_today', browseTo: '/browse?mediaType=tv&sort=first_air_date.desc' },
  { key: 'latest-tv', name: 'Latest TV Shows', mediaType: 'tv', discoverParams: { sort_by: 'first_air_date.desc', 'first_air_date.lte': 'today' }, browseTo: '/browse?mediaType=tv&sort=first_air_date.desc' },
  ...TV_GENRES.map((genre) => ({
    key: `tv-genre-${genre.id}`,
    id: genre.id,
    name: `${genre.name} TV Shows`,
    mediaType: 'tv',
  })),
];

export const ALL_GENRES = Array.from(
  new Map([...MOVIE_GENRES, ...TV_GENRES].map((genre) => [genre.id, genre])).values()
);
