window.onload = function () {
  function updateQuestion(data) {
    document.getElementById('question').innerHTML = data.question;
    document.getElementById('lastQuestion').innerHTML = data.lastQuestion;
    document.getElementById('winner').innerHTML = data.winner;
    document.getElementById('lastAnswer').innerHTML = data.lastAnswer;
    document.getElementById('feedback').innerHTML = '';

    let isWinner = data.winner == document.getElementById('name').value;
    document.getElementById('winner').style['color'] = isWinner ? 'green' : 'red';
  }

  function updateClients(data) {
    document.getElementById('clients').innerHTML = data.clients;
  }

  // Initialize page
  const questionReq = new XMLHttpRequest();
  questionReq.onload = function () {
    let json = JSON.parse(this.responseText);
    updateQuestion(json);
  };
  questionReq.open('GET', '/question');
  questionReq.send();

  // Receive updates
  const events = new EventSource('/events');
  events.addEventListener('message', (event) => {
    let json = JSON.parse(event.data);
    if (json.question) {
      updateQuestion(json);
    } else {
      updateClients(json);
    }
  });
  events.addEventListener('clients', (event) => {
    let json = JSON.parse(event.data);
    updateQuestion(json);
  });

  // Send answers
  document.getElementById('submit').addEventListener('click', function (event) {
    event.preventDefault();
    let answer = document.getElementById('answer').value;
    let name = document.getElementById('name').value;
    document.getElementById('answer').value = '';

    const answerReq = new XMLHttpRequest();
    answerReq.onload = function () {
      let correct = this.responseText === 'true';
      document.getElementById('feedback').innerHTML = correct ? 'Correct!' : 'Wrong!';
    };
    answerReq.open('GET', `/answer?answer=${answer}&name=${name}`);
    answerReq.send();
  });
};
