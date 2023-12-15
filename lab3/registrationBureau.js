module.exports = class RegistrationBureau {
  constructor() {
    this.registrationNumbers = {};
  }

  registerVoter(voter) {
    const registrationNumber = Math.floor(100000 + Math.random() * 900000).toString();
    this.registrationNumbers[registrationNumber] = voter.id;
    return registrationNumber;
  }

  sendToElectionCommittee(electionCommittee) {
    electionCommittee.receiveFromRegistrationBureau(Object.keys(this.registrationNumbers));
  }
}
