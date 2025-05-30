import express from 'express';
import { createServer } from "node:http";
import { Server } from "socket.io";
const mongoose = require ('mongoose');
const cors = require ('cors');
const { Schema } = mongoose;

mongoose.connect(`mongodb+srv://${process.env.db_user}:${process.env.db_password}@cluster0.symhl.mongodb.net/chess_db?retryWrites=true&w=majority&appName=Cluster0`)
	.then((db: any) => console.log('DB is connected'))
	.catch((err: any) => console.log(err));


const MatchSchema = new Schema({
		room: {type: String, required: true},
		gameData: { type: Array, required: true },
    turn: { type: Number, required: true },
    countMovements: { type: Number, required: true },
    finished: { type: Object, required: true },
    check: { type: Object, required: false},
    movesRecord: { type: Array, requied: false},
    messages: { type: Array, required: false }
	});

const Match = mongoose.model('Match', MatchSchema);


const port = 3001;
const app = express();
app.use(cors({
  origin: '*'
}));
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*'
  }
});

io.on("connection", (socket) => {
  console.log(socket.id);
  socket.on('create_match', async (match, board) => {
    const room = match
    socket.join(room);
  } )
  socket.on('start_match', async (match, board, player) => {
    const room = match
    const findGame = await Match.findOne({ room });
    if (findGame) {
      socket.join(room);
      io.to(room).emit('match_reanude', {room, player: player === 1 ? 2 : 1, board: findGame.gameData, turn: findGame.turn, movesRecord: findGame.movesRecord, countMovements: findGame.countMovements, check: findGame.check, finished: findGame.finished, messages: findGame.messages })
      return
    }
    socket.join(room);
    io.to(room).emit('match_started', {room, player})
    io.to(room).emit('match_created', {room, player})
    const game = new Match({
      room,
      gameData: board,
      turn: 1,
      countMovements: 0,
      finished: false
    })
    await game.save()
  })
  socket.on('movement', async (match, board, turn, check) => {
    const room = match
    io.to(room).emit('move', { board })
    const findGame = await Match.findOne({ room });
    await Match.findOneAndUpdate({_id: findGame._id}, { gameData: board.gameBoardData, countMovements: board.countMovements, turn, check })
  })
  socket.on('movement_promotion', async (match, board, turn, player) => {
    const room = match
    const findGame = await Match.findOne({ room });
    await Match.findOneAndUpdate({_id: findGame._id}, { gameData: board.gameBoardData, countMovements: board.countMovements, turn  })
    io.to(room).emit('move_promotion', { board, turn, player })
  } )
  socket.on('message', async (message, match, player) => {
    const room = match
    io.to(room).emit('message', { message, room, player })
    const findGame = await Match.findOne({ room });
    const messagesHistory = findGame.messages
    await Match.findOneAndUpdate({_id: findGame?._id}, { messages: [...messagesHistory, { message, player }] })
  } )
  socket.on('check', async (match, check) => {
    const room = match
    const findGame = await Match.findOne({ room });
    await Match.findOneAndUpdate({_id: findGame?._id}, { check })
  })
  socket.on('checkmate', async (match, check) => {
    const room = match
    const findGame = await Match.findOne({ room });
    await Match.findOneAndUpdate({_id: findGame?._id}, { finished: check })
  })
  socket.on('move_history', async (match, movement) => {
    const room = match
    const findGame = await Match.findOne({ room });
    const movesRecord = findGame.movesRecord
    await Match.findOneAndUpdate({_id: findGame._id}, { movesRecord: [...movesRecord, movement ] })
  })
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});


httpServer.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
