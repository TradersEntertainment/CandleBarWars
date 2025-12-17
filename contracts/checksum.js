const { getAddress } = require('ethers');
const badAddress = '0x83e20B37f3747765E470c1D981DcF50646193E3d';
try {
    console.log("Checksum:", getAddress(badAddress.toLowerCase()));
} catch (e) {
    console.error(e);
}
