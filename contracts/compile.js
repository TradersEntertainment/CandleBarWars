const fs = require('fs');
const path = require('path');
const solc = require('solc');

function findImports(importPath) {
    if (importPath.startsWith('@openzeppelin')) {
        const nodeModulesPath = path.resolve(__dirname, 'node_modules', importPath);
        return { contents: fs.readFileSync(nodeModulesPath, 'utf8') };
    } else {
        return { error: 'File not found' };
    }
}

const CONTRACT_FILENAME = 'BarWarsV2.sol';
const CONTRACT_NAME = 'BarWarsV2';
const contractPath = path.resolve(__dirname, 'contracts', CONTRACT_FILENAME);
const source = fs.readFileSync(contractPath, 'utf8');

const input = {
    language: 'Solidity',
    sources: {
        [CONTRACT_FILENAME]: {
            content: source,
        },
    },
    settings: {
        outputSelection: {
            '*': {
                '*': ['*'],
            },
        },
    },
};

console.log(`Compiling ${CONTRACT_FILENAME}...`);
const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

if (output.errors) {
    output.errors.forEach((err) => {
        console.error(err.formattedMessage);
    });
    // Check if errors are fatal
    const hasError = output.errors.some(err => err.severity === 'error');
    if (hasError) process.exit(1);
}

const contract = output.contracts[CONTRACT_FILENAME][CONTRACT_NAME];
const artifact = {
    abi: contract.abi,
    bytecode: contract.evm.bytecode.object,
};

fs.writeFileSync(path.resolve(__dirname, `${CONTRACT_NAME}.json`), JSON.stringify(artifact, null, 2));
console.log(`Compilation successful! Wrote ${CONTRACT_NAME}.json`);
