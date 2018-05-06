const { json, send, createError } = require('micro');
const { sign, verify } = require('jsonwebtoken');

const secret = process.env.JWT_SECRET;

/**
 * Authenticate a user and generate a JWT if successful.
 */
const generate = (id) => {
  let token = sign(id, secret, {
    expiresIn: '1h'
  });
  return { token: token };
}

const decode = token => verify(token, secret);

module.exports.login = async (req, res) => {
  await generate(await json(req));
}

module.exports.decode = (req, res) => decode(req.headers['authorization']);
