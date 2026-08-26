// Turns a password into a bcrypt hash for ADMIN_PASSWORD_HASH.
//   npm run hash-password -- "your-password"
const bcrypt = require('bcryptjs');

const password = process.argv[2];
if (!password) {
  console.error('Usage: npm run hash-password -- "your-password"');
  process.exit(1);
}
if (password.length < 10) {
  console.error('Use at least 10 characters. This guards remote control of a PC.');
  process.exit(1);
}

console.log(bcrypt.hashSync(password, 12));
