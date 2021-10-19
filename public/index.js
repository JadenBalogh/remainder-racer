window.onload = function () {
  function updateQuestion(data) {
    document.getElementById('question').innerHTML = data.question;
    document.getElementById('lastA').innerHTML = data.lastA;
    document.getElementById('lastN').innerHTML = data.lastN;
    document.getElementById('winner').innerHTML = data.winner;
    document.getElementById('lastAnswer').innerHTML = data.lastAnswer;
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
  events.onmessage = (event) => {
    let json = JSON.parse(event.data);
    updateQuestion(json);
  };

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
