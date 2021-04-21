const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { getTweets, createTweet, getUserByHandle } = require('./services/database')
const jwt = require('jsonwebtoken');
const { authenticate } = require('./middleware');

const port = process.env.PORT;
const secret = 'somethingverysecret1234';

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send({ message: 'hello from twitter api'})
});

app.get('/tweets', async (req, res) => {
    const tweets = await getTweets();
    res.send(tweets);
});

app.post('/tweets', authenticate, async (req, res) => {
    const { message } = req.body;
    const user = req.user;
    const newTweet = await createTweet(message, user.id);
    res.send(newTweet);
});

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

        if (user.password !== password) {
            return res.status(401).send({ error: 'wrong password'});
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
})

app.listen(port, () => {
    console.log(`twitter API listening on ${port}`)
});
