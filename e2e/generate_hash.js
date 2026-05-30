const bcrypt = require("bcryptjs");
const password = "E2E_Admin123!";
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(password, salt);
console.log("HASH:", hash);
