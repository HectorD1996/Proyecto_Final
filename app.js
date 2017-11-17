var express= require('express'),
app=express(),
server = require('http').createServer(app),
io=require('socket.io').listen(server),
mongoose = require('mongoose'),
users={};

server.listen(3000, function(){
  console.log('listening on *:3000');
});

var mongoURI = "mongodb://12345:123456@ds113046.mlab.com:13046/pruebas";
var MongoDB = mongoose.connect(mongoURI).connection;
MongoDB.on('error', function(err) { console.log(err.message); });
MongoDB.once('open', function() {
    console.log("mongodb connection open");
});

function guid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
  }

var chatSchema = mongoose.Schema({
    Guid:  String,
    sender: String,
    nickname: String,
    reciever: String,
    msg: String,
    created: {type: Date, default: Date.now}
});

var ChatModel = mongoose.model('Message', chatSchema);



app.get('/',function(req, res){
res.sendFile(__dirname+'/index.html');
});


io.on('connection',function(socket){
    console.log('new connection done');
    
    ChatModel.find({}, function(err, docs){
        if(err)throw err;
        console.log('sending old msgs');
        io.emit('load old msgs', docs);
    });

    socket.on('send message',function(data){
        var ram = guid();
        console.log(ram);
        var newMsg = new ChatModel({Guid: ram, msg:data.msg,sender: data.sender, reciever: data.reciever,nickname:socket.nickname});
        newMsg.save(function(err){
        if(err){
        throw err;
        }else{
        io.emit('new message',{Guid: ram, msg:data.msg,sender: data.sender, reciever: data.reciever,nickname:socket.nickname});
        }
        });			
    });

    socket.on('new user',function(data, callback){
        console.log('new user added: '+data);
        if(data in users){
        callback(false);
        }
        else{
        callback(true);
        socket.nickname = data;
        users[socket.nickname]=socket;
        updateNicknames();
        }
    });
    socket.on('picked color',function(data){
        io.emit('new color',{color:data,nickname: socket.nickname});
    });
    
    socket.on('disconnect', function(data){
        if(!socket.nickname) return;
        delete users[socket.nickname];
        updateNicknames();
    });
    
    function updateNicknames(){
    io.emit('usernames',Object.keys(users));
    }
});