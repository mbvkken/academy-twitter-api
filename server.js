require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { authenticate } = require('./middleware');
const { 
    getTweets, 
    createTweet, 
    getUserByHandle,
    createUser,
    getTweetsByHandle
 } = require('./services/database')

const port = process.env.PORT;
const secret = process.env.SECRET;

const app = express();

const allowedOrigins = process.env.IS_LOCAL ?
'*' :
'https://academy-twitter-clone-frontend.herokuapp.com';

app.use(cors({
    origin: allowedOrigins
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send({ message: 'hello from twitter api'})
});

app.get('/tweets', async (req, res) => {
    const tweets = await getTweets();
    res.send(tweets);
});

app.get('/tweets/:handle', async (req, res) => {
    const { handle } = req.params;
    const tweets = await getTweetsByHandle(handle);
    res.send(tweets);
  });

app.post('/tweets', authenticate, async (req, res) => {
    const { message } = req.body;
    const user = req.user;
    const newTweet = await createTweet(message, user.id);
    res.send(newTweet);
});

app.post('/signup', async (req, res) => {
    const { name, handle, password } = req.body;
  
    try {
      const passwordHash = await bcrypt.hash(password, 10);
  
      const user = await createUser(name, handle, passwordHash);
  
      const token = jwt.sign({
        id: user.id,
        handle: user.handle,
        name: user.name,
      }, Buffer.from(secret, 'base64'));
  
      res.send({
        token: token
      });
    } catch (error) {
      const humanReadableError = getHumanReadableError(error);
      res.status(500).send({ error: humanReadableError.message });
    }
  });

  function getHumanReadableError(error) {
    switch (error.code) {
      case '23502':
        return new Error('Must provide username');
      default:
        return new Error('Something went wrong - contact support');
    }
  }

app.get('/session', authenticate, (req, res) => {
    const { handle } = req.user;

    res.send({
        message: `you are authenticated as ${handle}`
    });
});

app.post('/session', async (req, res) => {
    const { handle, password } = req.body;

    try {
        const user = await getUserByHandle(handle);
        
        if(!user) {
            return res.status(401).send({ error: 'unknown user' });
        }

        const isCorrectPassword = await bcrypt.compare(password, user.password);

    if (!isCorrectPassword) {
      return res.status(401).send({ error: 'Wrong password' });
    }

        const token = jwt.sign({
            id: user.id,
            handle: user.handle,
            name: user.name,
        }, Buffer.from(secret, 'base64'));

        res.send({
            token: token
        });

    } catch(error) {
        res.status(500).send({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`twitter API listening on ${port}`)
});
