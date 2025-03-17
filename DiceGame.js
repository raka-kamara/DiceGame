
const crypto = require('crypto');
const readline = require('readline-sync');
const Table = require('cli-table3'); // Third-party library for tables

// Read dice sets from command-line arguments
const diceSets = process.argv.slice(2).map(set => set.split(',').map(Number));

if (diceSets.length < 2) {
    console.error("Error: Provide at least two sets of dice as arguments.");
    process.exit(1);
}

// Function to generate HMAC
function generateHMAC(secretKey, value) {
    return crypto.createHmac('sha256', secretKey).update(value.toString()).digest('hex');
}

// Step 1: Determine who selects dice first
console.log("Let's determine who makes the first move.");
const secretKey = crypto.randomBytes(32).toString('hex');
const computerChoice = Math.floor(Math.random() * 2);
const hmac = generateHMAC(secretKey, computerChoice);
console.log(`I selected a random value in the range 0..1 (HMAC=${hmac}).`);

const userGuess = readline.questionInt("Try to guess my selection (0 or 1): ");
console.log(`My selection: ${computerChoice} (KEY=${secretKey}).`);
const userFirst = userGuess === computerChoice;
console.log(userFirst ? "You make the first move." : "I make the first move.");

// Step 2: Dice selection
let userDice, computerDice;

if (userFirst) {
    console.log("\nChoose your dice:");
    diceSets.forEach((dice, index) => console.log(`${index} - ${dice.join(', ')}`));
    const userDiceIndex = readline.questionInt("Your selection: ");
    userDice = diceSets[userDiceIndex];
    console.log(`You choose the [${userDice.join(', ')}] dice.`);

    // Computer selects a different dice set
    computerDice = diceSets.find((_, index) => index !== userDiceIndex);
    console.log(`I select the [${computerDice.join(', ')}] dice.`);
} else {
    // Computer selects first
    const computerDiceIndex = Math.floor(Math.random() * diceSets.length);
    computerDice = diceSets[computerDiceIndex];
    console.log(`I make the first move and choose the [${computerDice.join(', ')}] dice.`);

    // User selects from remaining options
    console.log("\nChoose your dice:");
    diceSets.forEach((dice, index) => {
        if (index !== computerDiceIndex) console.log(`${index} - ${dice.join(', ')}`);
    });
    const userDiceIndex = readline.questionInt("Your selection: ");
    userDice = diceSets[userDiceIndex];
    console.log(`You choose the [${userDice.join(', ')}] dice.`);
}

// Step 3: Computer rolls first
console.log("\nIt's time for my roll.");
const computerSecretKey = crypto.randomBytes(32).toString('hex');
const computerRollIndex = Math.floor(Math.random() * 6);
const computerHMAC = generateHMAC(computerSecretKey, computerRollIndex);
console.log(`I selected a random value in the range 0..5 (HMAC=${computerHMAC}).`);

console.log("Add your number modulo 6.");
const userRollIndex = readline.questionInt("Your selection (0-5): ");
console.log(`My number is ${computerRollIndex} (KEY=${computerSecretKey}).`);

const computerRollMod6 = (computerRollIndex + userRollIndex) % 6;
const computerRoll = computerDice[computerRollMod6];
console.log(`The fair number generation result is ${computerRollIndex} + ${userRollIndex} = ${computerRollMod6} (mod 6).`);
console.log(`My roll result is ${computerRoll}.`);

// Step 4: User rolls next
console.log("\nIt's time for your roll.");
const userSecretKey = crypto.randomBytes(32).toString('hex');
const userRollIndex2 = Math.floor(Math.random() * 6);
const userHMAC = generateHMAC(userSecretKey, userRollIndex2);
console.log(`I selected a random value in the range 0..5 (HMAC=${userHMAC}).`);

console.log("Add your number modulo 6.");
const userRollIndexFinal = readline.questionInt("Your selection (0-5): ");
console.log(`My number is ${userRollIndex2} (KEY=${userSecretKey}).`);

const userRollMod6 = (userRollIndex2 + userRollIndexFinal) % 6;
const userRoll = userDice[userRollMod6];
console.log(`The fair number generation result is ${userRollIndex2} + ${userRollIndexFinal} = ${userRollMod6} (mod 6).`);
console.log(`Your roll result is ${userRoll}.`);

// Step 5: Determine winner
if (userRoll > computerRoll) {
    console.log(`You win (${userRoll} > ${computerRoll})!`);
} else if (userRoll < computerRoll) {
    console.log(`I win (${computerRoll} > ${userRoll})!`);
} else {
    console.log("It's a tie!");
}

// Step 6: Probability Calculation Table
console.log("\nProbability Table (Winning chances for the user):");
const table = new Table({ head: ["User Dice \\ Computer Dice", ...diceSets.map((_, i) => `Set ${i}`)] });

diceSets.forEach((userDice, uIndex) => {
    const row = [`Set ${uIndex}`];
    diceSets.forEach((computerDice, cIndex) => {
        if (uIndex === cIndex) {
            row.push("-"); // No self-play
        } else {
            let userWins = 0;
            let totalGames = userDice.length * computerDice.length;
            for (const u of userDice) {
                for (const c of computerDice) {
                    if (u > c) userWins++;
                }
            }
            row.push((userWins / totalGames).toFixed(4));
        }
    });
    table.push(row);
});

console.log(table.toString());
