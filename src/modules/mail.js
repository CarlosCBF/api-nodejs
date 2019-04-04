const nodemailer = require("nodemailer");
const path = require("path");

const hbs = require("nodemailer-express-handlebars");

const { host, port, user, pass } = require("../config/mail");

const transport = nodemailer.createTransport({
  host,
  port,
  auth: { user, pass }
});

transport.use(
  "compile",
  hbs({
    viewEngine: {
      partialsDir: "some/path"
    },
    viewPath: path.resolve("./src/resources/mail/"),
    extName: ".html"
  })
);

module.exports = transport;
