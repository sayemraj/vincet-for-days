import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import express from 'express';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = 3000;

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const expressApp = express();
  const server = createServer(expressApp);
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  const onlineUsersMap = new Map();

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('authenticate', (user) => {
      if (user && user.id) {
        onlineUsersMap.set(socket.id, user);
        io.emit('online_users', Array.from(onlineUsersMap.values()));
      }
    });

    socket.on('join_room', (room) => {
      socket.join(room);
    });

    socket.on('send_message', (data) => {
      io.emit('receive_message', data);
    });

    socket.on('task_updated', (data) => {
      io.emit('task_updated', data);
    });

    socket.on('action', (data) => {
      // Broadcast actions to all other clients for real-time updates
      socket.broadcast.emit('action_performed', data);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      if (onlineUsersMap.has(socket.id)) {
        onlineUsersMap.delete(socket.id);
        io.emit('online_users', Array.from(onlineUsersMap.values()));
      }
    });
  });

  // Standard Next.js handler for Express (Express 5 compatible)
  expressApp.all(/.*/, (req, res) => {
    const parsedUrl = parse(req.url!, true);
    return handle(req, res, parsedUrl);
  });

  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
}).catch((err) => {
  console.error('Error during Next.js preparation:', err);
  process.exit(1);
});
