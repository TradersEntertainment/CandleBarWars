const fs = require('fs');
const path = require('path');

const compiledPath = path.join(__dirname, 'BarWarsV2.json');
const frontendPath = path.join(__dirname, '../frontend/app/abi.json');

try {
    const compiledData = JSON.parse(fs.readFileSync(compiledPath, 'utf8'));
    const abi = compiledData.abi;

    fs.writeFileSync(frontendPath, JSON.stringify(abi, null, 4));
    console.log(`Successfully updated ABI at ${frontendPath}`);
} catch (error) {
    console.error('Error updating ABI:', error);
}
