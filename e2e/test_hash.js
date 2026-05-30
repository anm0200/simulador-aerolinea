const bcrypt = require("bcryptjs");

const hash = "$2b$10$OqkN9kP63eCg/cXY.T/rK.5qE0wV05B/m9gCj1TqfXpT2xZt2V2d2";
const password = "E2E_Admin123!";

bcrypt.compare(password, hash, (err, res) => {
  console.log("MATCH:", res);
});
