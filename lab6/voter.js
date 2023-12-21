module.exports = class Voter {
    constructor(name, birthday) {
        this.name = name;
        this.birthday = birthday;


        this.login = null;
        this.password = null;
        this.token = null;
    }
  receiveRegistrationData(login, password, tokenData) {
    this.login = login;
    this.password = password;
    this.token = tokenData;
  }

}
