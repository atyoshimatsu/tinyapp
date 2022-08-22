const { PORT, ID_LENGTH, CHARACTERS, ERROR_MESSAGES, SESSION_KEYS } = require('./constants');
const bcrypt = require("bcryptjs");
const express = require("express");
const cookieSession = require('cookie-session');
const app = express();

app.use(cookieSession({
  name: 'session',
  keys: SESSION_KEYS,
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userId: "userRandomID",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userId: "userRandomID",
  },
  "4glap5": {
    longURL: "http://www.example.com",
    userId: "user2RandomID",
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
  const user = getUserByEmail(email);
  if (!user || !bcrypt.compareSync(password, users[user]['password'])) {
    res.status(403);
    res.redirect("/error/403_INCORRECT");
    return;
  }
  // eslint-disable-next-line camelcase
  req.session.user_id = users[user]['id'];
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
  if (email === '' || password === '' || getUserByEmail(email) !== null) {
    res.status(400);
    res.redirect("/error/400");
    return;
  }
  const id = generateRandomString();
  users[id] = {
    id,
    email,
    password: bcrypt.hashSync(password, 10),
  };
  // eslint-disable-next-line camelcase
  req.session.user_id = id; // set id to the cookie
  res.redirect("/urls");
});

app.get("/", (req, res) => {
  res.redirect("/urls");
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
    urls: urlsForUser(userId),
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
  if (!canAccessURL(req, id)) {
    res.redirect("/error/403_NO_ACCESS");
    return;
  }
  const userId = req.session.user_id;
  const templateVars = {
    title: 'URL',
    user: users[userId],
    id,
    longURL: urlDatabase[req.params.id]["longURL"],
  };
  res.render("urls_show", templateVars);
});

// Create new url
app.post("/urls", (req, res) => {
  if (!isLoggedin(req)) {
    res.redirect("/login");
    return;
  }
  const newId = generateRandomString();
  urlDatabase[newId] = {
    longURL: req.body.longURL,
    userId: req.session.user_id,
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
  const longURL = urlDatabase[req.params.id]["longURL"];
  res.redirect(longURL);
});

// Delete a url
app.post("/urls/:id/delete", (req, res) => {
  if (!isLoggedin(req)) {
    res.redirect("/login");
    return;
  }
  const { id } = req.params;
  if (!canAccessURL(req, id)) {
    res.redirect("/error/403_NO_ACCESS");
    return;
  }
  delete urlDatabase[id];
  res.redirect('/urls');
});

// Update a existing url
app.post("/urls/:id", (req, res) => {
  if (!isLoggedin(req)) {
    res.redirect("/login");
    return;
  }
  const { id } = req.params;
  if (!canAccessURL(req, id)) {
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

/**
 * @return {string} randomString
 */
const generateRandomString = () => {
  let randomString = '';
  do {
    // eslint-disable-next-line no-unused-vars
    randomString = new Array(ID_LENGTH).fill(null).map(n => CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)]).join('');
  } while (randomString in urlDatabase);

  return randomString;
};

/**
 * @param {string} email
 * @returns {object | null} user | null
 */
const getUserByEmail = (email) => {
  for (const user in users) {
    if (users[user]['email'] === email) {
      return user;
    }
  }
  return null;
};

/**
 * @param {Request} req
 * @returns {boolean}
 */
const isLoggedin = (req) => {
  return req.session.user_id !== undefined;
};

/**
 * @param {string} userId
 * @returns {object} urls
 */
const urlsForUser = (userId) => {
  const urls = {};
  for (const urlId in urlDatabase) {
    if (urlDatabase[urlId]['userId'] === userId) {
      urls[urlId] = {
        longURL: urlDatabase[urlId]['longURL'],
        userId,
      };
    }
  }
  return urls;
};

/**
 * @param {Request} req
 * @param {string} urlId
 * @returns {boolean}
 */
const canAccessURL = (req, urlId) => {
  const userId = req.session.user_id;
  return urlId in urlsForUser(userId);
};
