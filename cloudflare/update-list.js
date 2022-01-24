"use strict";
// thanks @danneu (in github) for the code i just yonked from there
// https://github.com/danneu/cloudflare-ip/blob/master/update-list.js

const fs = require("fs");
const nodePath = require("path");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const urls = {
  ipv4: "https://www.cloudflare.com/ips-v4",
  ipv6: "https://www.cloudflare.com/ips-v6",
};

const writeFile = (path, text) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, text, (err) => (err ? reject(err) : resolve()));
  });
};

var ipv4 = undefined;
var ipv6 = undefined;

const fetchIps = async (url) => {
  const res4 = await fetch("https://www.cloudflare.com/ips-v4");
  const text4 = await res4.text();
  ipv4 = text4.split("\n").filter(Boolean);
  const res6 = await fetch("https://www.cloudflare.com/ips-v6");
  const text6 = await res6.text();
  ipv6 = text6.split("\n").filter(Boolean);
};

module.exports.cfupdate = async () => {
  try {
    await fetchIps();
    if (ipv4.length === 0 || ipv6.length === 0) {
      throw new Error("the list was empty?");
    }
    const outPath = nodePath.join(__dirname, "ips.json");
    const json = JSON.stringify([...ipv4, ...ipv6], null, "  ");
    const currentFile = fs.readFileSync(outPath, "utf8");
    if (currentFile != json) {
      writeFile(outPath, json);
      return true;
    } else {
      return false;
    }
  } catch (e) {
    console.error(e);
  }
};
