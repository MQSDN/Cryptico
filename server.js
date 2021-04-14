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
let loginFlag = 0;

const client = new pg.Client({
    connectionString: DATABASE_URL,
});

const methodOverride = require('method-override');
app.use(methodOverride('_method'));
// ----------------------------------------------------------------------------------------------------


app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public/styles"));
app.get('/', (req, res) => {
    res.render('index', { username: username });
});

app.put('/update/:quiz_id', updateQuiz);
app.delete('/delete/:quiz_id', deleteQuiz);



// -----------------------------------------------------------------------------------------------------

app.get("/logout", (req, res) => {
    loginFlag = 0;
    res.render("index", { message: "You have logged out successfully", username: '' });
});

app.get('/scores', (req, res) => {
    if (loginFlag === 0) {
        res.render('login');
    }
    const safeValue = [email];
    const selectQuery = 'SELECT id FROM users WHERE email=$1;';
    let user_id = 0;
    client.query(selectQuery, safeValue).then(result => {
        user_id = result.rows[0].id;
        const safeValueR = [user_id];
        const selectQueryR = 'SELECT userresult FROM userProfile WHERE user_id=$1 ORDER BY userresult DESC ;';
        client.query(selectQueryR, safeValueR).then(result => {
            res.render('scores', { scores: result.rows, username: username });

        });
    })



});

app.get('/register', (req, res) => {
    res.render('register')
});

app.get('/about-us', (req, res) => {
    res.render('about-us', { username: username })
});
app.post('/register', handelRegister);

let email = '';
let username = '';

async function handelRegister(request, res) {

    try {
        email = request.body.email;
        const password = request.body.pass;
        const name = request.body.name;
        const password2 = request.body.pass2;
        const date = request.body.date;
        username = name;

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
            const InsetIntoDataBaseQuery = 'INSERT INTO users (name, email, pass , date) VALUES ($1, $2, $3, $4);';
            await client.query(InsetIntoDataBaseQuery, safeValues).then((results) => {

                let registerFlag = 1;
                res.render('login', { username: username });
            })
        }


    } catch (error) {
        errorHandler(error, res);
    }

}



// ---------------------------------


app.get('/login', (req, res) => {
    res.render('login', { username: username });
});

app.get('/addQuiz', (req, res) => {
    res.render('addQuiz', { results: [], username: username });
});

app.get('/profile', (req, res) => {
    if (loginFlag === 0) {
        res.render('login', { username: username });
    }
    getUserQuestions(res);
});

app.post('/login', handleLogin);

async function handleLogin(req, res) {
    try {
        email = req.body.email;
        const password = req.body.pass;
        const safe = [email];
        const getDataBaseQuery = 'SELECT * FROM users WHERE email=$1;';
        await client.query(getDataBaseQuery, safe).then(async(results) => {

            if (results) {
                const validation = await bcrypt.compare(password, results.rows[0].pass);
                let name = results.rows[0].name;

                if (validation) {
                    let safeValue = [email];
                    let selectQ = 'SELECT name FROM users WHERE email=$1';
                    client.query(selectQ, safeValue).then(result => {
                        username = result.rows[0].name;
                    });
                    loginFlag = 1;
                    res.render("quiz", {
                        questions: [],
                        email: email,
                        username: username
                    });

                } else {
                    res.send("Wrong PASS");
                };

            } else {
                res.send("No such data in the DB");
            };
        });
    } catch (error) {
        errorHandler(error, res)
    };
};



// ---------------------------------
app.post('/add', handleQuiz);


function handleQuiz(req, res) {
    const { question, optionA, optionB, optionC, optionD, correctAnswer, email } = req.body

    const safeValue = [email];
    const selectQuery = 'SELECT id FROM users WHERE email=$1;';

    let user_id = 0;
    client.query(selectQuery, safeValue).then(result => {
        user_id = result.rows[0].id;
        const safeValues = [user_id, question, optionA, optionB, optionC, optionD, correctAnswer];
        const sqlQuery = 'INSERT INTO quiz (user_id, question, optionA, optionB, optionC, optionD, correctAnswer) Values ($1, $2, $3, $4, $5, $6, $7);'

        client.query(sqlQuery, safeValues);
    });

    getUserQuestions(res);
    res.redirect('/profile');
}



// ----------------------------------------------------------------
app.post('/showAllQuestions', handleUserQuestions);

function handleUserQuestions(req, res) {
    const { value } = req.body;
    const correctAnswer = 'SELECT * FROM quiz;'
    let score = 0;

    client.query(correctAnswer).then(result => {
        res.render('profile', { results: result.rows, username: username })

    })
}


