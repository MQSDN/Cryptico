Drop table if exists users;
Create table users(id SERIAL PRIMARY KEY not null,
name VARCHAR(200) not null,
email VARCHAR(200) not null unique,
pass VARCHAR(200) not null,
date date not null
);


Drop table if exists userProfile;
Create table   userProfile (userResult Numeric);


Drop table if exists quiz;
Create table quiz (user_id INT, question text, optionA text, optionB text, optionC text, optionD text, correctAnswer text, user_email VARCHAR(200));



INSERT INTO quiz(user_email) SELECT DISTINCT email FROM users;
UPDATE quiz SET user_id=user(id) FROM (SELECT * FROM users) AS user WHERE quiz(user_email) = user(email);
ALTER TABLE quiz ADD CONSTRAINT fk_users FOREIGN KEY (user_id) REFERENCES users(id);