var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
//Tableau des usernames
var users = [];
// Tableau des joueurs
var socketMap = {};
// nombre des joueurs
var number = 0;
var tempname='service';

server.listen(5001);

app.use(express.static('public'));

  io.on('connection', function (socket) {

      console.log('connect', socket.id);

  //MESSAGERIE1
    socket.on('login', function(nickname) {
        if (users.indexOf(nickname) > -1) {
            socket.emit('nickExisted');
        } else {
            //socket.userIndex = users.length;
            console.log('chatterlogin', socket.id);
            socket.nickname = nickname;
            users.push(nickname);
            socket.emit('loginSuccess');
            io.sockets.emit('system', nickname, users.length, 'login');
        };
    });

    //obtenir le nom de socket1 et le donner a socket2
    socket.on('sendname',function(){
        tempname=socket.nickname;
    });
    socket.on('resetname',function(){
        socket.nickname=tempname;
        socket.emit('getname',socket.nickname);
    })

    socket.on('postMsg', function(msg, color) {
        socket.broadcast.emit('newMsg', socket.nickname, msg, color);
    });

  //MESSAGERIE2

      socket.on('playerconnect',function()
      {
          number++;
          console.log('playerenter', socket.id);
          socket.clientNum = number;
          socketMap[number] = socket;
          if (number % 2 === 1) {
              socket.emit('waiting', number);
          } else {
              if (socketMap[number - 1]) {
                  socketMap[number - 1].emit("first");
                  socket.emit("second", number);
              } else {
                  socket.emit("leave");
              }
          }
      });

  socket.on('go', function (i, j, isFail) {
    socketMap[getMatch(socket.clientNum)].emit("go", i, j);
    if (isFail) {
      socketMap[getMatch(socket.clientNum)].emit("fail");
    }
  });

  socket.on("disconnect", function () {
      //chat disconnect
      if (!socket.clientNum) {
          console.log('chatter','disconnect', socket.id);
          //users.splice(socket.userIndex, 1);
          users.splice(users.indexOf(socket.nickname), 1);
          socket.broadcast.emit('system', socket.nickname, users.length, 'logout');
      }

      //player disconnect
      else{
        delete(socketMap[socket.clientNum]);
        console.log('player','disconnect', socket.id);
        if (socket.clientNum % 2 !== 0 && !socketMap[getMatch(socket.clientNum)]) {
            number++;
        }
        if (socketMap[getMatch(socket.clientNum)]) {
            socketMap[getMatch(socket.clientNum)].emit('leave');
            delete(socketMap[getMatch(socket.clientNum)]);
        }}}
    );
});

    // Match si le nombre des joueurs est pair.
function getMatch(num) {
  if (num % 2 === 1) {
    return num + 1;
  } else {
    return num - 1;
  }
}