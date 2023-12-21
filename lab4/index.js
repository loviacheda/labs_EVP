const assert = require('node:assert/strict');
const Voter = require('./voter');

const voterA = new Voter('voterA');
const voterB = new Voter('voterB');
const voterC = new Voter('voterC');
const voterD = new Voter('voterD');
const candidates = ['Аліса', 'Дакота', 'Мія'];

const votersPublicKeys = [
  voterA.rsaKeyPair.publicKey,
  voterB.rsaKeyPair.publicKey,
  voterC.rsaKeyPair.publicKey,
  voterD.rsaKeyPair.publicKey
];

let bulletins = [
  voterA.createBulletin('Аліса', votersPublicKeys),
  voterB.createBulletin('Аліса', votersPublicKeys),
  voterC.createBulletin('Дакота', votersPublicKeys),
  voterD.createBulletin('Аліса', votersPublicKeys)
];

bulletins = voterA.decryptAndRemoveSalt(bulletins);
bulletins = voterB.decryptAndRemoveSalt(bulletins);
bulletins = voterC.decryptAndRemoveSalt(bulletins);
bulletins = voterD.decryptAndRemoveSalt(bulletins);

bulletins = voterA.decryptAndVerifySignature({bulletins});
bulletins = voterB.decryptAndVerifySignature(bulletins, voterA.elgamalKeyPair.publicKey);
bulletins = voterC.decryptAndVerifySignature(bulletins, voterB.elgamalKeyPair.publicKey);
bulletins = voterD.decryptAndVerifySignature(bulletins, voterC.elgamalKeyPair.publicKey);

const bulletinsA = voterA.verifySignatureAndCheckOwnBulletin(bulletins, voterD.elgamalKeyPair.publicKey);
const bulletinsB = voterB.verifySignatureAndCheckOwnBulletin(bulletins, voterD.elgamalKeyPair.publicKey);
const bulletinsC = voterC.verifySignatureAndCheckOwnBulletin(bulletins, voterD.elgamalKeyPair.publicKey);
assert.deepEqual(bulletinsA, bulletinsB);
assert.deepEqual(bulletinsA, bulletinsC);

const candidateVoteCountMap = candidates.reduce((acc, curr) => ((acc[curr] = 0), acc), {});
bulletinsA.forEach((bulletin) => candidateVoteCountMap[bulletin.toString()]++);
console.log('Результати:');
console.log(candidateVoteCountMap);
