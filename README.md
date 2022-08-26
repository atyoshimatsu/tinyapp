# TinyApp Project

TinyApp is a full stack web application built with Node and Express that allows users to shorten long URLs (à la bit.ly).

## Final Product

### Index View
!["Screenshot of URLs Index"](https://github.com/atyoshimatsu/tinyapp/blob/main/docs/urls_index.png)

### Detail of URL
!["Screenshot of URLs detail"](https://github.com/atyoshimatsu/tinyapp/blob/main/docs/url_detail.png)

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
