import { Socket } from "socket.io";
import { v4 as uuidV4 } from "uuid";

interface IRoomParams {
  roomId: string;
  peerId: string;
}

// interface ChatData {
//   message: string;
//   sender: string;
//   time: string;
// }

const rooms: Record<string, string[]> = {};

export const roomHandler = (socket: Socket) => {
  const createRoom = ({ peerId }: { peerId: string }) => {
    const roomId = uuidV4();
    rooms[roomId] = [];
    socket.emit("room-created", { roomId });
    joinRoom({ roomId, peerId });
  };
  const joinRoom = ({ roomId, peerId }: IRoomParams) => {
    if (rooms[roomId]) {
      rooms[roomId].push(peerId);
      socket.join(roomId);
      socket.to(roomId).emit("user-joined", { roomId, peerId });
      socket.emit("get-users", {
        roomId,
        participants: rooms[roomId],
      });
    } else {
      createRoom({ peerId });
    }

    socket.on("disconnect", () => {
      console.log("user disconnected ", peerId);
      leaveRoom({ roomId, peerId });
    });
  };

  const leaveRoom = ({ roomId, peerId }: IRoomParams) => {
    socket.to(roomId).emit("user-disconnected", peerId);
    rooms[roomId] = rooms[roomId]?.filter((id) => id !== peerId);
  };

  // const sendChat = async (fullMessage: any, roomId: string) => {
  //   // socket.broadcast.emit("received-chat", fullMessage);
  //   socket.join(roomId)
  //   socket.to(roomId).emit("received-chat", fullMessage);
  //   console.log(`the room id ${roomId}`);
  //   console.log(fullMessage);
  //   // socket.to(roomId).emit("received-chat", fullMessage);
  // };

  const sendChat = (roomId: string) => {
    socket.join(roomId);
  };

  const incomingChat = (fullMessage: any, roomId: string) => {
    socket.to(roomId).emit("received-chat", fullMessage);
  };

  socket.on("incoming-chat", incomingChat);
  socket.on("send-chat", sendChat);
  socket.on("create-room", createRoom);
  socket.on("join-room", joinRoom);
  socket.on("leave-room", leaveRoom);
};
