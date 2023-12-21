const crypto = require('node:crypto');

module.exports = class ElectionCommittee {
  constructor() {
    this.bulletins = {};
  }

  receiveVote({encryptedBulletin, id, signature}, publicKey) {
    const expectedHash = crypto.createHash('sha-256').update(id).digest();
    const verify = crypto.createVerify('sha-256').update(expectedHash).verify(publicKey, signature, 'hex');
    if (!verify) throw new Error('Недійсний підпис');
    if (Object.keys(this.bulletins).find((currentId) => currentId === id)) throw new Error('Спроба повторного голосування');
    this.bulletins[id] = encryptedBulletin;
  }
}
