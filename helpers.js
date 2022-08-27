const { ID_LENGTH, CHARACTERS, ERROR_MESSAGES } = require('./constants');

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
  return req.session.user_id !== undefined && req.session.user_id !== null;
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
        createdDate: urlDatabase[urlId]['createdDate'],
        visitHistories: urlDatabase[urlId]['visitHistories'],
        uniqueVisitors: getUniqueVisitors(urlId, urlDatabase),
      };
    }
  }
  return urls;
};

/**
 * @param {Request} req
 * @param {string} urlId
 * @param {object} urlDatabase
 * @returns {boolean}
 */
const canAccessURL = (req, urlId, urlDatabase) => {
  const userId = req.session.user_id;
  return urlId in urlsForUser(userId, urlDatabase);
};

/**
 * @param {string} urlId
 * @param {object} urlDatabase
 * @returns {number} uniqueVisitors
 */
const getUniqueVisitors = (urlId, urlDatabase) => {
  const visitors = urlDatabase[urlId]["visitHistories"].map(h => h['visitorId']);
  const uniqueVisitors = new Set(visitors);
  return uniqueVisitors.size;
};

/**
 * @param {string} statusCode
 * @param {sring} referer
 * @returns {string} errorMessage
 */
const getErrorMessage = (statusCode, referer) => {
  if (statusCode === '400' && referer.includes('login')) {
    return ERROR_MESSAGES['400']['login'];
  }

  if (statusCode === '400' && referer.includes('register')) {
    return ERROR_MESSAGES['400']['register'];
  }


  if (statusCode === '401') {
    return ERROR_MESSAGES['401'];
  }

  if (statusCode === '403') {
    return ERROR_MESSAGES['403'];
  }

  return ERROR_MESSAGES['404'];
};

module.exports = {
  generateRandomString,
  getUserByEmail,
  isLoggedin,
  urlsForUser,
  canAccessURL,
  getUniqueVisitors,
  getErrorMessage,
};
