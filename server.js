import express from 'express';
import { check, validationResult } from 'express-validator';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
const port = process.env.PORT;

const UPDATE_INTERVAL = 20; // in seconds
const MIN_TERMS = 1;
const MAX_TERMS = 4;
const MIN_A = 2;
const MAX_A = 80;
const MIN_K = 2;
const MAX_K = 12;
const K_CHANCE = 0.3;
const MIN_N = 3;
const MAX_N = 13;

var clients = [];
var a = [];
var k = [];
var n = 1;
var winner = '_Name_';
var lastQuestion = '';
var lastAnswer = 0;

/// HELPER FUNCTIONS

function randRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function questionString() {
  let result = '';
  for (let i = 0; i < a.length; i++) {
    result += `${a[i]}`;
    if (k[i] > 1) {
      result += `<sup>${k[i]}</sup>`;
    }
    if (i < a.length - 1) {
      result += ' ⋅ ';
    }
  }
  result += ` mod ${n}`;
  return result;
}

function getPageData() {
  return JSON.stringify({
    question: questionString(),
    lastQuestion: lastQuestion,
    winner: winner,
    lastAnswer: lastAnswer,
  });
}

function getAnswer() {
  let result = 1;
  for (let i = 0; i < a.length; i++) {
    let myA = a[i] % n;
    let term = myA;
    for (let j = 0; j < k[i] - 1; j++) {
      term *= myA;
    }
    result *= term % n;
  }
  return result % n;
}

function updateQuestion() {
  // Cache last question data
  lastQuestion = questionString();

  // Generate new question
  let numTerms = randRange(MIN_TERMS, MAX_TERMS);
  a = [];
  k = [];
  n = randRange(MIN_N, MAX_N);
  for (let i = 0; i < numTerms; i++) {
    let isBigK = Math.random() < K_CHANCE;
    k.push(isBigK ? randRange(MIN_K, MAX_K) : 1);

    // Pick a values that aren't directly divisible by n
    let hardA = randRange(MIN_A, MAX_A);
    while (hardA % n == 0) {
      hardA = randRange(MIN_A, MAX_A);
    }
    a.push(hardA);
  }

  // Send new question update
  clients.forEach((client) => {
    client.response.write(`event: message\ndata: ${getPageData()}\n\n`);
  });
}

function updateClients() {
  let count = JSON.stringify({ clients: clients.length });
  clients.forEach((client) => {
    client.response.write(`event: message\ndata: ${count}\n\n`);
  });
}

/// LOOPS

var updateLoop = null;
clearInterval(updateLoop);
updateLoop = setInterval(updateClients, UPDATE_INTERVAL * 1000);

/// ROUTES

app.use(express.static('public'));

app.get('/my-status', (req, res) => {
  res.send(`${clients.length}`);
});

app.get('/question', (req, res) => {
  res.send(`${getPageData()}`);
});

app.get('/answer', [check('name').escape()], (req, res) => {
  let answer = req.query.answer;
  let correctAnswer = getAnswer();
  if (answer == correctAnswer) {
    winner = req.query.name || 'Anonymous';
    lastAnswer = correctAnswer;
    updateQuestion();
    res.send(true);
  } else {
    res.send(false);
  }
});

app.get('/events', (req, res) => {
  const headers = {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
  };
  res.writeHead(200, headers);

  // Send the current question
  res.write(getPageData());

  // Add this client
  const clientId = Date.now();
  const newClient = {
    id: clientId,
    response: res,
  };
  clients.push(newClient);
  updateClients();

  // Remove client on close
  req.on('close', () => {
    clients = clients.filter((client) => client.id !== clientId);
    updateClients();
  });
});

app.listen(port, () => {
  updateQuestion();
  console.log(`Example app listening at http://localhost:${port}`);
});
