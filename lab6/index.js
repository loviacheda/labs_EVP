const RegistrationBureau = require('./registrationBureau.js');
const ElectionCommittee = require('./electionCommittee.js');
const Voter = require('./voter.js');
const Candidate = require('./candidate.js');
const Application = require('./application.js');

const electionCommittee = new ElectionCommittee();
const registrationBureau = new RegistrationBureau();

const application = new Application(electionCommittee, registrationBureau);

const candidate0 = new Candidate('candidate0');
const candidate1 = new Candidate('candidate1');
const candidate2 = new Candidate('candidate2');

electionCommittee.registerCandidate(candidate0);
electionCommittee.registerCandidate(candidate1);
electionCommittee.registerCandidate(candidate2);


const voter0 = new Voter('John Doe', '01-15-1990');
const voter1 = new Voter('Alice Smith', '03-22-1985');
const voter2 = new Voter('Bob Johnson', '07-05-1993');
const voter3 = new Voter('Emily Davis', '11-30-1988');
const voter4 = new Voter('Chris Anderson', '09-14-2000');
const voter5 = new Voter('Olivia White', '04-10-1997');

const voters = [voter0, voter1, voter2, voter3, voter4, voter5];

// підготовка до виборів
registrationBureau.generateIDs(voters.length);
registrationBureau.sendIDs(electionCommittee);
electionCommittee.sendTokens(registrationBureau);

// реєстрація
voters.slice(0, 5).forEach((voter) => registrationBureau.registerVoter(voter))

//голосування
const proceedVoting = (login, password, token, candidateId) => {
    try {
        application.signIn(login, password);
        application.vote(token, candidateId);
    } catch (e) {
        console.log(e.message)
    }
}

proceedVoting(voter0.login, voter0.password, voter0.token, 'candidate2');
proceedVoting(voter1.login, voter1.password, voter1.token, 'candidate2');
//демонстрація помилкового сценарію
//введення хибного паролю
proceedVoting(voter2.login, voter1.password, voter2.token, 'candidate0');
proceedVoting(voter3.login, voter3.password, voter3.token, 'candidate0');
//демонстрація помилкового сценарію
//Спроба проголосувати за неіснуючого кандидата
proceedVoting(voter4.login, voter4.password, voter4.token, 'candidate3');
//демонстрація помилкового сценарію
//Спроба проголосувати виборцем, логін якого не додано до бази
proceedVoting(voter5.login, voter5.password, voter5.token, 'candidate1');
//демонстрація помилкового сценарію
//Спроба проголосувати двічі
proceedVoting(voter1.login, voter1.password, voter1.token, 'candidate0');


const errorss = electionCommittee.processBulletins();
const formattedErrors = errorss.map(error => `- ${error}`);
console.log(`Помилки під час голосування:\n${formattedErrors.join('\n')}`);

console.log('Результати виборів:');
const votesList = Object.entries(electionCommittee.votes);
const formattedVotes = votesList.map(([candidate, votes]) => `${candidate}: ${votes} голосів`);
console.log(`Результати: ${formattedVotes.join(', ')}`);




