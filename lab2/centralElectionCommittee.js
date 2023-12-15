const crypto = require('node:crypto');
const BlindedSignature = require('blind-signatures');

module.exports = class CentralElectionCommittee {
  constructor() {
    const keyPair = crypto.generateKeyPairSync('rsa', {modulusLength: 1024});
    this.publicKey = keyPair.publicKey;
    this.privateKey = keyPair.privateKey;
    this.key = BlindedSignature.keyGeneration();
    this.bulletinBox = [];
    this.contenderIdVoteNumberMap = {};
    this.registeredVoters = new Set();
    this.votersWithSignedBulletins = new Set();
  }

  registerContender(contender) {
    this.contenderIdVoteNumberMap[contender] = 0;
  }

  registerVoter(voter) {
    this.registeredVoters.add(voter.id);
  }

  receiveBulletin(signedBulletin) {
    this.bulletinBox.push(signedBulletin);
  }

  signBlindly(voter, blindedSets) {
    if (this.votersWithSignedBulletins.has(voter.id)) {
      throw new Error(`${voter.id} вже отриав від ЦВК підписані бюлетені`);
    }

    if (!this.registeredVoters.has(voter.id)){
      throw new Error(`Незареєстрований виборець ${voter.id} намагався проголосувати`);
    }

    const bulletinSetIndexToSign = Math.round(Math.random() * (blindedSets.length - 1));

    const getSignedSet = (multiplierSets, bulletinSets) => {
      if (bulletinSets.length !== blindedSets.length - 1) {
        throw new Error(`Отримано неправильну к-ть бюлетенів від ${voter.id}`);
      }
      let signedSet;
      for (let i = 0, j = 0; i < blindedSets.length; i++) {
        const blindedSet = blindedSets[i];
        if (blindedSet.length !== Object.keys(this.contenderIdVoteNumberMap).length) {
          throw new Error(`Невірна кількість бюлетенів в замаскованому повідомленні #${i} що отримано від виборця ${voter.id}`);
        }

        if (i === bulletinSetIndexToSign) {
          signedSet = blindedSet.map((blinded) => BlindedSignature.sign({blinded, key: this.key}));
          continue;
        }

        const bulletinSet = bulletinSets[j];
        const multiplierSet = multiplierSets[j++];
        const contenders = new Set();
        for (let k = 0; k < blindedSet.length; k++) {
          const blinded = blindedSet[k];
          const bulletin = bulletinSet[k];
          const r = multiplierSet[k];
          const signed = BlindedSignature.sign({blinded, key: this.key});
          const unblinded = BlindedSignature.unblind({signed, N: this.key.keyPair.n.toString(), r});
          const verifyResult = BlindedSignature.verify2({unblinded, key: this.key, message: JSON.stringify(bulletin)});
          if (!verifyResult) {
            throw new Error(`Недійсний бюлетень #${k} в повідомленні #${j} що отримано від виборця ${voter.id}`);
          }
          if (!bulletin.id || !bulletin.contender) {
            throw new Error(`Невірний формат бюлетеню #${k} в повідомленні #${j} що отримано від виборця ${voter.id}`);
          }
          if (!(bulletin.contender in this.contenderIdVoteNumberMap)) {
            throw new Error(
              `Повідомлення #${j} що містить бюлетень #${k} з незареєстрованим кандидатом отримане від виборця ${voter.id}`
            );
          }
          if (contenders.has(bulletin.contender)) {
            throw new Error(
              `Повідомлення #${j} містить бюлетені з однаковими кандидатами отримано від виборця ${voter.id}`
            );
          }
          contenders.add(bulletin.contender);
        }
      }

      this.votersWithSignedBulletins.add(voter.id);
      return signedSet;
    };

    return {bulletinSetIndexToSign, getSignedSet};
  }

  finishElection() {
    const errors = [];
    const bulletinIdContenderMap = {};
    for (let i = 0; i < this.bulletinBox.length; i++) {
      const {unblinded, encryptedBulletin} = this.bulletinBox[i];
      try {
        const bulletinStr = crypto.privateDecrypt(this.privateKey, encryptedBulletin).toString();
        const verifyResult = BlindedSignature.verify2({unblinded, key: this.key, message: bulletinStr});
        if (!verifyResult) {
          throw new Error(`Невірний підпис у бюлетені #${i}`);
        }

        const bulletin = JSON.parse(bulletinStr);
        if (bulletin.id in bulletinIdContenderMap) {
          throw new Error(`Бюлетень ${bulletin.id} вже порахований`);
        }

        bulletinIdContenderMap[bulletin.id] = bulletin.contender;
        this.contenderIdVoteNumberMap[bulletin.contender]++;
      } catch (error) {
        errors.push(error.message);
      }
    }

    return {result: this.contenderIdVoteNumberMap, bulletinIdContenderMap, errors};
  }
};
