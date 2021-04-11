Drop table if exists users;
Create table if not exists users(id Primary Key serial not null,
name VARCHAR(200) not null,
email VARCHAR(200) not null,
password VARCHAR(200) not null);


Drop table if exists userProfile;
Create table if not exists userProfile (userResult Numeric);


Drop table if not exists quiz;
Create table if not exists (question text, optionA text, optionB text, optionC text, optionD text, correctAnswer text);