//////////////////////////////////////// Quizzes Part//////////////////////////////////////////////////////////////////////////////////////////
app.get('/start', (req, res) => {

    if (loginFlag === 0) {
        res.render('login');
    }
    let email = req.body.email;
    res.render('quiz', { questions: [], email: email, username: username });
})



app.post('/start', startQuiz);



function startQuiz(req, res) {

    let email = req.body.email;

    const queryObject = {
        category: req.body.category,
        difficulty: req.body.level
    }

    const url = `https://opentdb.com/api.php?amount=10&category=${queryObject.category}&difficulty=${queryObject.difficulty}&type=multiple`;

    superagent.get(url).then(resData => {

        const questions = resData.body.results.map(question => {
            return new Question(question);
        });
        res.render('quiz', { questions: questions, email: email, username: username });

    }).catch(error => {
        errorHandler(error, res);
    });
}


app.post('/submit', (req, res) => {

    let score = 0;
    let email = req.body.email;

    const safeValue = [email];
    const selectQuery = 'SELECT id FROM users WHERE email=$1;';


    let array = req.body.correctAnswer;

    if (req.body.q0 === array[0]) {
        score++
    }
    if (req.body.q1 === array[1]) {
        score++
    }
    if (req.body.q2 === array[2]) {
        score++
    }
    if (req.body.q3 === array[3]) {
        score++
    }
    if (req.body.q4 === array[4]) {
        score++
    }
    if (req.body.q5 === array[5]) {
        score++
    }
    if (req.body.q6 === array[6]) {
        score++
    }
    if (req.body.q7 === array[7]) {
        score++
    }
    if (req.body.q8 === array[8]) {
        score++
    }
    if (req.body.q9 === array[9]) {
        score++
    }

    score = score * 10;

    let user_id = 0;
    client.query(selectQuery, safeValue).then(result => {
        user_id = result.rows[0].id;
        const safeValues = [user_id, score];
        const sqlQuery = 'INSERT INTO userProfile (user_id,userResult ) Values ($1, $2);'

        client.query(sqlQuery, safeValues);

        const safeValueR = [user_id];
        const selectQueryR = 'SELECT userresult FROM userProfile WHERE user_id=$1 ORDER BY userresult DESC ;';
        client.query(selectQueryR, safeValueR).then(result => {
            res.render('scores', { scores: result.rows, username: username });

        });

    });
});

function decodeHtml(str) {
    var map = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#039;': "'",
        '&pi;': 'π',
        '&deg;': '°'
    };
    return str.replace(/&amp;|&lt;|&gt;|&quot;|&#039;|&pi;|&deg;/g, function(m) { return map[m]; });
}


function errorHandler(error, res) {
    res.render('error', { error: error });
}


function Question(question) {
    this.question = decodeHtml(question.question);
    this.choices = [decodeHtml(question.incorrect_answers[0]),
        decodeHtml(question.incorrect_answers[1]),
        decodeHtml(question.incorrect_answers[2]),
        decodeHtml(question.correct_answer)
    ];
    this.correctAnswer = decodeHtml(question.correct_answer);
}

function updateQuiz(req, res) {


    const id = req.params.quiz_id;
    const { question, optionA, optionB, optionC, optionD, correctAnswer } = req.body

    const safeValues = [question, optionA, optionB, optionC, optionD, correctAnswer, id];

    const updateQuery = 'UPDATE quiz SET question=$1, optionA=$2, optionB=$3, optionC=$4, optionD=$5,correctAnswer=$6 WHERE id=$7;';

    client.query(updateQuery, safeValues).then(() => {
        res.redirect('/profile');
    });

}


function deleteQuiz(req, res) {


    const id = req.params.quiz_id;

    let safeValues = [id];

    let deleteQuery = `DELETE FROM quiz WHERE id=$1;`;
    client.query(deleteQuery, safeValues).then(() => {
        res.redirect('/profile');
        // getUserQuestions(res);

    }).catch(error => {
        console.error('ERROR', error);
        res.status(404).send('Sorry , Something went wrong');
    });
}


client.connect().then(() =>
    app.listen(PORT, () => console.log(`Listening on port: ${PORT}`))
);

function getUserQuestions(res) {
    const getAllQuestions = 'SELECT * FROM quiz;'
    client.query(getAllQuestions).then(result => {
        if (result) {
            res.render('profile', { results: result.rows, username: username });
        }
    });
}