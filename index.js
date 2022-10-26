const express = require("express");
const body_parser = require("body-parser");
const pl = require("tau-prolog");
require("dotenv").config();

const app = express().use(body_parser.json());
const session = pl.create(1000);
session.query("fruit(apple).")
const show = x => console.log(session.format_answer(x));
const program =
`:- use_module(library(lists)).
dog(fido).
dog(rover).
dog(henry).
cat(felix).
cat(michael).
cat(jane).
animal(X):- dog(X).
animal(X):- cat(X).
`;
session.consult(program);


const item = process.argv[2];

app.listen(3000, () => {
  console.log("webhook is listening");
});

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// you well take full url. from huroki.
app.get("/webhook", (req, res) => {
  let body_param = req.body;
  console.log(JSON.stringify(body_param, null, 2));
});

app.post("/webhook", (req, res) => {
  let body_param = req.body;
  console.log(JSON.stringify(body_param, null, 2));
  });
// app.get("", (req, res) => {});

app.get("/", (req, res) => {
  let ans = "";
  session.query("animal(X).")
  session.answers((x) => {
    ans = pl.format_answer(x);
    // console.log(JSON.stringify(ans, null, 0));
    });
    console.log(ans);
   return res.status(200).send(ans);
});
