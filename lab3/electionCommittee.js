const elGamal = require('../lib/elgamal');
const crypto = require('node:crypto');

module.exports =  class ElectionCommittee {
  #privateKey;

  constructor() {
    const {privateKey, publicKey} = elGamal.generateKeyPair();
    this.#privateKey = privateKey;
    this.publicKey = publicKey;

    this.registrationNumbers = [];
    this.voted = {};
    this.votes = {};
  }

  registerCandidate(candidate) {
    this.votes[candidate.id] = 0;
  }

  receiveFromRegistrationBureau(registrationNumbers) {
    this.registrationNumbers = registrationNumbers;
  }

  receiveVote({encrypted, signature}, publicKey) {
    const decrypted = elGamal.decrypt(encrypted, this.#privateKey, this.publicKey);
    const voteMessage = JSON.parse(decrypted.toString());

    const expectedHash = crypto.createHash('sha-256').update(voteMessage.id).digest();
    const verify = crypto.createVerify('sha-256').update(expectedHash).verify(publicKey, signature, 'hex');
    if (!verify) throw new Error(`Недійсний підпис!`);
    const registrationNumber = this.registrationNumbers.find((number) => number === voteMessage.registrationNumber);

    if (!registrationNumber) {
      const message = voteMessage.registrationNumber
        ? `Виборець з реєстраційним номером: ${voteMessage.registrationNumber} не може голосувати повторно!`
        : `Виборець не зареєстрований!`
      throw new Error(message);
    }

    if (!Object.keys(this.votes).find((candidate) => candidate === voteMessage.bulletin))
      throw new Error(`Кандидат ${voteMessage.bulletin} не зареєстрований!`);

    this.registrationNumbers = this.registrationNumbers.filter((number) => number !== registrationNumber);
    this.voted[voteMessage.id] = voteMessage.bulletin;
    this.votes[voteMessage.bulletin]++;
  }
}
