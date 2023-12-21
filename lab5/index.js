const Candidate = require('./candidate');
const Voter = require('./voter');
const ElectionCommittee = require('./electionCommittee');
const CentralElectionCommittee = require('./centralElectionCommittee');

const voter0 = new Voter();
const voter1 = new Voter();
const voter2 = new Voter();
const voter3 = new Voter();
const voter4 = new Voter();
const voter5 = new Voter();
const voter6 = new Voter();

const candidate0 = new Candidate();
const candidate1 = new Candidate();
const candidate2 = new Candidate();

const electionCommittee1 = new ElectionCommittee();
const electionCommittee2 = new ElectionCommittee();

const centralElectionCommittee = new CentralElectionCommittee();

// реєстрація виборців
const voters = [voter0, voter1, voter2, voter3, voter4,voter5];
voter6.id = '66666'; //взлом одного з виборців
voters.map((voter) => centralElectionCommittee.registerVoter(voter));

// реєстрація кандидатів
const candidates = [candidate0, candidate1, candidate2];
candidates.map((candidate) => centralElectionCommittee.registerCandidate(candidate));


const bulletins0 = voter0.vote(candidate0.id, centralElectionCommittee.publicKey);
const bulletins1 = voter1.vote(candidate1.id, centralElectionCommittee.publicKey);
const bulletins2 = voter2.vote(candidate1.id, centralElectionCommittee.publicKey);
//демонстрація помилкового сценарію
//Спроба проголосувати за неіснуючого кандидата
const bulletins3 = voter3.vote(123456, centralElectionCommittee.publicKey);
//демонстрація помилкового сценарію
//Недійсний підпис
const bulletins4 = voter4.vote(candidate1.id, centralElectionCommittee.publicKey);
const bulletins5 = voter5.vote(candidate2.id, centralElectionCommittee.publicKey);
//демонстрація помилкового сценарію
//Спроба проголосувати другий раз
const bulletins6 = voter0.vote(candidate0.id, centralElectionCommittee.publicKey);
//демонстрація помилкового сценарію
//Спроба проголосувати незариєстрованим виборцем
const bulletins7 = voter6.vote(candidate2.id, centralElectionCommittee.publicKey);




console.log('Зафіксовані порушення:');
const receiveVote = ({firstEncrypted, secondEncrypted, id, signature}, voter) => {
  try {
    electionCommittee1.receiveVote({encryptedBulletin: firstEncrypted, id, signature}, voter.publicKey);
    electionCommittee2.receiveVote({encryptedBulletin: secondEncrypted, id, signature}, voter.publicKey);
  } catch (e) {
    console.log(e.message);
  }
}

receiveVote(bulletins0, voter0);
receiveVote(bulletins1, voter1);
receiveVote(bulletins2, voter2);
receiveVote(bulletins3, voter3);
receiveVote(bulletins4, voter0);
receiveVote(bulletins5, voter5);
receiveVote(bulletins6, voter0);
receiveVote(bulletins7, voter6);


centralElectionCommittee.receiveBulletins(electionCommittee1.bulletins, electionCommittee2.bulletins);
const errors = centralElectionCommittee.processBulletins();
errors.forEach((error) => console.log(error));

console.log('Бюлетені в першій ВК:');
console.log(electionCommittee1.bulletins);

console.log('Бюлетені в другій ВК:');
console.log(electionCommittee2.bulletins);

console.log('Результати голосування:');
Object.entries(centralElectionCommittee.results).forEach(([candidateId, votes]) => {
  console.log(`Кандидат ${candidateId}: ${votes} голосів`);
});
console.log('Враховані голоси:');
Object.entries(centralElectionCommittee.votes).forEach(([voterId, candidateId]) => {
  console.log(`Виборець ${voterId} проголосував за кандидата ${candidateId}`);
});


