import hashlib
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives.asymmetric.utils import Prehashed
import os


class Candidate:
    def __init__(self, candidate_id):
        self.id = candidate_id


class Voter:
    def __init__(self, voter_id):
        self.id = voter_id
        # генерація публічного та приватного ключа
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=1024,
            backend=default_backend()
        )
        # відокремлення приватного ключа
        self.private_key = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
        # відокремлення публічного ключа
        self.public_key = private_key.public_key().public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )

    def elect(self, candidate_id, gamma):
        hash_value = hashlib.sha256(candidate_id.encode()).digest()
        private_key = serialization.load_pem_private_key(
            self.private_key,
            password=None,
            backend=default_backend()
        )

        signature = private_key.sign(hash_value, padding.PKCS1v15(), Prehashed(hashes.SHA256()))
        encrypted_bulletin = bytes(b ^ gamma[i % len(gamma)] for i, b in enumerate(candidate_id.encode()))

        return {'signature': signature, 'encrypted_bulletin': encrypted_bulletin}

    def fake_elect(self, candidate_id, gamma):
        hash_value = hashlib.sha256(candidate_id.encode()).digest()
        private_key = serialization.load_pem_private_key(
            self.private_key,
            password=None,
            backend=default_backend()
        )
        candidate_id = "candidate1"
        signature = private_key.sign(hash_value, padding.PKCS1v15(), Prehashed(hashes.SHA256()))
        encrypted_bulletin = bytes(b ^ gamma[i % len(gamma)] for i, b in enumerate(candidate_id.encode()))

        return {'signature': signature, 'encrypted_bulletin': encrypted_bulletin}

class CentralElectionCommittee:
    def __init__(self):
        self.gamma = os.urandom(16)
        self.bulletin_box = []
        self.public_key_voter_id_map = {}
        self.candidate_id_vote_number_map = {}

    def register_candidate(self, candidate):
        self.candidate_id_vote_number_map[candidate.id] = 0

    def register_voter(self, voter):
        self.public_key_voter_id_map[voter.public_key] = voter.id

    def receive_signed_bulletin(self, signed_bulletin, public_key):
        self.bulletin_box.append({'signed_bulletin': signed_bulletin, 'public_key': public_key})

    def finish_election(self):
        voters_whose_votes_are_counted = []
        errors = []
        for bulletin_info in self.bulletin_box:
            try:
                signed_bulletin = bulletin_info['signed_bulletin']
                public_key = bulletin_info['public_key']
                signature = signed_bulletin['signature']
                encrypted_bulletin = signed_bulletin['encrypted_bulletin']

                bulletin_buffer = bytes([b ^ self.gamma[i % len(self.gamma)] for i, b in enumerate(encrypted_bulletin)])
                actual_hash = hashlib.sha256(bulletin_buffer).digest()
                public_key = serialization.load_pem_public_key(
                    public_key,
                    backend=default_backend()
                )

                try:
                    expectedHash = public_key.recover_data_from_signature(signature,padding.PKCS1v15(),hashes.SHA256())
                except:
                    raise Exception('Невалідний підпис')

                if expectedHash != actual_hash:
                    raise Exception('Підроблений бюлетень')

                try:
                    voter_id = self.public_key_voter_id_map[public_key.public_bytes(serialization.Encoding.PEM,serialization.PublicFormat.SubjectPublicKeyInfo)]
                except:
                    raise Exception('Незареєстрований виборець намагається проголосувати')

                if voter_id in voters_whose_votes_are_counted:
                    raise Exception(f'Виборець {voter_id} намагається проголосувати декілька разів')

                candidate_id = bulletin_buffer.decode()
                if candidate_id not in self.candidate_id_vote_number_map:
                    raise Exception(f'Виборець {voter_id} проголосував за незараєстрованого кандидата')

                voters_whose_votes_are_counted.append(voter_id)
                self.candidate_id_vote_number_map[candidate_id] += 1
            except Exception as error:
                errors.append(str(error))

        return {'result': self.candidate_id_vote_number_map,
                'voters_whose_votes_are_counted': voters_whose_votes_are_counted,
                'errors': errors}


# Створення кандидатів та виборців,реєстрація  створених акторів у комітеті
# Отримання підписаних бюлетенів від виборців
# Підрахунок голосів та оприлюднення результатів

central_election_committee = CentralElectionCommittee()

candidate0 = Candidate('candidate0')
candidate1 = Candidate('candidate1')
candidate2 = Candidate('candidate2')

voter0 = Voter('voter0')
voter1 = Voter('voter1')
voter2 = Voter('voter2')
voter3 = Voter('voter3')
voter4 = Voter('voter4')
voter5 = Voter('voter5')
voter6 = Voter('voter6')
voter7 = Voter('voter7')

central_election_committee.register_candidate(candidate0)
central_election_committee.register_candidate(candidate1)
central_election_committee.register_candidate(candidate2)

central_election_committee.register_voter(voter0)
central_election_committee.register_voter(voter1)
central_election_committee.register_voter(voter2)
central_election_committee.register_voter(voter3)
central_election_committee.register_voter(voter4)
central_election_committee.register_voter(voter5)
central_election_committee.register_voter(voter7)

#виборці голосують за кандидатів
bulletin0 = voter0.elect('candidate0', central_election_committee.gamma)
bulletin1 = voter1.elect('candidate1', central_election_committee.gamma)
bulletin2 = voter2.elect('candidate1', central_election_committee.gamma)
bulletin4 = voter4.elect('candidate1', central_election_committee.gamma)
#виборець 3 голосує за неіснуючого кандидата (демонстрація порушення)
bulletin3 = voter3.elect('candidate3', central_election_committee.gamma)
#виборець 1 голосує ще раз за іншого нандидата (демонстрація порушення)
bulletin5 = voter1.elect('candidate2', central_election_committee.gamma)
# фейковий підпис
bulletin6 = voter5.elect('candidate2', central_election_committee.gamma)
#незараєстрований виборець намагається проголосувати за кандидата
bulletin7 = voter6.elect('candidate2', central_election_committee.gamma)
#Фейковий бюлетень (демонстрація порушення)
bulletin8 = voter7.fake_elect('candidate2', central_election_committee.gamma)

central_election_committee.receive_signed_bulletin(bulletin0, voter0.public_key)
central_election_committee.receive_signed_bulletin(bulletin1, voter1.public_key)
central_election_committee.receive_signed_bulletin(bulletin2, voter2.public_key)
central_election_committee.receive_signed_bulletin(bulletin3, voter3.public_key)
central_election_committee.receive_signed_bulletin(bulletin4, voter4.public_key)
central_election_committee.receive_signed_bulletin(bulletin5, voter1.public_key)
central_election_committee.receive_signed_bulletin(bulletin6, voter3.public_key) # фейковий підпис
central_election_committee.receive_signed_bulletin(bulletin7, voter6.public_key)
central_election_committee.receive_signed_bulletin(bulletin8, voter7.public_key)
result = central_election_committee.finish_election()


print('\nРезультати виборів:')
print(result['result'])
print('\nВиборці,чиї голоси було враховано:', ', '.join(result['voters_whose_votes_are_counted']))
print('\nЗафіксовані порушення:')
for error in result['errors']:
    print('\t', error)
