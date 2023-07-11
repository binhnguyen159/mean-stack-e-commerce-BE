const { expressjwt: jwt } = require("express-jwt");

const isRevokedCallback = async (req, tokenPayload) => {
  if (!tokenPayload.payload.isAdmin) {
    return true;
  }
  return false;
};

const authJwt = () => {
  const secret = process.env.MY_SECRET;
  const api = process.env.API_URL;
  return jwt({
    secret,
    algorithms: ["HS256"],
    isRevoked: isRevokedCallback,
  }).unless({
    path: [
      `${api}/users/authen/login`,
      `${api}/users/authen/register`,
      // /\/public\/uploads(.*)/
      { url: /\/public\/uploads(.*)/, methods: ["GET", "OPTIONS"] },
      { url: /\/api\/v1\/products(.*)/, methods: ["GET", "OPTIONS"] },
      { url: /\/api\/v1\/categories(.*)/, methods: ["GET", "OPTIONS"] },
      { url: /\/api\/v1\/orders(.*)/, methods: ['GET', 'OPTIONS', 'POST'] },
      { url: /\/api\/v1\/users(.*)/, methods: ['GET'] },
      // { url: /(.*)/ },
    ],
  });
};

module.exports = authJwt;
