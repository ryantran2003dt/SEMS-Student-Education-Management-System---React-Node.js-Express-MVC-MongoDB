const jwt = require('jsonwebtoken');
const config = require('../config/env');

function generateToken(payload) {
  return jwt.sign(payload, config.jwtAccessSecret, {
    expiresIn: config.jwtAccessExpiresIn
  });
}

function verifyToken(token) {
  return jwt.verify(token, config.jwtAccessSecret);
}

module.exports = {
  generateToken,
  verifyToken
};
