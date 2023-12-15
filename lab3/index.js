const RegistrationBureau = require('./registrationBureau.js');
const ElectionCommittee = require('./electionCommittee.js');
const Voter = require('./voter.js');
const Candidate = require('./candidate.js');

const registrationBureau = new RegistrationBureau();
const electionCommittee = new ElectionCommittee();

const voter0 = new Voter('voter0');
const voter1 = new Voter('voter1');
const voter2 = new Voter('voter2');
const voter3 = new Voter('voter3');
const voter4 = new Voter('voter4');
const voter5 = new Voter('voter5');

const votersToRegister = [voter0, voter1, voter2, voter3, voter4];

const candidate0 = new Candidate('Луїза');
const candidate1 = new Candidate('Блер');
const candidate2 = new Candidate('Серена');


electionCommittee.registerCandidate(candidate0);
electionCommittee.registerCandidate(candidate1);
electionCommittee.registerCandidate(candidate2);

// Кожен виборець отримує реєстраційний номер
votersToRegister.forEach((voter) => {
    const registrationNumber = voter.requestRegistrationNumber(registrationBureau);
    voter.receiveRegistrationNumber(registrationNumber);
  }
)

// Відправлення реєстраційних номерів у ВК
registrationBureau.sendToElectionCommittee(electionCommittee);

//отримання ВК зашифрованих повідомлень з підписами виборців
const bulletin0 = voter0.createVoteMessage('Луїза', electionCommittee.publicKey);
const bulletin1 = voter1.createVoteMessage('Блер', electionCommittee.publicKey);
const bulletin2 = voter2.createVoteMessage('Блер', electionCommittee.publicKey);
//демонстрація помилкового сценарію
//Спроба проголосувати за незарєстрованого кандидата
const bulletin3 = voter3.createVoteMessage('Васюк', electionCommittee.publicKey);
//демонстрація помилкового сценарію
//Спроба підписати хибним підписом
const bulletin4 = voter4.createVoteMessage('Блер', electionCommittee.publicKey);
//демонстрація помилкового сценарію
//Спроба проголосувати  незарєстрованим виборцем
const bulletin5 = voter5.createVoteMessage('Луїза', electionCommittee.publicKey);
//демонстрація помилкового сценарію
//Спроба проголосувати двічі
const bulletin6 = voter0.createVoteMessage('Луїза', electionCommittee.publicKey);

// Голосування
const receiveVote = (bulletin, voter) => {
  try {
    electionCommittee.receiveVote(bulletin, voter.publicKey)
  } catch (e) {
    console.log(e.message);
  }
}

receiveVote(bulletin0, voter0);
receiveVote(bulletin1, voter1);
receiveVote(bulletin2, voter2);

receiveVote(bulletin3, voter3);
receiveVote(bulletin4, voter0);
receiveVote(bulletin5, voter5);
receiveVote(bulletin6, voter0);

console.log("\nРезультати:");
console.log(electionCommittee.votes);

console.log("\nЛист голосування:");
console.log(electionCommittee.voted);
