
Drop table if exists users CASCADE;
Create table users(id serial primary key not null,
name VARCHAR(200) not null,
email VARCHAR(200) not null unique,
pass VARCHAR(200) not null,
date date not null
);


Drop table if exists userProfile CASCADE;
Create table   userProfile (userResult Numeric);



Drop table if exists quiz CASCADE;
Create table quiz (id serial primary key not null,
user_id INT, 
question text, 
optionA text, 
optionB text, 
optionC text, 
optionD text, 
correctAnswer text,
CONSTRAINT FK_user_id FOREIGN KEY (user_id)
    REFERENCES users(id));

