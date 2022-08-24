const { PORT, ERROR_MESSAGES, SESSION_KEYS } = require('./constants');
const morgan = require('morgan');
const bcrypt = require("bcryptjs");
const express = require("express");
const methodOverride = require('method-override');
const cookieSession = require('cookie-session');
const {
  generateRandomString,
  getUserByEmail,
  isLoggedin,
  urlsForUser,
  canAccessURL,
} = require('./helpers');

const app = express();
app.use(morgan('tiny'));
app.use(cookieSession({
  name: 'session',
  keys: SESSION_KEYS,
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(methodOverride('_method'));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userId: "userRandomID",
    visitHistories:[],
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userId: "userRandomID",
    visitHistories:[],
  },
  "4glap5": {
    longURL: "http://www.example.com",
    userId: "user2RandomID",
    visitHistories:[],
  },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: '$2a$10$ebOP.1X6dOYQ4esjE1FL8.gjMq8/hNbyg476Fl30dtXUz3lPhlwzK',
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: '$2a$10$0rCd2gHhmcsqV/Age9AvKO4YIPRcosDRTebzR2GjTqDaFerQrFcYm',
  },
};

app.get("/login", (req, res) => {
  if (isLoggedin(req)) {
    res.redirect("/urls");
    return;
  }
  const userId = req.session.user_id;
  const templateVars = {
    title: 'Login',
    user: users[userId],
  };
  res.render("user_login", templateVars);
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email, users);
  if (email === '' || password === '') {
    res.status(400);
    res.redirect("/error/400_LOGIN");
    return;
  }
  if (!user || !bcrypt.compareSync(password, users[user]['password'])) {
    res.status(403);
    res.redirect("/error/403_INCORRECT");
    return;
  }
  // eslint-disable-next-line camelcase
  req.session.user_id = users[user]['id']; // set userId to the cookie
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.get("/register", (req, res) => {
  if (isLoggedin(req)) {
    res.redirect("/urls");
    return;
  }
  const userId = req.session.user_id;
  const templateVars = {
    title: 'Register',
    user: users[userId],
  };
  res.render("user_register", templateVars);
});

// Create new user
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (email === '' || password === '' || getUserByEmail(email, users) !== undefined) {
    res.status(400);
    res.redirect("/error/400_REGISTER");
    return;
  }
  const id = generateRandomString(urlDatabase);
  users[id] = {
    id,
    email,
    password: bcrypt.hashSync(password, 10),
  };
  // eslint-disable-next-line camelcase
  req.session.user_id = id; // set userId to the cookie
  res.redirect("/urls");
});

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls/json", (req, res) => {
  res.send(JSON.stringify(urlDatabase));
});

app.get("/urls", (req, res) => {
  if (!isLoggedin(req)) {
    res.redirect("/login");
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

app.get("/urls/new", (req, res) => {
  if (!isLoggedin(req)) {
    res.redirect("/login");
    return;
  }
  const userId = req.session.user_id;
  const templateVars = {
    title: 'New URL',
    user: users[userId],
  };
  res.render("urls_new", templateVars);
});

// Refer a url
app.get("/urls/:id", (req, res) => {
  if (!isLoggedin(req)) {
    res.redirect("/login");
    return;
  }
  const { id } = req.params;
  if (!canAccessURL(req, id, urlDatabase)) {
    res.redirect("/error/403_NO_ACCESS");
    return;
  }
  const userId = req.session.user_id;
  const templateVars = {
    title: 'URL',
    user: users[userId],
    id,
    url: urlDatabase[id],
  };
  res.render("urls_show", templateVars);
});

// Create new url
app.post("/urls", (req, res) => {
  if (!isLoggedin(req)) {
    res.redirect("/login");
    return;
  }
  const newId = generateRandomString(urlDatabase);
  urlDatabase[newId] = {
    longURL: req.body.longURL,
    userId: req.session.user_id,
    visitHistories: [],
  };
  res.redirect(`/urls/${newId}`);
});

// Redirect to original url
app.get("/u/:id", (req, res) => {
  const { id } = req.params;
  if (!(id in urlDatabase)) {
    res.redirect("/error/404");
    return;
  }
  if (!req.session.visitor_id) {
    const visitorId = generateRandomString(urlDatabase);
    // eslint-disable-next-line camelcase
    req.session.visitor_id = visitorId; // set visitor_id to the cookie
  }
  urlDatabase[id]['visitHistories'].push({ visitorId: req.session.visitor_id, time: new Date() });
  const longURL = urlDatabase[id]["longURL"];
  res.redirect(longURL);
});

// Delete a url
app.delete("/urls/:id/delete", (req, res) => {
  if (!isLoggedin(req)) {
    res.redirect("/login");
    return;
  }
  const { id } = req.params;
  if (!canAccessURL(req, id, urlDatabase)) {
    res.redirect("/error/403_NO_ACCESS");
    return;
  }
  delete urlDatabase[id];
  res.redirect('/urls');
});

// Update a existing url
app.put("/urls/:id", (req, res) => {
  if (!isLoggedin(req)) {
    res.redirect("/login");
    return;
  }
  const { id } = req.params;
  if (!canAccessURL(req, id, urlDatabase)) {
    res.redirect("/error/403_NO_ACCESS");
    return;
  }
  const { newLongURL } = req.body;
  urlDatabase[id]["longURL"] = newLongURL;
  res.redirect(`/urls/${id}`);
});

// display error page
app.get("/error/:error_code", (req, res) => {
  const errorCode = req.params.error_code;
  const userId = req.session.user_id;
  const templateVars = {
    title: 'Error',
    user: users[userId],
    errorMessage: ERROR_MESSAGES[errorCode],
  };
  res.render("40x_error", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
