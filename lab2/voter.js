const crypto = require('node:crypto');
const BlindSignature = require('blind-signatures');

module.exports = class Voter {
  constructor(id) {
    this.id = id;
    this.bulletinSets = [];
    this.multiplierSets = [];
  }

  createBulletinSets(registeredContenders, publicKey) {
    this.n = publicKey.keyPair.n.toString();
    this.e = publicKey.keyPair.e.toString();
    const blindedSets = [];
    for (let i = 0; i < 10; i++) {
      const bulletinSet = [];
      const multiplierSet = [];
      const blindedSet = [];
      for (const contender of registeredContenders) {
        const id = crypto.randomBytes(16).toString('hex');
        const bulletin = {id, contender};
        const {blinded, r} = BlindSignature.blind({message: JSON.stringify(bulletin), N: this.n, E: this.e});
        bulletinSet.push(bulletin);
        multiplierSet.push(r);
        blindedSet.push(blinded);
      }
      this.bulletinSets.push(bulletinSet);
      this.multiplierSets.push(multiplierSet);
      blindedSets.push(blindedSet);
    }
    return blindedSets;
  }

  elect(centralElectionCommitteeResponse, contender, publicKey) {
    const {bulletinSetIndexToSign, getSignedSet} = centralElectionCommitteeResponse;
    const multiplierSets = this.multiplierSets.filter((el, i) => i !== bulletinSetIndexToSign);
    const bulletinSets = this.bulletinSets.filter((el, i) => i !== bulletinSetIndexToSign);
    const signedSet = getSignedSet(multiplierSets, bulletinSets);
    for (let i = 0; i < signedSet.length; i++) {
      const bulletin = this.bulletinSets[bulletinSetIndexToSign][i];
      const bulletinStr = JSON.stringify(bulletin)
      if (bulletin.contender === contender) {
        const r = this.multiplierSets[bulletinSetIndexToSign][i];
        const unblinded = BlindSignature.unblind({
          signed: signedSet[i],
          N: this.n,
          r
        });
        const verifyResult = BlindSignature.verify({
          unblinded,
          N: this.n,
          E: this.e,
          message: bulletinStr
        });
        if (!verifyResult) {
          throw new Error('Бюлетень отриманий від ВК хибно підписаний');
        }
        const encryptedBulletin = crypto.publicEncrypt(publicKey, Buffer.from(bulletinStr));
        return {unblinded, encryptedBulletin};
      }
    }
  }
};
