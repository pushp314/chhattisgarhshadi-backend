import { OAuth2Client } from "google-auth-library";
import { config } from "../../config/config.js";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";

const client = new OAuth2Client(config.GOOGLE_CLIENT_ID);

const googleLogin = async (idToken) => {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: config.GOOGLE_CLIENT_ID,
  });

  const { name, email, sub: googleId } = ticket.getPayload();

  let user = await prisma.user.findUnique({ where: { googleId } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        googleId,
        email,
        name,
      },
    });
  }

  // TODO: Generate and return JWT tokens

  return user;
};

export const authService = {
  googleLogin,
};
