var fs = require("fs");
var path = require("path");
var src = fs.readFileSync(path.join(__dirname, "..", "js", "fiveps-wizard.js"), "utf8");
var window = {};
eval(src);

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var date = window.kindelFivePsParseDate;
var people = window.kindelFivePsParsePeople;

var may = date("Deliver foo by May 2027");
assert(may && may.kind === "month" && may.label === "May 2027", "May 2027 from purpose");

var day = date("ship the garden by June 15, 2027");
assert(day && day.kind === "day" && day.iso === "2027-06-15", "June 15, 2027");

var iso = date("launch by 2027-05-01");
assert(iso && iso.iso === "2027-05-01", "ISO date");

var q = date("done by Q2 2027");
assert(q && q.kind === "quarter" && q.label === "Q2 2027", "quarter");

var fall = date("launch by fall 2010");
assert(fall && fall.kind === "season" && fall.label === "Fall 2010", "season");

var year = date("finish by 2028");
assert(year && year.kind === "year" && year.label === "2028", "bare year");

var crew = people("me (owner), sally (engineering), fred (pm), bob (accounting/informed)");
assert(crew.length === 4, "four people");
assert(crew[0].name === "me" && crew[0].role === "owner", "me owner");
assert(crew[3].name === "bob" && crew[3].role === "accounting/informed", "bob informed");

console.log("ok");
