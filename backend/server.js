const express = require("express");
const dotenv = require("dotenv"); // for environment variable
const path = require("path");

const { chats } = require("./data/data"); // import api data
const connectDB = require("./config/db"); // import connect to mongoDB fun
const userRoutes = require("./Routes/userRoutes");
const chatRoutes = require("./Routes/chatRoutes");
const messageRoutes = require("./Routes/messageRoutes");
const { notFound, errorHandler } = require("./middlewares/errorMiddleware");

dotenv.config(); // for using environmental variable
connectDB(); // connect to mongoDB
const app = express(); // creating server

app.use(express.json()); // to accept JSON Data

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// --------------- Deployment --------------

const __dirname1 = path.resolve();
if (process.env.NODE_ENV === "production") {
	app.use(express.static(path.join(__dirname1, "frontend/build")));

	app.get("*", (req, res) => {
		res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"));
	});
} else {
	// Routes
	app.get("/", (req, res) => {
		res.send("API is Running Successfull");
	});
}

// --------------- Deployment --------------

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT; // store env variable in js variable

const server = app.listen(PORT, console.log(`Server Started on PORT ${PORT}`)); // run the server on port

const io = require("socket.io")(server, {
	pingTimeout: 60000,
	cors: {
		origin: "http://localhost:3000",
	},
});

io.on("connection", (socket) => {
	console.log("connected to socket.io");

	socket.on("setup", (userData) => {
		socket.join(userData._id);
		socket.emit("connected");
	});

	socket.on("join chat", (room) => {
		socket.join(room);
		console.log("User Joined Room " + room);
	});

	socket.on("typing", (room) => socket.in(room).emit("typing"));
	socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

	socket.on("new message", (newMessageRecieved) => {
		var chat = newMessageRecieved.chat;

		if (!chat.users) return console.log("chat.users is not defined");

		chat.users.forEach((user) => {
			if (user._id === newMessageRecieved.sender._id) return;

			socket.in(user._id).emit("message recieved", newMessageRecieved);
		});
	});

	socket.off("setup", () => {
		console.log("USER DISCONNECTED");
		socket.leave(useData._id);
	});
});
