"use strict";
// thanks to @danneu (in github) for the code i just yonked from there
// https://github.com/danneu/cloudflare-ip/blob/master/index.js
const fs = require("fs");
const nodePath = require("path");
// 3rd
const Address4 = require("ip-address").Address4;
const Address6 = require("ip-address").Address6;
const ms = require("ms");
const cfupdate = require("./update-list");

const listPath = nodePath.join(__dirname, "ips.json");
var cloudflareIps = JSON.parse(fs.readFileSync(listPath, "utf8")).map(
  intoAddress
);

//automatically check if cf has updated its updated its ip list if yes then update the list in mem and file (runs every 3 hours)
setInterval(async () => {
  const ifcfhasanupdate = await cfupdate();
  if (ifcfhasanupdate) {
    cloudflareIps = JSON.parse(fs.readFileSync(listPath, "utf8")).map(
      intoAddress
    );
    console.log('Cloudflare IP list updated');
  }
}, ms("3hr"));

// returns undefined | Address4 | Address6
function intoAddress(str) {
  if (typeof str === "string") str = str.trim();
  let ip = new Address6(str);
  if (ip.v4 && !ip.valid) {
    ip = new Address4(str);
  }
  if (!ip.valid) return;
  return ip;
}

// returns bool
module.exports = function (testIpString) {
  if (!testIpString) return false;
  const testIp = intoAddress(testIpString);
  if (!testIp) return false;
  return cloudflareIps.some((cf) => testIp.isInSubnet(cf));
};
