const crypto = require('node:crypto');

module.exports = class Voter {
  #privateKey;
  constructor() {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('dsa', {modulusLength: 1024})
    this.#privateKey = privateKey;
    this.publicKey = publicKey;
  }

  receiveId(id) {
    this.id = id;
  }

  divideId(id) {
    const firstMultiplier = Math.floor(Math.random() * (id - 1)) + 1;
    const secondMultiplier = id / firstMultiplier;
    return {firstMultiplier, secondMultiplier};
  }

  vote(candidateId, publicKey) {
    const {firstMultiplier, secondMultiplier} = this.divideId(candidateId);
    const firstEncrypted = crypto.publicEncrypt(publicKey, Buffer.from(firstMultiplier.toString()));
    const secondEncrypted = crypto.publicEncrypt(publicKey, Buffer.from(secondMultiplier.toString()));

    const hash = crypto.createHash('sha-256').update(this.id).digest();
    const signature = crypto.createSign('sha-256').update(hash).sign(this.#privateKey, 'hex')

    return {firstEncrypted, secondEncrypted, id: this.id, signature};
  }
}
