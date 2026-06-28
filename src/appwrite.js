import { Client, Databases, Account, Query, ID } from 'appwrite';

const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID;
const MOVIES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_MOVIES_COLLECTION_ID;
const ADMIN_COLLECTION_ID = import.meta.env.VITE_APPWRITE_ADMIN_COLLECTION_ID || 'admin_config';

const client = new Client()
  .setEndpoint('https://sgp.cloud.appwrite.io/v1')
  .setProject(PROJECT_ID);

const database = new Databases(client);
const account = new Account(client);

// ─── ADMIN CONFIG PERSISTENCE ────────────────────────────
// Stores site configuration, ad codes, and affiliate links in Appwrite.
// Each config type is stored as a separate document keyed by 'configKey'.

const ADMIN_CONFIG_DOC_ID = 'cinevault_admin_config';

/**
 * Load all admin config from Appwrite. Falls back to localStorage on error.
 */
export const loadAdminConfig = async () => {
  try {
    const doc = await database.getDocument(
      DATABASE_ID,
      ADMIN_COLLECTION_ID,
      ADMIN_CONFIG_DOC_ID
    );
    return doc;
  } catch (error) {
    if (error.code === 404) {
      // Document doesn't exist yet — will be created on first save
      return null;
    }
    console.warn('Failed to load admin config from Appwrite, using localStorage:', error.message);
    return null;
  }
};

/**
 * Save admin config to Appwrite. Creates the document if it doesn't exist.
 *
 * @param {Object} config - { adConfig, siteConfig, affiliates, revenue, visitors }
 */
export const saveAdminConfig = async (config) => {
  try {
    // Try to update first
    await database.updateDocument(
      DATABASE_ID,
      ADMIN_COLLECTION_ID,
      ADMIN_CONFIG_DOC_ID,
      {
        adConfig: JSON.stringify(config.adConfig || {}),
        siteConfig: JSON.stringify(config.siteConfig || {}),
        affiliates: JSON.stringify(config.affiliates || []),
        revenue: JSON.stringify(config.revenue || {}),
        visitors: JSON.stringify(config.visitors || {}),
        updatedAt: new Date().toISOString(),
      }
    );
  } catch (error) {
    if (error.code === 404) {
      // Document doesn't exist — create it
      try {
        await database.createDocument(
          DATABASE_ID,
          ADMIN_COLLECTION_ID,
          ADMIN_CONFIG_DOC_ID,
          {
            adConfig: JSON.stringify(config.adConfig || {}),
            siteConfig: JSON.stringify(config.siteConfig || {}),
            affiliates: JSON.stringify(config.affiliates || []),
            revenue: JSON.stringify(config.revenue || {}),
            visitors: JSON.stringify(config.visitors || {}),
            updatedAt: new Date().toISOString(),
          }
        );
      } catch (createErr) {
        console.warn('Failed to create admin config document in Appwrite:', createErr.message);
      }
    } else {
      console.warn('Failed to save admin config to Appwrite:', error.message);
    }
  }
};

// ─── SEARCH METRICS (matrics table) ────────────────────────────

export const updateSearchCount = async (searchTerm, movie) => {
  try {
    const result = await database.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [Query.equal('searchTerm', searchTerm)]
    );

    if (result.documents.length > 0) {
      const doc = result.documents[0];
      await database.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        doc.$id,
        { count: doc.count + 1 }
      );
    } else {
      await database.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
        searchTerm,
        count: 1,
        'movie-id': movie.id,
        poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
      });
    }
  } catch (error) {
    console.error(error);
  }
};

// ─── MOVIES LIBRARY (movies table) ─────────────────────────────
// Previously used for manual streaming URLs.
// Streaming now uses auto-resolved embed sources (src/sources.js).
// Kept for admin/premium content via /watch/appwrite/:id route.

export const getMovieById = async (documentId) => {
  try {
    const result = await database.getDocument(
      DATABASE_ID,
      MOVIES_COLLECTION_ID,
      documentId
    );
    return result;
  } catch (error) {
    console.error('Error fetching movie:', error);
    return null;
  }
};

export { account };
