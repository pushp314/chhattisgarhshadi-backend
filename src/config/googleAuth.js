const { OAuth2Client } = require('google-auth-library');
const logger = require('./logger');

class GoogleAuthClient {
  constructor() {
    if (!process.env.GOOGLE_CLIENT_ID) {
      throw new Error('GOOGLE_CLIENT_ID is required');
    }
    
    this.client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    logger.info('✅ Google Auth Library initialized');
  }

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

      return {
        googleId: payload.sub,
        email: payload.email,
        emailVerified: payload.email_verified || false,
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

module.exports = new GoogleAuthClient();