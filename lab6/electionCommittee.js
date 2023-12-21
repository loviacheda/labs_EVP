const ElGamal = require('../lib/elgamal.js');
const BlumBlumShub = require('../lib/blumBlumShub.js');
const crypto = require("node:crypto");

module.exports = class ElectionCommittee {
  #privateKey;
  votersKeys;

  constructor() {
    const {privateKey, publicKey} = ElGamal.generateKeyPair();
    this.#privateKey = privateKey;
    this.publicKey = publicKey;
    this.votersKeys = {};
    this.tokens = [];
    this.votes = {};
    this.voteMessages = [];
    this.alreadyVoted = [];
  }

  receiveIDs(IDs) {
    for (let id of IDs) {
      const {privateKey, publicKey} = BlumBlumShub.generateKeyPair();
      this.votersKeys[id] = {privateKey};
      this.tokens.push({id, publicKey, serialNumber: crypto.randomBytes(8).toString('hex').toUpperCase()
      });
    }
  }

  sendTokens(registrationBureau) {
    registrationBureau.receiveTokens(this.tokens);
  }

  registerCandidate(candidate) {
    this.votes[candidate.id] = 0;
  }

  receiveVoteMessage(message) {
    this.voteMessages.push(message);
  }

  processBulletins() {
    const errors = [];
    this.voteMessages.forEach((voteMessage) => {
      const {message, x0, id} = JSON.parse(ElGamal.decrypt(voteMessage, this.#privateKey, this.publicKey));
      const bulletin = BlumBlumShub.decrypt(message, x0, this.votersKeys[id]['privateKey']);
      try {
        if (!Object.keys(this.votes).find((element) => element === bulletin))
          throw new Error('Спроба проголосувати за неіснуючого кандидата');
        if (this.alreadyVoted.find((element) => element === id)) throw new Error('Спроба повторного голосування!');
        this.votes[bulletin]++;
        this.alreadyVoted.push(id);
      } catch (err) {
        errors.push(err.message);
      }
    });
    return errors;
  }
}
