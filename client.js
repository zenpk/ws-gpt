const socket = new WebSocket("ws://localhost:3002");

socket.addEventListener("message", (event) => {
  console.log(`Message from server: ${event.data}`);
});

socket.addEventListener("open", (event) => {
  socket.send("Hello Server!");
});
