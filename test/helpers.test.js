const { assert } = require('chai');
const { ID_LENGTH } = require('../constants');
const {
  generateRandomString,
  getUserByEmail,
  isLoggedin,
  urlsForUser,
  canAccessURL,
  getUniqueVisitors,
  getErrorMessage,
} = require('../helpers');

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userId: "userRandomID",
    createdDate: "8/21/2022",
    visitHistories: [
      { visitorId: 'eiG484', time: '2021-12-09T00:19:09.556Z' },
      { visitorId: 'L0hnVt', time: '2022-02-15T00:05:35.937Z' },
      { visitorId: 'eiG484', time: '2022-05-28T00:19:41.149Z' },
    ],
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userId: "userRandomID",
    createdDate: "7/16/2021",
    visitHistories: [],
  },
  "4glap5": {
    longURL: "http://www.example.com",
    userId: "user2RandomID",
    createdDate: "4/27/2022",
    visitHistories: [],
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
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.equal(user, expectedUserID);
  });
  it('should return undefined with invalid email', () => {
    const user = getUserByEmail("test@example.com", testUsers);
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
        createdDate: "8/21/2022",
        visitHistories: [
          { visitorId: 'eiG484', time: '2021-12-09T00:19:09.556Z' },
          { visitorId: 'L0hnVt', time: '2022-02-15T00:05:35.937Z' },
          { visitorId: 'eiG484', time: '2022-05-28T00:19:41.149Z' },
        ],
        uniqueVisitors: 2,
      },
      "9sm5xK": {
        longURL: "http://www.google.com",
        userId: "userRandomID",
        createdDate: "7/16/2021",
        visitHistories: [],
        uniqueVisitors: 0,
      },
    };
    assert.deepEqual(urls, expectedUrls);
  });

  it('should return empty object for no existing user', () => {
    const urls = urlsForUser('user3RandomID', urlDatabase);
    assert.deepEqual(urls, {});
  });
});

describe('isLoggedin', () => {
  it('should return true if a user is loggedin', () => {
    // eslint-disable-next-line camelcase
    const mockReq = { session: { user_id: 'userRandomID' } };
    const loggedin = isLoggedin(mockReq);
    assert.isTrue(loggedin);
  });

  it('should return false if a user_id is undefined', () => {
    // eslint-disable-next-line camelcase
    const mockReq = { session: { user_id: undefined } };
    const loggedin = isLoggedin(mockReq);
    assert.isFalse(loggedin);
  });

  it('should return false if a user_id is null', () => {
    // eslint-disable-next-line camelcase
    const mockReq = { session: { user_id: null } };
    const loggedin = isLoggedin(mockReq);
    assert.isFalse(loggedin);
  });
});

describe('canAccessURL', () => {
  const urlId = 'b2xVn2';
  it('should return true if the user has the given url', () => {
    // eslint-disable-next-line camelcase
    const mockReq = { session: { user_id: 'userRandomID' } };
    const access = canAccessURL(mockReq, urlId, urlDatabase);
    assert.isTrue(access);
  });

  it('should return false if the user dose not have the given url', () => {
    // eslint-disable-next-line camelcase
    const mockReq = { session: { user_id: 'user2RandomID' } };
    const access = canAccessURL(mockReq, urlId, urlDatabase);
    assert.isFalse(access);
  });
});

describe('getUniqueVisitors', () => {
  it('should return 2 for urlId "b2xVn2"', () => {
    const urlId = 'b2xVn2';
    const uniqueVisitors = getUniqueVisitors(urlId, urlDatabase);
    assert.equal(uniqueVisitors, 2);
  });

  it('should return 0 for urlId "9sm5xK"', () => {
    const urlId = '9sm5xK';
    const uniqueVisitors = getUniqueVisitors(urlId, urlDatabase);
    assert.equal(uniqueVisitors, 0);
  });
});

describe('getErrorMessage', () => {
  it('should return proper error message for statusCode 400 and referer "/register" ', () => {
    const statusCode = '400';
    const referer = 'http://www.example.com/register';
    const errorMessage = getErrorMessage(statusCode, referer);
    const expectedMessage = 'The Email or password might be empty, or the email is already existing.';
    assert.equal(errorMessage, expectedMessage);
  });

  it('should return proper error message for statusCode 400 and referer "/login" ', () => {
    const statusCode = '400';
    const referer = 'http://www.example.com/login';
    const errorMessage = getErrorMessage(statusCode, referer);
    const expectedMessage = 'The Email or password might be empty.';
    assert.equal(errorMessage, expectedMessage);
  });

  it('should return proper error message for statusCode 401 and referer "/login" ', () => {
    const statusCode = '401';
    const referer = 'http://www.example.com/login';
    const errorMessage = getErrorMessage(statusCode, referer);
    const expectedMessage = 'The Email or password is NOT correct, or the email is NOT existing.';
    assert.equal(errorMessage, expectedMessage);
  });

  it('should return proper error message for statusCode 403 and referer undefined ', () => {
    const statusCode = '403';
    const referer = undefined;
    const errorMessage = getErrorMessage(statusCode, referer);
    const expectedMessage = 'You can not access this page.';
    assert.equal(errorMessage, expectedMessage);
  });

  it('should return proper error message for statusCode 404 and referer undefined ', () => {
    const statusCode = '404';
    const referer = undefined;
    const errorMessage = getErrorMessage(statusCode, referer);
    const expectedMessage = 'The page is NOT Found.';
    assert.equal(errorMessage, expectedMessage);
  });
});
