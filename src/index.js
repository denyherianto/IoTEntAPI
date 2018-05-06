require('dotenv').config()
const { send, sendError, json } = require('micro')
const { router, get, post, withNamespace } = require('microrouter')
const cors = require('micro-cors')({
  allowMethods: ['PUT', 'POST', 'GET', 'PATCH'],
  allowHeaders: ['Access-Control-Allow-Origin','Content-Type','Authorization','Accept'],
  origin: '*'
})
const health = require('micro-health-api')
const {buildSchema} = require('graphql')
const server = require('express-graphql')

// MySQL
const Sequelize = require('sequelize');
const db = require('./db')(Sequelize);
const User = require('./models/user')(db, Sequelize)
db.sync()

// Schema
/*
const schema = buildSchema(`
  type Query {
    hello: String
  }
`)

const rootValue = {
  hello: () => 'Hello world'
}
*/

const auth = require('./auth');

// Router
const init = (req, res) => send(res, 200, 'Hello, world')
const hello = (req, res) => send(res, 200, `Hello ${req.params.who}`)
// const success = async (req, res) => {
//   const message = 'Response successfully generated'
//   const body = await json(req)
//   try {
//     const result = await User.create({
//       username: body.username,
//       birthday: body.birthday,
//       password: body.password
//     })
//     send(res, 200, {
//       success: true,
//       message: 'User successfully created',
//       user: result.toJSON()
//     })
//   } catch (err) {
//     send(res, 500, {
//       success: false,
//       message: 'User failed to create'
//     })
//   }
// }

const authorize = async (req, res) => {
  const message = 'Response successfully generated'
  const body = await json(req)

  const {OAuth2Client} = require('google-auth-library');
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  async function verify() {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const g_userid = payload['sub'];
    // If request specified a G Suite domain:
    const g_domain = payload['hd'];
    const g_email = payload['email'];
    const g_name = payload['name'];
    const jwt_token = auth.generate(g_userid)

    if (g_domain === process.env.BL_DOMAIN) {
      try {

        User
          .findOrCreate({
            where: {
              email: g_email,
            },
            defaults: {
              name: g_name,
              google_id: g_userid,
              // jwt_token: jwt_token,
            }
          })
          .spread((user, created) => {
            const message;
            if (created) {
              // Register User
              message = 'User successfully registered';
            } else {
              message = 'User successfully login';
            }

            send(res, 200, {
              success: true,
              message: message,
              data: {
                name: user.name,
                email: user.email,
                jwt_token: jwt_token,
                expired_at: '',
              }
              // user: payload,
            })
          })

      } catch (err) {
        send(res, 500, {
          success: false,
          message: 'User failed to create'
        })
      }
    } else {
      send(res, 500, {
        success: false,
        message: 'User not registered as Bukalapak Employee.'
      })
    }
  }
  verify().catch(() => {
    send(res, 500, {
      success: false,
      message: 'Google verify error'
    })
  });
}

const refresh_token = async (req, res) => {
  const message = 'Response successfully generated'
  const body = await json(req)

  if (!body.token) {
    send(res, 500, {
      success: false,
      message: 'Please provide token'
    })
  }

  const {OAuth2Client} = require('google-auth-library');
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  async function verify() {
    const ticket = await client.verifyIdToken({
        idToken: body.token,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const userid = payload['sub'];
    // If request specified a G Suite domain:
    const domain = payload['hd'];

    if (domain === process.env.BL_DOMAIN) {
      try {
        send(res, 200, {
          success: true,
          message: 'User successfully created',
          // user: result.toJSON()
          user: payload,
        })
      } catch (err) {
        send(res, 500, {
          success: false,
          message: 'User failed to create'
        })
      }
    } else {
      send(res, 500, {
        success: false,
        message: 'User not registered as Bukalapak Employee.'
      })
    }
  }
  verify().catch(() => {
    send(res, 500, {
      success: false,
      message: 'Google verify error'
    })
  });
}

/*
const graphqlHandler = server({
  schema,
  rootValue,
  graphiql: false
});

const graphiqlHandler = server({
  schema,
  rootValue,
  graphiql: true
});
*/

const apiNamespace = withNamespace('/user')
module.exports = cors(router(
  apiNamespace(get('/', init)),
  apiNamespace(get('/hello/:who', hello)),
  apiNamespace(post('/authorize', authorize)),
  apiNamespace(post('/refresh-token', refresh_token)),
  // apiNamespace(post('/graphql', graphqlHandler)),
  // apiNamespace(get('/graphql', graphiqlHandler)),
))
