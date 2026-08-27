// Turns a password into a bcrypt hash for ADMIN_PASSWORD_HASH.
//   npm run hash-password -- "your-password"
const bcrypt = require('bcryptjs');

const password = process.argv[2];
if (!password) {
  console.error('Usage: npm run hash-password -- "your-password"');
  process.exit(1);
}
if (password.length < 10) {
  console.error(
    'Use at least 10 characters. This password is the only thing standing ' +
      'between a stranger and the admin panel, and whoever reaches that ' +
      'decides where every Download button on the site points.',
  );
  process.exit(1);
}

console.log(bcrypt.hashSync(password, 12));
