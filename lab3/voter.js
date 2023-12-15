const crypto = require('node:crypto');
const elGamal = require('../lib/elgamal');

module.exports =  class Voter {
  #privateKey;

  constructor(id) {
    this.id = id;
    this.registrationNumber = null;
    const { privateKey, publicKey } = crypto.generateKeyPairSync('dsa', {modulusLength: 1024})
    this.#privateKey = privateKey;
    this.publicKey = publicKey;
  }

  requestRegistrationNumber(bureau) {
    return bureau.registerVoter(this);
  }

  receiveRegistrationNumber(registrationNumber) {
    this.registrationNumber = registrationNumber;
  }

  createVoteMessage(candidateId, publicKey) {
    const id = crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHash('sha-256').update(id).digest();
    const signature = crypto.createSign('sha-256').update(hash).sign(this.#privateKey, 'hex')
    const message = {id, registrationNumber: this.registrationNumber, bulletin: candidateId};
    return {encrypted: elGamal.encrypt(JSON.stringify(message), publicKey), signature};
  }
}
