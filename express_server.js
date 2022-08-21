const { PORT, ID_LENGTH, CHARACTERS, ERROR_MESSAGES } = require('./constants');
const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();

app.use(cookieParser());
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

app.get("/login", (req, res) => {
  const userId = req.cookies['user_id'];
  const templateVars = {
    title: 'Login',
    user: users[userId],
  };
  res.render("user_login", templateVars);
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email);
  if (!user || password !== users[user]['password']) {
    res.status(403);
    res.redirect("/error/403");
    return;
  }
  res.cookie('user_id', users[user]['id']);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect("/login");
});

app.get("/register", (req, res) => {
  const userId = req.cookies['user_id'];
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
    password,
  };
  res.cookie('user_id', id);
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
  const userId = req.cookies['user_id'];
  const templateVars = {
    title: 'URLs',
    user: users[userId],
    urls: urlDatabase,
  };
  res.render('urls_index', templateVars);
});

app.get("/urls/new", (req, res) => {
  if (!isLoggedin(req)) {
    res.redirect("/login");
    return;
  }
  const userId = req.cookies['user_id'];
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
  const userId = req.cookies['user_id'];
  const templateVars = {
    title: 'URL',
    user: users[userId],
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
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
  urlDatabase[newId] = req.body.longURL;
  res.redirect(`/urls/${newId}`);
});

// Redirect to original url
app.get("/u/:id", (req, res) => {
  if (!isLoggedin(req)) {
    res.redirect("/login");
    return;
  }
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

// Delete a url
app.post("/urls/:id/delete", (req, res) => {
  if (!isLoggedin(req)) {
    res.redirect("/login");
    return;
  }
  const { id } = req.params;
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
  const { newLongURL } = req.body;
  urlDatabase[id] = newLongURL;
  res.redirect(`/urls/${id}`);
});

// display error page
app.get("/error/:error_code", (req, res) => {
  const errorCode = req.params.error_code;
  const userId = req.cookies['user_id'];
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

const generateRandomString = () => {
  let randomString = '';
  do {
    randomString = new Array(ID_LENGTH).fill(null).map(n => CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)]).join('');
  } while (randomString in urlDatabase);

  return randomString;
};

const getUserByEmail = (email) => {
  for (const user in users) {
    if (users[user]['email'] === email) {
      return user;
    }
  }
  return null;
};

const isLoggedin = (req) => {
  return req.cookies['user_id'] !== undefined;
};
