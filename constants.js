const PORT = 8080;
const ID_LENGTH = 6;
const CHARACTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const ERROR_MESSAGES = {
  '400': {
    register: 'The Email or password might be empty, or the email is already existing.',
    login: 'The Email or password might be empty.',
  },
  '401': 'The Email or password is NOT correct, or the email is NOT existing.',
  '403': 'You can not access this page.',
  '404': 'The page is NOT Found.',
};

module.exports = {
  PORT,
  ID_LENGTH,
  CHARACTERS,
  ERROR_MESSAGES,
};
