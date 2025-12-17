const { ethers } = require("ethers");
require("dotenv").config({ path: "../.env" });

const wallet = new ethers.Wallet(process.env.BASE_PRIVATE_KEY);
console.log("Computed Address:", wallet.address);
