import { OAuth2Client } from 'google-auth-library';
import { logger } from './logger.js';

class GoogleAuthClient {
  constructor() {
    if (!process.env.GOOGLE_CLIENT_ID) {
      throw new Error('GOOGLE_CLIENT_ID is required');
    }
    
    // Initialize OAuth2Client with client ID, secret, and redirect URI
    this.client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET || '', // Optional for idToken flow
      process.env.GOOGLE_REDIRECT_URI || 'com.chhattisgarhshaadi.app://oauth2redirect'
    );
    logger.info('✅ Google Auth Library initialized');
  }

  /**
   * Exchange authorization code for tokens (Web-Based OAuth)
   * @param {string} authorizationCode - Authorization code from Google
   * @param {string} redirectUri - Redirect URI used in OAuth flow
   * @returns {Promise<Object>} User payload
   */
  async verifyAuthorizationCode(authorizationCode, redirectUri) {
    try {
      if (!process.env.GOOGLE_CLIENT_SECRET) {
        throw new Error('GOOGLE_CLIENT_SECRET is required for authorization code flow');
      }

      // Exchange authorization code for tokens
      const { tokens } = await this.client.getToken({
        code: authorizationCode,
        redirect_uri: redirectUri || process.env.GOOGLE_REDIRECT_URI || 'com.chhattisgarhshaadi.app://oauth2redirect',
      });

      if (!tokens.id_token) {
        throw new Error('No ID token received from Google');
      }

      // Verify the ID token
      const ticket = await this.client.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      
      if (!payload) {
        throw new Error('Invalid token payload');
      }

      // Check for issuer
      if (payload.iss !== 'accounts.google.com' && payload.iss !== 'https://accounts.google.com') {
        throw new Error('Invalid token issuer');
      }
      
      // Check if email is verified
      if (!payload.email_verified) {
        throw new Error('Google account email is not verified');
      }

      logger.info(`✅ Authorization code verified for user: ${payload.email}`);

      return {
        googleId: payload.sub,
        email: payload.email,
        emailVerified: payload.email_verified,
        name: payload.name,
        picture: payload.picture,
        givenName: payload.given_name,
        familyName: payload.family_name,
      };
    } catch (error) {
      logger.error('Google authorization code verification failed:', error.message);
      throw new Error(`Invalid authorization code: ${error.message}`);
    }
  }

  /**
   * Verify ID token (Legacy flow for backward compatibility)
   * @param {string} idToken - Google ID token
   * @returns {Promise<Object>} User payload
   */
  async verifyIdToken(idToken) {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      
      if (!payload) {
        throw new Error('Invalid token payload');
      }

      // Check for issuer
      if (payload.iss !== 'accounts.google.com' && payload.iss !== 'https://accounts.google.com') {
        throw new Error('Invalid token issuer');
      }
      
      // Check if email is verified
      if (!payload.email_verified) {
        throw new Error('Google account email is not verified');
      }

      logger.info(`✅ ID token verified for user: ${payload.email}`);

      return {
        googleId: payload.sub,
        email: payload.email,
        emailVerified: payload.email_verified,
        name: payload.name,
        picture: payload.picture,
        givenName: payload.given_name,
        familyName: payload.family_name,
      };
    } catch (error) {
      logger.error('Google token verification failed:', error.message);
      throw new Error('Invalid Google ID token');
    }
  }
}

export default new GoogleAuthClient();