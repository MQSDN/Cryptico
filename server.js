'use strict';
require('dotenv').config();

const express = require('express');
const app = express();
const pg = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { request } = require('express');
const PORT = process.env.PORT;
const DATABASE_URL = process.env.DATABASE_URL;

const client = new pg.Client({
    connectionString: DATABASE_URL,
});

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public/styles'));
app.get('/', (req, res) => {
    res.render('index');
});

// ----------------------------------------------------------------
app.post('/showAllQuestions', handleUserQuestions);

function handleUserQuestions(req, res) {
  const { optionA, optionB, optionC, optionD } = req.body;
  console.log(optionA, optionB, optionC, optionD)
  const correctAnswer='SELECT * FROM quiz;'
  let score=0;
client.query(correctAnswer).then(answer=>{
  if(answer.rows.correctAnswer===optionA||answer.rows.correctAnswer===optionB||answer.rows.correctAnswer===optionC||answer.rows.correctAnswer===optionD){
    score++;
  }
  console.log(score);
})
}


app.post('/quiz', handleQuiz);

function handleQuiz(req, res) {
    const { question, optionA, optionB, optionC, optionD, correctAnswer } = req.body

    const safeValues = [question, optionA, optionB, optionC, optionD, correctAnswer];
    const sqlQuery = 'INSERT INTO quiz (question, optionA, optionB, optionC, optionD, correctAnswer) Values ($1, $2, $3, $4, $5, $6);'

    client.query(sqlQuery, safeValues);

    const getAllquestions = 'SELECT * FROM quiz;'

    client.query(getAllquestions).then(result => {
        console.log(result.rows);
        if (result) {
            res.render('profile', { result: result.rows });
        }
    });

}

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', handelRegister);
async function handelRegister(request, res) {

    try {
        const email = request.body.email;
        const password = request.body.pass;

        const name = request.body.name;
        const password2 = request.body.pass2;
        const date = request.body.date;
        let errors = [];
        if (!name || !email || !password || !password2 || !date) {
            errors.push({ message: "Please enter all fields" });
        }

        if (password.length < 6) {
            errors.push({ message: "Password must be a least 6 characters long" });
        }

        if (password !== password2) {
            errors.push({ message: "Passwords do not match" });
        }

        if (errors.length > 0) {
            res.render("register", { errors, name, email, password, password2, date })
        } else {

            const hash = await bcrypt.hash(password, 10);


            const safeValues = [name, email, hash, date];
            const InsetIntoDataBaseQuery = 'INSERT INTO users (name,email, pass , date) VALUES ($1, $2,$3,$4);';
            await client.query(InsetIntoDataBaseQuery, safeValues).then((results) => {

                res.render('login');
            })
        }


    } catch (error) {
        console.log(error);
        res.send("CHECK YOU TERMINAL SOMETHING WENT WRONG");
    }

}



app.get("/logout", (req, res) => {
    res.render("index", { message: "You have logged out successfully" });
});


app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', handleLogin);
async function handleLogin(req, res) {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const safe = [email]
        const getDataBaseQuery = 'SELECT * FROM users WHERE email=$1;';
        await client.query(getDataBaseQuery, safe).then(async(results) => {

            if (results) {
                const validation = await bcrypt.compare(password, results.rows[0].pass)

                if (validation) {

                    res.render("profile", { result: [] });
                } else {
                    res.send("Wrong Password");
                };

            } else {
                res.send("No such data in theD DB");
            };
        });

    } catch (error) {
        console.log(error);
    };

};

client.connect().then(() =>
    app.listen(PORT, () => console.log(`Listening on port: ${PORT}`))
);