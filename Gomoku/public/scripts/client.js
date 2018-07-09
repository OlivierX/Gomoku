
window.onload = function() {
        socket = io.connect();
        drawChessBoard();
        socket.on('connect', function() {
            document.getElementById('info').textContent = 'Votre nom,SVP';
            document.getElementById('nickWrapper').style.display = 'block';
            document.getElementById('nicknameInput').focus();
        });

        //verifier l'existence du nickname
        socket.on('nickExisted', function() {
            document.getElementById('info').textContent = '!nickname is taken, choose another pls';
        });

        //
         socket.on('loginSuccess', function() {
            document.title = 'Bienvenue! ' + document.getElementById('nicknameInput').value;
            document.getElementById('loginWrapper').style.display = 'none';
            document.getElementById('messageInput').focus();
        });

         //
        //  socket.on('error', function(err) {
        //     if (document.getElementById('loginWrapper').style.display == 'none') {
        //         document.getElementById('status').textContent = '!fail to connect :(';
        //     } else {
        //         document.getElementById('info').textContent = '!fail to connect :(';
        //     }
        // });

    //Message donnee automatiquement par le systeme pour l'entree et depart des clients
         socket.on('system', function(nickName, userCount, type) {
            var msg = nickName + (type == 'login' ? ' entre' : ' left');
            displayNewMsg('system ', msg, 'red');
            document.getElementById('status').textContent = userCount + (userCount > 1 ? ' users' : ' user') + ' en ligne';
        });

         //recevoyer et puis afficher les messages des clients
         socket.on('newMsg', function(user, msg, color) {
             if (user!==chessname){
            displayNewMsg(user, msg, color);}
        });


         //boutton de login
        document.getElementById('loginBtn').addEventListener('click', function() {
            var nickName = document.getElementById('nicknameInput').value;
            if (nickName.trim().length != 0) {
                socket.emit('login', nickName);
            } else {
                document.getElementById('nicknameInput').focus();
            };
        }, false);

        //Tapper 'Enter', ca marche aussi
        document.getElementById('nicknameInput').addEventListener('keyup', function(e) {
            if (e.keyCode == 13) {
                var nickName = document.getElementById('nicknameInput').value;
                if (nickName.trim().length != 0) {
                    socket.emit('login', nickName);
                };
            };
        }, false);

        //send boutton du message
        document.getElementById('sendBtn').addEventListener('click', function() {
            var messageInput = document.getElementById('messageInput'),
                msg = messageInput.value,
                color = document.getElementById('colorStyle').value;
            messageInput.value = '';
            messageInput.focus();
            if (msg.trim().length != 0) {
                socket.emit('postMsg', msg, color);
                displayNewMsg('me', msg, color);
                return;
            };
        }, false);

        //On peut aussi envoyer message par tapper 'Enter''
        document.getElementById('messageInput').addEventListener('keyup', function(e) {
            var messageInput = document.getElementById('messageInput'),
                msg = messageInput.value,
                color = document.getElementById('colorStyle').value;
            if (e.keyCode == 13 && msg.trim().length != 0) {
                messageInput.value = '';
                socket.emit('postMsg', msg, color);
                displayNewMsg('me', msg, color);
            };
        }, false);

        //eliminer tous les messages dans la boitre de Cat
        document.getElementById('clearBtn').addEventListener('click', function() {
            document.getElementById('historyMsg').innerHTML = '';
        }, false);

};

var displayNewMsg= function(user, msg, color) {
    var container = document.getElementById('historyMsg'),
        msgToDisplay = document.createElement('p'),
        date = new Date().toTimeString().substr(0, 8);
    msgToDisplay.style.color = color || '#000';
    msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + '): </span>' + msg;
    container.appendChild(msgToDisplay);
    container.scrollTop = container.scrollHeight;
}




var canvasWidth = canvasHeight = Math.min(400, document.documentElement.clientWidth - 420);
var textContainer = document.getElementById('text-container');
var canvas = document.getElementById('chess');
var context = canvas.getContext('2d');
var computer = document.getElementById('computer');
var person = document.getElementById('person');
var dialog = document.getElementById('dialog');
var dialogTitle = document.getElementById('dialog-title');
var btnBack = document.getElementById('btn_back');
var btnOk = document.getElementById('btn_ok');
var ROW_COUNT = 15;
var socket;
var playername;

canvas.width = canvasWidth;
canvas.height = canvasHeight;

var over = true;
var i = 0, j = 0, k = 0;
// damier
var chessBoard = [];
// mon tableau de la triomphe
var myWin = [];
// tableau de la triomphe du rival
var rivalWin = [];

// tableau de triomphe
var wins = [];
// nombre de triomphe
var count = 0;

// Initialiser les tableau
for (i = 0; i < ROW_COUNT; i++) {
  wins[i] = [];
  for (j = 0; j < ROW_COUNT; j++) {
    wins[i][j] = [];
  }
}

// verification dans 4 sens
traverseWin();

// Initialisation
initParams();

var me = false;
var isComputer;

var boxWidth = (canvasWidth - 10) / ROW_COUNT;
var radius = boxWidth / 2 * 0.8;
var realPadding = 5 + boxWidth / 2;


