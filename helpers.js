const { ID_LENGTH, CHARACTERS } = require('./constants');

/**
 * @return {string} randomString
 */
const generateRandomString = (urlDatabase) => {
  let randomString = '';
  do {
    // eslint-disable-next-line no-unused-vars
    randomString = new Array(ID_LENGTH).fill(null).map(n => CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)]).join('');
  } while (randomString in urlDatabase);

  return randomString;
};

/**
 * @param {string} email
 * @returns {object | undefined} user | undefined
 */
const getUserByEmail = (email, userDataBase) => {
  for (const user in userDataBase) {
    if (userDataBase[user]['email'] === email) {
      return user;
    }
  }
  return undefined;
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
const urlsForUser = (userId, urlDatabase) => {
  const urls = {};
  for (const urlId in urlDatabase) {
    if (urlDatabase[urlId]['userId'] === userId) {
      urls[urlId] = {
        longURL: urlDatabase[urlId]['longURL'],
        userId,
        visitHistories: urlDatabase[urlId]['visitHistories'],
      };
    }
  }
  return urls;
};

/**
 * @param {Request} req
 * @param {string} urlId
 * @param {pbject} urlDatabase
 * @returns {boolean}
 */
const canAccessURL = (req, urlId, urlDatabase) => {
  const userId = req.session.user_id;
  return urlId in urlsForUser(userId, urlDatabase);
};

module.exports = {
  generateRandomString,
  getUserByEmail,
  isLoggedin,
  urlsForUser,
  canAccessURL,
};
