const socket = new WebSocket("wss://domain.com/wsgpt");

socket.addEventListener("message", (event) => {
    console.log(`Message from server: ${event.data}`);
});

socket.addEventListener("open", (event) => {
    const sendObj = {
        token: "",
        messages: [
            {
                "role": "user",
                "content": "hello"
            }
        ]
    }
    socket.send(JSON.stringify(sendObj));
});
