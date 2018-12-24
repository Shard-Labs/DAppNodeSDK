const expect = require('chai').expect;
const fs = require('fs');
const generatePublishTx = require('../../src/methods/generatePublishTx');
const rmSafe = require('../rmSafe');
const mkdirSafe = require('../mkdirSafe');

// This test will create the following fake files
// ./dappnode_package.json  => fake manifest
// ./dnp_0.0.0/             => build directory
//
// Then it will expect the function to generate transaction data
// and output it to the console and to ./dnp_0.0.0/deploy.txt

describe('generatePublishTx', () => {
  const manifest = {
    name: 'admin.dnp.dappnode.eth',
    version: '0.1.0',
  };
  const manifestPath = './dappnode_package.json';
  const buildDir = 'dnp_0.0.0';
  const deployTextPath = `${buildDir}/deploy.txt`;

  before(async () => {
    await rmSafe(manifestPath);
    await rmSafe(buildDir);
    fs.writeFileSync(manifestPath, JSON.stringify(manifest));
    await mkdirSafe(buildDir);
  });

  it('Should generate a publish TX', async () => {
    const txData = await generatePublishTx({
      manifestIpfsPath: '/ipfs/Qm',
      buildDir,
      developerAddress: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
      ethProvider: 'infura',
    });
    expect(txData).to.be.an('object');
    expect(txData).to.deep.include({
      'To': '0x266BFdb2124A68beB6769dC887BD655f78778923',
      'Value': 0,
      'Gas limit': 1100000,
    });
    // I am not sure if the Data property will be the same
    expect(txData.Data).to.be.a('string');
  }).timeout(20000);

  after(async () => {
    await rmSafe(manifestPath);
    await rmSafe(deployTextPath);
    await rmSafe(buildDir);
  });
});
