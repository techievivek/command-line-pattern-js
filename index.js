var readlineSync = require('readline-sync');

class Users{
  constructor(name, balance){
      this.name = name;
      this.balance = balance;
  }
}

class CommandHistory {
    constructor() {
        this.commands = [];
    }
    addCommand(expenseSheet, commandDetails) {
        let commandExecutedSuccessfully = false;
        if(commandDetails.type === 0 ){
            let balanceAmount = expenseSheet.getBalance(commandDetails.name);
            commandDetails.balance = balanceAmount;
            commandExecutedSuccessfully =  expenseSheet.deleteEntry(commandDetails.name);
        } else if(commandDetails.type === 1) {
            commandExecutedSuccessfully = expenseSheet.addAnEntry(commandDetails.name, commandDetails.balance);
        } else if(commandDetails.type === 2) {
            commandExecutedSuccessfully =  expenseSheet.transferAmount(commandDetails.fromName, commandDetails.toName, commandDetails.transferAmount);
        }
        commandExecutedSuccessfully ? this.commands.push(commandDetails) : 'Please have a look at log message for the error.';
    }

    undoCommand(expenseSheet){
        let commandToUndo = this.commands.pop();
        if(commandToUndo === undefined) {
            console.log('Nothing to undo');
            return;
        }
        if(commandToUndo.type === 0 ){
            expenseSheet.addAnEntry(commandToUndo.name, commandToUndo.balance);
        } else if(commandToUndo.type === 1) {
            expenseSheet.deleteEntry(commandToUndo.name);
        } else if(commandToUndo.type === 2) {
            expenseSheet.undoTransfer(commandToUndo.toName, commandToUndo.fromName, commandToUndo.transferAmount);
        }

    }
    getSize() {
        return this.commands.length;
    }
    getUndoOperation() {
        let commandToUndo = this.commands[this.commands.length - 1];
        if(commandToUndo.type === 0 ){
            return `(U)ndo deletion of user ${commandToUndo.name}`;
        } else if(commandToUndo.type === 1) {
            return `(U)ndo Adding of new user ${commandToUndo.name}`;
        } else if(commandToUndo.type === 2) {
            return `(U)ndo transfer of amount ${commandToUndo.transferAmount} from ${commandToUndo.fromName} to ${commandToUndo.toName}`;
        }
    }
}

class ExpenseSheet {
  constructor() {
      this.entries = [];
  }
  addAnEntry(name, balance) {
      let userIndex = this.entries.findIndex((entry) => entry.name === name );
      if(userIndex === -1){
          let newUser = new Users(name, balance);
          this.entries.push(newUser);
          console.log('New entry has been added successfully');
          return true;
      } else{
          console.log(`${name} is already registed with us.`);
          return false;
      }
  }
  showAllEntry() {
      console.table(this.entries);
  }
  transferAmount(fromUser, toUser, amount){
      let transferFrom = this.entries.find((entry) => entry.name === fromUser );
      let transferTo = this.entries.find((entry) => entry.name === toUser );
      if(transferFrom !== undefined){
          if(transferTo === undefined){
              console.log(`ToUser: ${toUser} doesn't seem to be registed with us.`);
              return false;
          }else {
              if(amount < 0){
                  console.log("Doesn't seem to be a valid amount");
                  return false;
              }
              if(transferFrom.name === transferTo.name){
                  console.log('Fromuser and Touser is same');
                  return false;
              }
              if(transferFrom.balance >= amount){
                  console.log(`Transferring money.......`);
                  transferFrom.balance -= amount;
                  transferTo.balance += amount;
                  console.log(`Amount ${amount} transferred from ${fromUser} to ${toUser}`);
                  return true;
              }else{
                  console.log(`${fromUser} doesn't seem to have enough balance.`);
                  return false;
              }
          }
      } else {
          console.log(`Fromuser: ${fromUser} doesn't seem to be registed with us.`);
          return false;
      }
  }
  deleteEntry(name) {
      let userIndex = this.entries.findIndex((entry) => entry.name === name );
      if(userIndex !== -1){
          console.log('Deleting entry....')
          this.entries.splice(userIndex, 1);
          console.log(`Deleted ${name} from the list`);
          return true;
      }else{
          console.log(`${name} doesn't seem to be registed with us.`);
          return false;
      }
  }
  getBalance(name) {
    let userIndex = this.entries.findIndex((entry) => entry.name === name );
    if(userIndex !== -1){
        return this.entries[userIndex].balance;
    }else{
        return 0;
    }
  }
  undoTransfer(fromUser, toUser, amount) {
    let transferFrom = this.entries.find((entry) => entry.name === fromUser );
    let transferTo = this.entries.find((entry) => entry.name === toUser );
    if(transferFrom !== undefined){
        if(transferTo === undefined){
            console.log(`ToUser: ${toUser} doesn't seem to be registed with us.`);
        }else {
            if(transferFrom.balance >= amount && amount > 0 && transferFrom.name !== transferTo.name){
                console.log(`Transferring back the money.......`);
                transferFrom.balance -= amount;
                transferTo.balance += amount;
                console.log(`Amount ${amount} transferred back from ${fromUser} to ${toUser}`)
            }else{
                console.log(`${fromUser} doesn't seem to have enough balance.`);
            }
        }
    } else {
        console.log(`Fromuser: ${fromUser} doesn't seem to be registed with us.`);
    }
  }
}

class Application {
  start(){
      const sheet = new ExpenseSheet();
      const commandHistory = new CommandHistory();
      let choice;
      do {
      console.log(`(A)dd an entry`);
      console.log(`(S)how all entry`);
      console.log(`(T)ransfer to someone`);
      console.log(`(D)elete an entry`);
      if(commandHistory.getSize() !== 0){
          let command = commandHistory.getUndoOperation();
          console.log(command);
      }
      console.log(`E(X)it the program`);
      choice = readlineSync.question('Please type a character to continue \n');
      choice = choice.toUpperCase();
      switch(choice){
          case 'A': {
              const name = readlineSync.question("Enter the user's name \n");
              const balance = readlineSync.question('Enter the inital amount \n');
              commandHistory.addCommand(sheet, {type: 1, name: name, balance: Number.parseFloat(balance)});
              break;
          }
          case 'S': {
              sheet.showAllEntry();
              break;
          }
          case 'T': {
              const fromName = readlineSync.question('Please enter the name of the customer from whom you want to transfer amount \n');
              const toName = readlineSync.question('Please enter the name of the customer to whom you want to transfer amount \n');
              const transferAmount = readlineSync.question('Please enter the amount you want to trasfer. \n');
              commandHistory.addCommand(sheet, {type: 2, fromName: fromName, toName: toName, transferAmount : Number.parseFloat(transferAmount)});
              break;
          }
          case 'D': {
              const name = readlineSync.question('Please enter the name of the customer you want to delete \n');
              commandHistory.addCommand(sheet, {type: 0, name: name});
              break;
          }
          case 'U' : { 
              commandHistory.undoCommand(sheet);
              break;
          }
          default : {
              console.log('Please enter a valid choice');
              break;
          }
      }
      } while(choice !== 'X');
  }
}

const app = new Application();
app.start();
