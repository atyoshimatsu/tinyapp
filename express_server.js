const { PORT } = require('./constants');
require('dotenv').config();
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const express = require('express');
const methodOverride = require('method-override');
const cookieSession = require('cookie-session');
const {
  generateRandomString,
  getUserByEmail,
  isLoggedin,
  urlsForUser,
  canAccessURL,
  getUniqueVisitors,
  getErrorMessage,
} = require('./helpers');

const app = express();
app.use(morgan('dev'));
app.use(cookieSession({
  name: 'session',
  keys: [process.env.SECRET_KEY],
}));
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

const urlDatabase = {
  'b2xVn2': {
    longURL: 'http://www.lighthouselabs.ca',
    userId: 'userRandomID',
    createdDate: '8/21/2022',
    visitHistories:[
      { visitorId: 'f3t4gz', time: new Date() }
    ],
  },
  '9sm5xK': {
    longURL: 'http://www.google.com',
    userId: 'userRandomID',
    createdDate: '7/16/2021',
    visitHistories:[],
  },
  '4glap5': {
    longURL: 'http://www.example.com',
    userId: 'user2RandomID',
    createdDate: '4/27/2022',
    visitHistories:[],
  },
};

const users = {
  userRandomID: {
    id: 'userRandomID',
    email: 'user@example.com',
    password: '$2a$10$ebOP.1X6dOYQ4esjE1FL8.gjMq8/hNbyg476Fl30dtXUz3lPhlwzK',
  },
  user2RandomID: {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: '$2a$10$0rCd2gHhmcsqV/Age9AvKO4YIPRcosDRTebzR2GjTqDaFerQrFcYm',
  },
};

app.get('/login', (req, res) => {
  if (isLoggedin(req)) {
    res.redirect('/urls');
    return;
  }
  const userId = req.session.user_id;
  const templateVars = {
    title: 'Login',
    user: users[userId],
  };
  res.render('user_login', templateVars);
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (email === '' || password === '') {
    res.redirect('/error/400');
    return;
  }
  const user = getUserByEmail(email, users);
  if (!user || !bcrypt.compareSync(password, users[user]['password'])) {
    res.redirect('/error/401');
    return;
  }
  // eslint-disable-next-line camelcase
  req.session.user_id = users[user]['id']; // set userId to the cookie
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  // eslint-disable-next-line camelcase
  req.session.user_id = null;
  res.redirect('/login');
});

app.get('/register', (req, res) => {
  if (isLoggedin(req)) {
    res.redirect('/urls');
    return;
  }
  const userId = req.session.user_id;
  const templateVars = {
    title: 'Register',
    user: users[userId],
  };
  res.render('user_register', templateVars);
});

// Create new user
app.post('/register', (req, res) => {
  const { email, password } = req.body;
  if (email === '' || password === '' || getUserByEmail(email, users) !== undefined) {
    res.redirect('/error/400');
    return;
  }
  const id = generateRandomString(urlDatabase);
  users[id] = {
    id,
    email,
    password: bcrypt.hashSync(password),
  };
  // eslint-disable-next-line camelcase
  req.session.user_id = id; // set userId to the cookie
  res.redirect('/urls');
});

app.get('/', (req, res) => {
  if (!isLoggedin(req)) {
    res.redirect('/login');
    return;
  }
  res.redirect('/urls');
});

app.get('/urls', (req, res) => {
  if (!isLoggedin(req)) {
    res.redirect('/error/403');
    return;
  }
  const userId = req.session.user_id;
  const templateVars = {
    title: 'URLs',
    user: users[userId],
    urls: urlsForUser(userId, urlDatabase),
  };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  if (!isLoggedin(req)) {
    res.redirect('/login');
    return;
  }
  const userId = req.session.user_id;
  const templateVars = {
    title: 'New URL',
    user: users[userId],
  };
  res.render('urls_new', templateVars);
});

// Refer a url
app.get('/urls/:id', (req, res) => {
  if (!isLoggedin(req)) {
    res.redirect('/error/403');
    return;
  }
  const { id } = req.params;
  if (!canAccessURL(req, id, urlDatabase)) {
    res.redirect('/error/403');
    return;
  }
  const userId = req.session.user_id;
  const templateVars = {
    title: 'URL',
    user: users[userId],
    id,
    url: {
      ...urlDatabase[id],
      uniqueVisitors: getUniqueVisitors(id, urlDatabase),
    }
  };
  res.render('urls_show', templateVars);
});

// Create new url
app.post('/urls', (req, res) => {
  if (!isLoggedin(req)) {
    res.redirect('/error/403');
    return;
  }
  const newId = generateRandomString(urlDatabase);
  const date = new Date();
  urlDatabase[newId] = {
    longURL: req.body.longURL,
    userId: req.session.user_id,
    createdDate: date.toLocaleDateString('en-US'),
    visitHistories: [],
  };
  res.redirect(`/urls/${newId}`);
});

// Redirect to original url
app.get('/u/:id', (req, res) => {
  const { id } = req.params;
  if (!(id in urlDatabase)) {
    res.redirect('/error/404');
    return;
  }
  if (!req.session.visitor_id) {
    const visitorId = generateRandomString(urlDatabase);
    // eslint-disable-next-line camelcase
    req.session.visitor_id = visitorId; // set visitor_id to the cookie
  }
  // track visit history
  urlDatabase[id]['visitHistories'].push({ visitorId: req.session.visitor_id, time: new Date() });
  const longURL = urlDatabase[id]['longURL'];
  res.redirect(longURL);
});

// Delete a url
app.delete('/urls/:id/delete', (req, res) => {
  if (!isLoggedin(req)) {
    res.redirect('/error/403');
    return;
  }
  const { id } = req.params;
  if (!canAccessURL(req, id, urlDatabase)) {
    res.redirect('/error/403');
    return;
  }
  delete urlDatabase[id];
  res.redirect('/urls');
});

// Update a existing url
app.put('/urls/:id', (req, res) => {
  if (!isLoggedin(req)) {
    res.redirect('/error/403');
    return;
  }
  const { id } = req.params;
  if (!canAccessURL(req, id, urlDatabase)) {
    res.redirect('/error/403');
    return;
  }
  const { newLongURL } = req.body;
  urlDatabase[id]['longURL'] = newLongURL;
  res.redirect('/urls');
});

// display error page
app.get('/error/:error_code', (req, res) => {
  const statusCode = req.params.error_code;
  const referer = req.get('Referer');
  console.log(referer);
  const errorMessage = getErrorMessage(statusCode, referer);
  const userId = req.session.user_id;
  const templateVars = {
    title: 'Error',
    user: users[userId],
    errorMessage,
  };
  res.status(statusCode).render('40x_error', templateVars);
});

// return error page to all requests except above routes
app.all('*', (req,res) => {
  res.redirect('/error/404');
});

app.listen(PORT, () => {
  console.log(`Tiny app listening on port ${PORT}!`);
});
