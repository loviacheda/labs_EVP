const BlumBlumShub = require('../lib/blumBlumShub.js');
const ElGamal = require('../lib/elgamal.js');

module.exports = class Application {
    constructor(electionCommittee, registrationBureau) {
        this.electionCommittee = electionCommittee;
        this.registrationBureau = registrationBureau;
    }

    signIn(login, password) {
        const credential = this.registrationBureau.credentials[login];
        if (!credential) throw new Error('Виборця з таким логіном не існує');
        if (credential !== password) throw new Error('Неправильний пароль');
    }

    vote(token, candidateId) {
      if (!this.electionCommittee.tokens.find((existingToken) => existingToken.id === token.id))
        throw new Error('Невалідний токен');
      const {id, publicKey} = token;
      const {message, x0} = BlumBlumShub.encrypt(candidateId, publicKey);
      const encrypted = ElGamal.encrypt(JSON.stringify({id, message, x0}), this.electionCommittee.publicKey);
      this.electionCommittee.receiveVoteMessage(encrypted);
    }
}
