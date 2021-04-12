Drop table if exists users;
Create table users(id serial primary key not null,
name VARCHAR(200) not null,
email VARCHAR(200) not null unique,
pass VARCHAR(200) not null,
date date not null
);


Drop table if exists userProfile;
Create table   userProfile (userResult Numeric);


Drop table if exists quiz;
Create table quiz  (user_id int ,question text, optionA text, optionB text, optionC text, optionD text, correctAnswer text  );