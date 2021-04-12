'use strict';
require('dotenv').config();

const express = require('express');
const app = express();
const pg = require('pg');
const cors = require('cors');
const superagent = require('superagent');
const bcrypt = require('bcrypt');
const PORT = process.env.PORT;
const DATABASE_URL = process.env.DATABASE_URL;

const client = new pg.Client({
    connectionString: DATABASE_URL,
});

app.use(methodOverride('_method'));

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public/styles"));
app.get('/', (req, res) => {
    res.render('index');
});


// ---------------------------------
app.get("/logout", (req, res) => {
    res.render("index", { message: "You have logged out successfully" });
});

// ---------------------------------


app.get('/register', (req, res) => {
    res.render('register')
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
// ---------------------------------


app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/addQuiz', (req, res) => {
    res.render('addQuiz',{results:[]});
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
                    res.render("profile", { results: results.rows })
                } else {
                    res.send("Wrong PASS");
                };

            } else {
                res.send("No such data in the DB");
            };
        });

    } catch (error) {
        console.log(error);
    };
};


// ---------------------------------
app.post('/quiz', handleQuiz);

function handleQuiz(req, res) {
    const { question, optionA, optionB, optionC, optionD, correctAnswer } = req.body

    const safeValues = [question, optionA, optionB, optionC, optionD, correctAnswer];
    const sqlQuery = 'INSERT INTO quiz (question, optionA, optionB, optionC, optionD, correctAnswer) Values ($1, $2, $3, $4, $5, $6);'

    client.query(sqlQuery, safeValues);

    const getAllQuestions = 'SELECT * FROM quiz;'
    client.query(getAllQuestions).then(result => {
        if (result) {
            res.render('addQuiz', { results: result.rows });
        }
    });

}

app.post('/showAllQuestions', handleUserQuestions);

function handleUserQuestions(req, res) {
    const { value } = req.body;
    const correctAnswer = 'SELECT * FROM quiz;'
    let score = 0;
    client.query(correctAnswer).then(answer => {
        if (answer.rows.correctAnswer === value) {
            score++;
        }
        console.log(score);
    })
}


////////////////////////////////////////////////////////////// Quizzes Part
app.post('/start', startQuiz);

function startQuiz(req, res) {

    const queryObject = {
        category: req.body.category,
        difficulty: req.body.level
    }
    console.log(queryObject);
    const url = `https://opentdb.com/api.php?amount=10&category=${queryObject.category}&difficulty=${queryObject.difficulty}&type=multiple`;
    console.log(url);
    superagent.get(url).then(resData => {
        const questions = resData.body.results.map(question => {
            return new Question(question);
        });
        res.render('quiz', { questions: questions })
    }).catch(error => {
        console.error('ERROR', error);
        res.status(404).send('Sorry , Something went wrong');
    });
}

function decodeHtml(str) {
    var map = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#039;': "'",
        '&pi;': 'PI'
    };
    return str.replace(/&amp;|&lt;|&gt;|&quot;|&#039;/g, function(m) { return map[m]; });
}


function Question(question) {
    this.questionText = decodeHtml(question.question);
    this.choices = [decodeHtml(question.incorrect_answers[0]),
        decodeHtml(question.incorrect_answers[1]),
        decodeHtml(question.incorrect_answers[2]),
        decodeHtml(question.correct_answer)
    ];
    this.correct_answer = decodeHtml(question.correct_answer);
}

client.connect().then(() =>
    app.listen(PORT, () => console.log(`Listening on port: ${PORT}`))
);