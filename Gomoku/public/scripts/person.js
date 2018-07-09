var waiting = false;
var chessname;
// Jouer sur Internet
function personPlay() {
  socket.emit('sendname');
  socket = io.connect('http://127.0.0.1:5001');
  socket.emit('resetname');
  socket.on('getname',function(playername){
    chessname=playername;
  });
  socket.emit('playerconnect');
  socket.on('waiting', function () {
    waiting = true;
    me = false;
    textContainer.innerText = 'Attendez un joueur,SVP...';
  });
  socket.on('first', function () {
    textContainer.innerText = 'On commence et c\'est a vous';
    waiting = false;
    me = true;
    over = false;
  });
  socket.on('second', function () {
    textContainer.innerText = 'On commence et attendez votre rival';
    me = false;
    over = false;
  });
  socket.on('go', function (i, j) {
    oneStep(i, j, false);
    chessBoard[i][j] = 2;
    me = true;
    textContainer.innerText = 'C\'est a vous';
  });
  socket.on('fail', function () {
    showDialog('Vous avez perdu et recommencez？', function () {
      socket.disconnect();
      reset();
      personPlay();
    });
    over = true;
  });
  socket.on('leave', function () {
    over = true;
    showDialog('Votre rival a quitte et recommencez？', function () {
      reset();
      personPlay();
    });
  });
}

//Poser le pion
function personGo(i, j, isFail) {
  socket.emit('go', i, j, isFail);
  textContainer.innerText = 'Attendez';
}
