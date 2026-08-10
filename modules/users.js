const fs = require("fs");
const path = require("path");

const usersFile = path.join(__dirname, "..", "users.json");

function getUsers() {
    try {
        if (!fs.existsSync(usersFile)) {
            fs.writeFileSync(usersFile, "[]");
            return [];
        }

        const data = fs.readFileSync(usersFile, "utf8").trim();

        if (data === "") {
            fs.writeFileSync(usersFile, "[]");
            return [];
        }

        return JSON.parse(data);
    } catch (error) {
        console.log("Invalid users.json. Resetting file...");
        fs.writeFileSync(usersFile, "[]");
        return [];
    }
}

function saveUsers(users) {
    fs.writeFileSync(
        usersFile,
        JSON.stringify(users, null, 2)
    );
}

function findByEmail(email) {
    const users = getUsers();

    return users.find(
        user =>
            user.email &&
            user.email.toLowerCase() === email.toLowerCase()
    );
}

function findByUsername(username) {
    const users = getUsers();

    return users.find(
        user =>
            user.username &&
            user.username.toLowerCase() === username.toLowerCase()
    );
}

function addUser(user) {
    const users = getUsers();

    users.push(user);

    saveUsers(users);
}

module.exports = {
    getUsers,
    saveUsers,
    findByEmail,
    findByUsername,
    addUser
};