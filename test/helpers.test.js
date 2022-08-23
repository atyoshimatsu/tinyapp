const { assert } = require('chai');
const { ID_LENGTH } = require('../constants');
const {
  generateRandomString,
  getUserByEmail,
  isLoggedin,
  urlsForUser,
  canAccessURL,
} = require('../helpers');

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

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('generateRandomString', () => {
  it('should return rondom string', () => {
    const randomString = generateRandomString(urlDatabase);
    assert.equal(typeof randomString, 'string');
    assert.equal(randomString.length, ID_LENGTH);
  });

  it('should not exsiting in the urlDatabase', () => {
    const randomString = generateRandomString(urlDatabase);
    assert.isFalse(randomString in urlDatabase);
  });
});

describe('getUserByEmail', () => {
  it('should return a user with valid email', () => {
    const user = getUserByEmail("user@example.com", testUsers)
    const expectedUserID = "userRandomID";
    assert.equal(user, expectedUserID);
  });
  it('should return undefined with invalid email', () => {
    const user = getUserByEmail("test@example.com", testUsers)
    assert.isUndefined(user);
  });
});

describe('urlsForUser', () => {
  it('should return urls that are belonged a given user', () => {
    const urls = urlsForUser('userRandomID', urlDatabase);
    const expectedUrls = {
      "b2xVn2": {
        longURL: "http://www.lighthouselabs.ca",
        userId: "userRandomID",
      },
      "9sm5xK": {
        longURL: "http://www.google.com",
        userId: "userRandomID",
      },
    };
    assert.deepEqual(urls, expectedUrls);
  });

  it('should return empty object for not existing user', () => {
    const urls = urlsForUser('user3RandomID', urlDatabase);
    assert.deepEqual(urls, {});
  });
});
