# TinyApp Project

TinyApp is a full stack web application built with Node and Express that allows users to shorten long URLs (à la bit.ly).

## Final Product

### Index View
[![Image from Gyazo](https://i.gyazo.com/69b947a90d0a3131b8b17664e0d1a0db.png)](https://gyazo.com/69b947a90d0a3131b8b17664e0d1a0db)

### Detail of URL
[![Image from Gyazo](https://i.gyazo.com/0b3ab569f9ca4ca9d7dbc6e954fc2022.png)](https://gyazo.com/0b3ab569f9ca4ca9d7dbc6e954fc2022)

## Dependencies
- bcryptjs
- cookie-parser
- cookie-session
- dotenv
- ejs
- express
- method-override
- morgan

## DevDependencies
- chai
- mocha
- nodemon

## Getting Started

- Install all dependencies (using the `npm install` command).
- Make `.env` file in the root directory and define `SECRET_KEY`.
```.env
SECRET_KEY='tiny_app_key'
```
- Run the development web server using the `npm start` command.
