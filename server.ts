import express from 'express';
import { createServer } from "node:http";
import { Server } from "socket.io";

function makeid(length: number) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

const port = 3001;
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000"
  }
});

io.on("connection", (socket) => {
  socket.on('create_match', (match) => {
    const room = match
    socket.join(room);
    io.to(room).emit('match_created', true)
  } )
  socket.on('start_match', (match) => {
    const room = match
    socket.join(room);
    io.to(room).emit('match_started', room)
  })
  socket.on('movement', (match, board, turn, player) => {
    const room = match
    console.log(player, turn);
    io.to(room).emit('move', { board, turn, player })
  } )
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

httpServer.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});

// const server = serve({
//   port: 8080,
//   fetch(req, server) {
//     if (server.upgrade(req)) {
//       return; // do not return a Response
//     }
//     return new Response("Upgrade failed", { status: 500 });
//   },
//   websocket: {
//     message(ws, message: any) {
//       console.log(message);
//       const message2 = JSON.parse(message ?? {})
//       console.log(message2);
//       if (message2?.type === 'Create match') {
//         ws.send(JSON.stringify({
//           type: 'start_match',
//           match: makeid(7)
//         }));
//       }
//       if (message2?.type === 'movement') {
//         ws.send(JSON.stringify({
//           type: message2.type,
//           board: message2.board,
//           match: message2.match
//         }));
//       }
//     },
//     open(ws) {
//       console.log('connected');
//       ws.send('connected');

//     },
//     close(ws, code, message) {},
//     drain(ws) {},
//   }
// });