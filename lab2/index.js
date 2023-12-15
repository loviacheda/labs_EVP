const CentralElectionCommittee = require('./centralElectionCommittee');
const Voter = require('./voter');

const centralElectionCommittee = new CentralElectionCommittee();
const voter0 = new Voter('voter0');
const voter1 = new Voter('voter1');
const voter2 = new Voter('voter2');
const voter3 = new Voter('voter3');
const voter4 = new Voter('voter4');
const voter5 = new Voter('voter5');
const voter6 = new Voter('voter6');
const registeredContenders = ['Джон', 'Річард', 'Саманта'];
registeredContenders.forEach((c) => centralElectionCommittee.registerContender(c));
centralElectionCommittee.registerVoter(voter0);
centralElectionCommittee.registerVoter(voter1);
centralElectionCommittee.registerVoter(voter2);
centralElectionCommittee.registerVoter(voter3);
centralElectionCommittee.registerVoter(voter4);
centralElectionCommittee.registerVoter(voter6);

const {key, publicKey} = centralElectionCommittee;
console.log('Проблеми що були виявлені протягом голосування:');
const blindedSets0 = voter0.createBulletinSets(registeredContenders, key);
const response0 = centralElectionCommittee.signBlindly(voter0, blindedSets0);
//виборець використовує підписаний бланк для голосування
const bulletin0 = voter0.elect(response0, 'Джон', publicKey);
//комісія отримує підписаний бланк
centralElectionCommittee.receiveBulletin(bulletin0);

const blindedSets1 = voter1.createBulletinSets(registeredContenders, key);
const response1 = centralElectionCommittee.signBlindly(voter1, blindedSets1);
const bulletin1 = voter1.elect(response1, 'Річард', publicKey);
centralElectionCommittee.receiveBulletin(bulletin1);

const blindedSets2 = voter2.createBulletinSets(registeredContenders, key);
const response2 = centralElectionCommittee.signBlindly(voter2, blindedSets2);
const bulletin2 = voter2.elect(response2, 'Річард', publicKey);
centralElectionCommittee.receiveBulletin(bulletin2);

//демонстрація помилкового сценарію
const blindedSets3 = voter3.createBulletinSets(registeredContenders, key);
//передали 9 бюлетенів замість 10
const response3 = centralElectionCommittee.signBlindly(voter3, blindedSets3.slice(0, -1));
printError(() => voter3.elect(response3, 'Річард', publicKey));

// демонстрація помилкового сценарію
// зробив два бюлетеня на одного та самого кандидата
const blindedSets4 = voter4.createBulletinSets([...registeredContenders.slice(1), 'Річард'], key);
const response4 = centralElectionCommittee.signBlindly(voter4, blindedSets4);
printError(() => voter4.elect(response4, 'Річард', publicKey));

// демонстрація помилкового сценарію
// спроба проголосувати незареєстрованим виборцем
const blindedSets5 = voter5.createBulletinSets(registeredContenders, key);
printError(() => centralElectionCommittee.signBlindly(voter5, blindedSets5));

//демонстрація помилкового сценарію
// спроба проголосувати за неіснуючого кандидата
// підроблюється один бюлетень для неіснуючого кандидата
const blindedSets6 = voter6.createBulletinSets([...registeredContenders.slice(0, -1), 'Нортон'], key);
const response6 = centralElectionCommittee.signBlindly(voter6, blindedSets6);
printError(() => voter6.elect(response6, 'Нортон', publicKey));
//також кандидат намагається проголосувати двічі
printError(() => centralElectionCommittee.signBlindly(voter0, blindedSets0));

//демонстрація помилкового сценарію
// невірний підпис
centralElectionCommittee.receiveBulletin({
  unblinded: bulletin0.unblinded,
  encryptedBulletin: bulletin1.encryptedBulletin
});
//демонстрація помилкового сценарію
// спроба надіслати повторно бюлетень
centralElectionCommittee.receiveBulletin(bulletin0);

const {result, bulletinIdContenderMap, errors} = centralElectionCommittee.finishElection();
console.log('\n Результати виборів:');
console.log(result)
console.log('\n Бюлетені:');
console.log(bulletinIdContenderMap);
console.log('\n Зафіксовані порушення:');
errors.forEach((err) => console.log('\t', err));

function printError(fn) {
  try {
    fn();
  } catch (err) {
    console.log('\t', err.message);
  }
}