//dessiner le damier
function drawChessBoard() {
  context.strokeStyle = '#9f7a59';
  context.lineWidth = 2;
  context.beginPath();
  for (var i = 0; i < 15; i++) {
    context.moveTo(realPadding + i * boxWidth, realPadding);
    context.lineTo(realPadding + i * boxWidth, canvasHeight - realPadding);
    context.stroke();
    context.moveTo(realPadding, realPadding + i * boxWidth);
    context.lineTo(canvasHeight - realPadding, realPadding + i * boxWidth);
    context.stroke();
  }
}

// poser le pion
function oneStep(i, j, me) {
  context.beginPath();
  context.arc(realPadding + i * boxWidth, realPadding + j * boxWidth, radius, 0, 2 * Math.PI);
  context.closePath();
  var gradient = context.createRadialGradient(realPadding + i * boxWidth + 2, realPadding + j * boxWidth - 2, radius, realPadding + i * boxWidth, realPadding + j * boxWidth, 0);
  if (me) {
    gradient.addColorStop(0, '#0a0a0a');
    gradient.addColorStop(1, '#636766');
  } else {
    gradient.addColorStop(0, '#9d9d9d');
    gradient.addColorStop(1, '#f9f9f9');
  }
  context.fillStyle = gradient;
  context.fill();
}

canvas.onclick = function (e) {
  if (over) {
    return;
  }
  if (!me) {
    return;
  }
  var x = e.offsetX;
  var y = e.offsetY;
  var i = Math.floor(x / boxWidth);
  var j = Math.floor(y / boxWidth);
  if (i > 14 || j > 14) {
    return
  }
  if (chessBoard[i][j] === 0) {
    oneStep(i, j, me);
    chessBoard[i][j] = 1;
    for (var k = 0; k < count; k++) {
      if (wins[i][j][k]) {
        myWin[k]++;
        rivalWin[k] = 6;
        if (myWin[k] === 5) {
          textContainer.innerText = 'termine';
          showDialog('Vous avez gagne, recommencez？', function () {
            if (isComputer) {
              reset();
              me = true;
            }
            if (!isComputer) {
              socket.disconnect();
              reset();
              personPlay();
            }
          });
          if (!isComputer) {
            personGo(i, j, true);
          }
          over = true;
        }
      }
    }
    if (!over) {
      me = !me;
      if (isComputer) {
        computerAI();
      } else {
        personGo(i, j);
      }
    }
  }
};

// cliquer IA mode
computer.onclick = function () {
  if (!over) {
    if (isComputer) {
      showDialog('Sur de quitter et recommencez？', function () {
        textContainer.innerText = 'on commence';
        reset();
      });
    } else {
      showDialog('Sur de quitter et recommencez？', function () {
        socket.disconnect();
        isComputer = true;
        reset();
      });
    }
  } else {
    textContainer.innerText = 'on commence';
    isComputer = true;
    reset();
  }
};


// choisir jouer sur Internet
person.onclick = function () {
  if (waiting) {
    showDialog('quittez d\'attendre et recommencez？', function () {
      socket.disconnect();
      personPlay();
    });
  }
  else if (!over) {
    showDialog('Sur de quitter et recommencez？', function () {
      socket.disconnect();
      isComputer = false;
      reset();
      personPlay();
    });
  } else {
    isComputer = false;
    over = false;
    reset();
    personPlay();
  }
};

// verification de la triomphe dans 4 sens
function traverseWin() {
  for (i = 0; i < ROW_COUNT; i++) {
    for (j = 0; j < ROW_COUNT - 4; j++) {
      for (k = 0; k < 5; k++) {
        wins[i][j + k][count] = true;
      }
      count++;
    }
  }

  for (i = 0; i < ROW_COUNT; i++) {
    for (j = 0; j < ROW_COUNT - 4; j++) {
      for (k = 0; k < 5; k++) {
        wins[j + k][i][count] = true;
      }
      count++;
    }
  }

  for (i = 0; i < ROW_COUNT - 4; i++) {
    for (j = 0; j < ROW_COUNT - 4; j++) {
      for (k = 0; k < 5; k++) {
        wins[i + k][j + k][count] = true;
      }
      count++;
    }
  }

  for (i = 0; i < ROW_COUNT - 4; i++) {
    for (j = ROW_COUNT - 1; j > 3; j--) {
      for (k = 0; k < 5; k++) {
        wins[i + k][j - k][count] = true;
      }
      count++;
    }
  }
}

// boitre de dialogue
function showDialog(result, ok) {
  dialogTitle.innerText = result;
  btnOk.innerText = 'oui';
  btnOk.onclick = function () {
    ok();
    dialog.close();
  };
  btnBack.innerText = 'non';
  btnBack.onclick = function () {
    dialog.close();
  };
  dialog.showModal();
}

// Initialisation
function initParams() {
  // Initialiser les pion
  for (i = 0; i < ROW_COUNT; i++) {
    chessBoard[i] = [];
    for (j = 0; j < ROW_COUNT; j++) {
      chessBoard[i][j] = 0;
    }
  }

  // initialiser le tableau de gagner
  for (i = 0; i < count; i++) {
    myWin[i] = 0;
    rivalWin[i] = 0;
  }
}

// Initialiser et dessiner damier
function reset() {
  context.clearRect(0, 0, canvasWidth, canvasHeight);
  initParams();
  drawChessBoard();
  textContainer.innerText = 'on commence';
  over = false;
  me = true;
}


