import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { config } from './config.js';
import { logger } from './logger.js';
import prisma from './database.js';

/**
 * Configure Google OAuth Strategy
 */
passport.use(
  new GoogleStrategy(
    {
      clientID: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      callbackURL: config.GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0]?.value;
        const googleId = profile.id;
        const name = profile.displayName;

        if (!email) {
          return done(new Error('No email found in Google profile'), null);
        }

        // Check if user already exists
        let user = await prisma.user.findUnique({
          where: { googleId },
          include: { profile: true },
        });

        if (!user) {
          // Check if email is already registered
          const existingUser = await prisma.user.findUnique({
            where: { email },
          });

          if (existingUser) {
            // Link Google account to existing user
            user = await prisma.user.update({
              where: { email },
              data: { googleId },
              include: { profile: true },
            });
          } else {
            // Create new user
            user = await prisma.user.create({
              data: {
                email,
                googleId,
                name,
                role: 'USER',
              },
              include: { profile: true },
            });
          }
        }

        logger.info(`User authenticated via Google: ${user.email}`);
        return done(null, user);
      } catch (error) {
        logger.error('Google OAuth error:', error);
        return done(error, null);
      }
    }
  )
);

/**
 * Serialize user for session
 */
passport.serializeUser((user, done) => {
  done(null, user.id);
});

/**
 * Deserialize user from session
 */
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

logger.info('Passport Google OAuth strategy configured successfully');

export default passport;
