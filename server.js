import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
const port = process.env.PORT;

const MIN_A = 2;
const MAX_A = 1024;
const MIN_N = 3;
const MAX_N = 13;

var clients = [];
var a = 1;
var n = 1;
var winner = '_Name_';
var lastA = 1;
var lastN = 1;
var lastAnswer = 0;

/// HELPER FUNCTIONS

function getQuestion() {
  return JSON.stringify({
    question: `${a} mod ${n}`,
    lastA: lastA,
    lastN: lastN,
    winner: winner,
    lastAnswer: lastAnswer,
  });
}

function updateQuestion() {
  lastA = a;
  lastN = n;
  a = Math.floor(Math.random() * (MAX_A - MIN_A + 1) + MIN_A);
  n = Math.floor(Math.random() * (MAX_N - MIN_N + 1) + MIN_N);
  clients.forEach((client) => {
    client.response.write(`event: message\ndata: ${getQuestion()}\n\n`);
  });
}

/// ROUTES

app.use(express.static('public'));

app.get('/my-status', (req, res) => {
  res.send(`${clients.length}`);
});

app.get('/question', (req, res) => {
  res.send(getQuestion());
});

app.get('/answer', (req, res) => {
  let answer = req.query.answer;
  let correctAnswer = a % n;
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
  res.write(getQuestion());

  // Add this client
  const clientId = Date.now();
  const newClient = {
    id: clientId,
    response: res,
  };
  clients.push(newClient);

  // Remove client on close
  req.on('close', () => {
    clients = clients.filter((client) => client.id !== clientId);
  });
});

app.listen(port, () => {
  updateQuestion();
  console.log(`Example app listening at http://localhost:${port}`);
});
