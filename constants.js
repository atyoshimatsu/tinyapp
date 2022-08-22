const PORT = 8080;
const ID_LENGTH = 6;
const CHARACTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const ERROR_MESSAGES = {
  '400': 'The Email or password might be empty, or the email is already existing.',
  '403_INCORRECT': 'The Email or password is NOT correct, or the email is NOT existing.',
  '403_NO_ACCESS': 'You can not access this page.',
  '404': 'The page is NOT Found.',
};
const SESSION_KEYS = ['tiny_app_key'];

module.exports = {
  PORT,
  ID_LENGTH,
  CHARACTERS,
  ERROR_MESSAGES,
  SESSION_KEYS,
};
