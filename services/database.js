const { Pool } = require('pg');

const database = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.IS_LOCAL ? undefined : {
        rejectUnauthorized: false
    }
});

// const databaseUrl = 'postgres://me:1234@localhost:5432/twitter'
// const database = new Pool({
//     connectionString: databaseUrl
// });

function getTweets() {
    return database.query(`
    SELECT 
        tweets.id, 
        tweets.message, 
        tweets.created_at, 
        users.name, 
        users.handle 
    FROM 
        tweets 
    INNER JOIN users ON 
        tweets.user_id = users.id 
    ORDER BY created_at DESC;
    `)
    .then((results) => results.rows);
}

function getTweetsByHandle(handle) {
    return database.query(`
        SELECT
          tweets.id, 
          tweets.message,
          tweets.created_at,
          users.name, 
          users.handle
        FROM 
          tweets
        INNER JOIN users ON
          tweets.user_id = users.id
        WHERE
          users.handle = $1
        ORDER BY created_at DESC;
    `, [handle])
    .then((results) => results.rows)
}

function createTweet(message, user_id) {
    return database.query(`
    INSERT INTO tweets
        (message, user_id)
    VALUES
        ($1, $2)
    RETURNING 
        *
    `, [
        message, 
        user_id
    ])
    .then((results) => results.rows[0]);
}

function createUser(name, handle, password) {
    return database.query(`
      INSERT INTO users
        (name, handle, password)
      VALUES
        ($1, $2, $3)
      RETURNING
        *
    `, [
        name,
        handle || null,
        password
    ])
    .then((results) => results.rows[0]);
}

function getUserByHandle(handle) {
    return database.query(`
        SELECT * FROM users WHERE handle = $1  
    `, [handle])
    .then((results) => results.rows[0])
}

module.exports = {
    getTweets,
    createTweet,
    getUserByHandle,
    createUser,
    getTweetsByHandle
};
