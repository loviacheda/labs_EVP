const crypto = require('node:crypto');

module.exports = class CentralElectionCommittee {
  #privateKey;

  constructor() {
    this.candidates = [];
    this.voters = [];
    this.votes = {};
    this.results = {};

    this.bulletins1 = {};
    this.bulletins2 = {};
    this.bulletins = [];

    const keyPair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 1024,
      privateKeyEncoding: {format: 'pem', type: 'pkcs1'},
      publicKeyEncoding: {format: 'pem', type: 'pkcs1'}
    });
    this.#privateKey = keyPair.privateKey;
    this.publicKey = keyPair.publicKey;
  }

  generateId() {
    return Math.floor(100000 + Math.random() * 900000);
  }

  registerCandidate(candidate) {
    const id = this.generateId().toString();
    this.candidates.push(candidate);
    this.results[id] = 0;
    candidate.receiveId(id);
    return id;
  }

  registerVoter(voter) {
    const id = this.generateId().toString();
    this.voters.push(voter);
    voter.receiveId(id);
    return id;
  }

  receiveBulletins(bulletins1, bulletins2) {
    this.bulletins1 = bulletins1;
    this.bulletins2 = bulletins2;
  }

  processBulletins() {
    Object.keys(this.bulletins1).forEach((key) => {
      this.bulletins.push({firstPart: this.bulletins1[key], secondPart: this.bulletins2[key], id: key})
    });

    const errors = [];

    this.bulletins.forEach((bulletin) => {
      if (!this.voters.find((voter) => voter.id === bulletin.id)) {
        errors.push('Незареєстрований виборець');
        return;
      }

      const firstPartDecrypted = crypto.privateDecrypt(this.#privateKey, bulletin.firstPart);
      const secondPartDecrypted = crypto.privateDecrypt(this.#privateKey, bulletin.secondPart);

      const candidateId = Math.round(+firstPartDecrypted * +secondPartDecrypted);

      if (!this.candidates.find((candidate) => candidate.id === candidateId.toString())) {
        errors.push('Спроба проголосувати за неіснуючого кандидата!');
        return;
      }

      this.votes[bulletin.id] = candidateId;
      this.results[candidateId]++;
    });

    return errors;
  }
}
