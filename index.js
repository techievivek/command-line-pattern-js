var readlineSync = require('readline-sync');

class User {
    constructor(name, balance) {
        this.name = name;
        this.balance = balance;
    }
}

class CommandHistory {
    constructor() {
        this.commands = [];
    }

    addCommand(cmd) {
        this.commands.push(cmd);
    }

    canUndo() {
        return this.commands.length > 0;
    }

    undoCommand() {
        let lastCommand = this.commands.pop();
        lastCommand.undo();
    }

    getUndoDescription() {
        return this.commands[this.commands.length - 1].desc;
    }
}

class UndoCommand {
    constructor(desc) {
        this.desc = desc;
    }
}

class UndoAddNewUser extends UndoCommand {
    constructor(sheet, name) {
        super('Undo Add User ' + name);
        this.name = name;
        this.sheet = sheet;
    }
    undo() {
        this.sheet.deleteEntry(this.name);
    }

}


class DeleteUndoCommand extends UndoCommand {

    constructor(sheet, userObj, index) {
        super('Undo Delete of User ' + userObj.name);
        this.sheet = sheet;
        this.userObj = userObj;
        this.index = index;
    }

    undo() {
        this.sheet.addUserObjectAtIndex(this.userObj, this.index);
    }

}

class TransferUndoCommand extends UndoCommand {
    constructor(sheet, fromName, toName, amount) {
        super('Undo transfer of money from ' + fromName + ' to ' + toName);
        this.fromName = fromName;
        this.sheet = sheet;
        this.toName = toName;
        this.amount = amount;
    }
    undo() {
        this.sheet.undoTransfer(this.toName, this.fromName, this.amount);
    }
}


class ExpenseSheet {
    constructor() {
        this.entries = [];
    }

    addUserObjectAtIndex(userObj, index) {
        this.entries.splice(index, 0, userObj);
    }

    addAnEntry(name, balance) {
        let userIndex = this.entries.findIndex((entry) => entry.name === name);
        if (userIndex === -1) {
            let newUser = new User(name, balance);
            this.entries.push(newUser);
            console.log('New entry has been added successfully');
            return true;
        } else {
            console.log(`${name} is already registed with us.`);
            return false;
        }
    }

    showAllEntry() {
        console.table(this.entries);
    }

    transferAmount(fromUser, toUser, amount) {
        let transferFrom = this.entries.find((entry) => entry.name === fromUser);
        let transferTo = this.entries.find((entry) => entry.name === toUser);
        if (transferFrom !== undefined) {
            if (transferTo === undefined) {
                console.log(`ToUser: ${toUser} doesn't seem to be registed with us.`);
                return false;
            } else {
                if (amount < 0) {
                    console.log("Doesn't seem to be a valid amount");
                    return false;
                }
                if (transferFrom.name === transferTo.name) {
                    console.log('fromUser and toUser is same');
                    return false;
                }
                if (transferFrom.balance >= amount) {
                    console.log(`Transferring money.......`);
                    transferFrom.balance -= amount;
                    transferTo.balance += amount;
                    console.log(`Amount ${amount} transferred from ${fromUser} to ${toUser}`);
                    return true;
                } else {
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
        let userIndex = this.entries.findIndex((entry) => entry.name === name);
        if (userIndex !== -1) {
            console.log('Deleting entry....')
            this.entries.splice(userIndex, 1);
            console.log(`Deleted ${name} from the list`);
            return true;
        } else {
            console.log(`${name} doesn't seem to be registed with us.`);
            return false;
        }
    }

    getUserAndIndex(name) {
        let index = this.entries.findIndex((entry) => entry.name === name);
        return [this.entries[index], index];
    }

    getBalance(name) {
        let userIndex = this.entries.findIndex((entry) => entry.name === name);
        if (userIndex !== -1) {
            return this.entries[userIndex].balance;
        } else {
            return 0;
        }
    }

    undoTransfer(fromUser, toUser, amount) {
        let transferFrom = this.entries.find((entry) => entry.name === fromUser);
        let transferTo = this.entries.find((entry) => entry.name === toUser);
        if (transferFrom !== undefined) {
            if (transferTo === undefined) {
                console.log(`ToUser: ${toUser} doesn't seem to be registed with us.`);
            } else {
                if (transferFrom.balance >= amount && amount > 0 && transferFrom.name !== transferTo.name) {
                    console.log(`Transferring back the money.......`);
                    transferFrom.balance -= amount;
                    transferTo.balance += amount;
                    console.log(`Amount ${amount} transferred back from ${fromUser} to ${toUser}`)
                } else {
                    console.log(`${fromUser} doesn't seem to have enough balance.`);
                }
            }
        } else {
            console.log(`Fromuser: ${fromUser} doesn't seem to be registed with us.`);
        }
    }
}

class Application {
    start() {
        const sheet = new ExpenseSheet();
        const commandHistory = new CommandHistory();
        let choice;
        do {
            console.log(`(A)dd an entry`);
            console.log(`(S)how all entry`);
            console.log(`(T)ransfer to someone`);
            console.log(`(D)elete an entry`);
            if (commandHistory.canUndo()) {
                console.log('(U) ' + commandHistory.getUndoDescription());
            }
            console.log(`E(X)it the program`);
            choice = readlineSync.question('Please type a character to continue \n');
            choice = choice.toUpperCase();
            switch (choice) {
                case 'A': {
                    const name = readlineSync.question("Enter the user's name \n");
                    const balance = readlineSync.question('Enter the initial amount \n');
                    sheet.addAnEntry(name, Number.parseFloat(balance));
                    commandHistory.addCommand(new UndoAddNewUser(sheet, name));
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
                    sheet.transferAmount(fromName, toName, Number.parseFloat(transferAmount));
                    commandHistory.addCommand(new TransferUndoCommand(sheet, fromName, toName, Number.parseFloat(transferAmount)));
                    break;
                }
                case 'D': {
                    const name = readlineSync.question('Please enter the name of the customer you want to delete \n');
                    const [userObj, index] = sheet.getUserAndIndex(name);
                    if (userObj) {
                        sheet.deleteEntry(name);
                        commandHistory.addCommand(new DeleteUndoCommand(sheet, userObj, index));
                    }
                    else {
                        console.log(`${name} doesn't seem to be registered with us.`);
                    }
                    break;
                }
                case 'U': {
                    if (commandHistory.canUndo()) {
                        commandHistory.undoCommand();
                    }
                    break;
                }
                case 'X': {
                    console.log('Exiting the program');
                    break;
                }
                default: {
                    console.log('Please enter a valid choice');
                    break;
                }
            }
        } while (choice !== 'X');
    }
}

const app = new Application();
app.start();