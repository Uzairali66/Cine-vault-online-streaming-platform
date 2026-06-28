export const EMBED_SOURCES = [
  {
    name: 'Vidsrc.pm',
    type: 'embed',
    idType: 'tmdb',
    embedUrl: function (id, mediaType, season, episode) {
      if (mediaType === 'tv' && season != null && episode != null) {
        return 'https://vidsrc.pm/embed/tv/' + id + '/' + season + '/' + episode;
      }
      return 'https://vidsrc.pm/embed/movie/' + id;
    }
  },
  {
    name: 'Vidsrc.cc',
    type: 'embed',
    idType: 'tmdb',
    embedUrl: function (id, mediaType, season, episode) {
      if (mediaType === 'tv' && season != null && episode != null) {
        return 'https://vidsrc.cc/v2/embed/tv/' + id + '/' + season + '/' + episode;
      }
      return 'https://vidsrc.cc/v2/embed/movie/' + id;
    }
  },
  {
    name: 'VidLink.pro',
    type: 'embed',
    idType: 'tmdb',
    embedUrl: function (id, mediaType, season, episode) {
      if (mediaType === 'tv' && season != null && episode != null) {
        return 'https://vidlink.pro/tv/' + id + '/' + season + '/' + episode;
      }
      return 'https://vidlink.pro/movie/' + id;
    }
  },
  {
    name: 'MoviesAPI',
    type: 'embed',
    idType: 'tmdb',
    embedUrl: function (id, mediaType, season, episode) {
      if (mediaType === 'tv' && season != null && episode != null) {
        return 'https://moviesapi.club/tv/' + id + '-' + season + '-' + episode;
      }
      return 'https://moviesapi.club/movie/' + id;
    }
  },
  {
    name: 'SmashyStream',
    type: 'embed',
    idType: 'tmdb',
    embedUrl: function (id, mediaType, season, episode) {
      if (mediaType === 'tv' && season != null && episode != null) {
        return 'https://player.smashy.stream/tv/' + id + '?s=' + season + '&e=' + episode;
      }
      return 'https://player.smashy.stream/movie/' + id;
    }
  },
  {
    name: 'Vidsrc.vip',
    type: 'embed',
    idType: 'tmdb',
    embedUrl: function (id, mediaType, season, episode) {
      if (mediaType === 'tv' && season != null && episode != null) {
        return 'https://vidsrc.vip/embed/tv/' + id + '/' + season + '/' + episode;
      }
      return 'https://vidsrc.vip/embed/movie/' + id;
    }
  },
  {
    name: 'Embed.su',
    type: 'embed',
    idType: 'tmdb',
    embedUrl: function (id, mediaType, season, episode) {
      if (mediaType === 'tv' && season != null && episode != null) {
        return 'https://embed.su/embed/tv/' + id + '/' + season + '/' + episode;
      }
      return 'https://embed.su/embed/movie/' + id;
    }
  },
  {
    name: 'Vidsrc.icu',
    type: 'embed',
    idType: 'tmdb',
    embedUrl: function (id, mediaType, season, episode) {
      if (mediaType === 'tv' && season != null && episode != null) {
        return 'https://vidsrc.icu/embed/tv/' + id + '/' + season + '/' + episode;
      }
      return 'https://vidsrc.icu/embed/movie/' + id;
    }
  },
  {
    name: 'MultiEmbed',
    type: 'embed',
    idType: 'tmdb',
    embedUrl: function (id, mediaType, season, episode) {
      if (mediaType === 'tv' && season != null && episode != null) {
        return 'https://multiembed.mov/?video_id=' + id + '&tmdb=1&s=' + season + '&e=' + episode;
      }
      return 'https://multiembed.mov/?video_id=' + id + '&tmdb=1';
    }
  }
];

export function getSourceCount() { return EMBED_SOURCES.length; }
export function isImdbSource(index) { return EMBED_SOURCES[index]?.idType === 'imdb'; }
export function getAllSourceNames() { return EMBED_SOURCES.map(function (s) { return s.name; }); }
export function getSourceType(index) { return 'embed'; }

export function getEmbedUrl(index, tmdbId, mediaType, season, episode, imdbId) {
  var source = EMBED_SOURCES[index];
  if (!source) return null;

  var activeId = source.idType === 'imdb' ? (imdbId || tmdbId) : (tmdbId || imdbId);
  if (!activeId) return null;

  return source.embedUrl(activeId, mediaType || 'movie', season, episode);
}

export function getSource(index, tmdbId, mediaType, season, episode, lang, imdbId) {
  var url = getEmbedUrl(index, tmdbId, mediaType, season, episode, imdbId);
  if (!url) return null;
  return { url: url, name: EMBED_SOURCES[index].name, type: 'embed', index: index };
}

// FORCE RECOMPILE: 2026_JUNE_01_V4
