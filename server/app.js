import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

const SECRET = "supersecret"; // Use env variable in production
const PORT = 3000;

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        credentials: true,
    },
});

app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);
app.use(cookieParser());
app.use(express.json());

app.get("/", (_, res) => res.send("Chat server is live!"));

app.get("/login", (req, res) => {
    const token = jwt.sign({ user: "user123" }, SECRET, { expiresIn: "1h" });
    res
        .cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
        })
        .json({ message: "Login successful" });
});

io.use((socket, next) => {
    cookieParser()(socket.request, {}, (err) => {
        if (err) return next(err);
        const { token } = socket.request.cookies || {};
        if (!token) return next(new Error("Auth error"));
        try {
            const decoded = jwt.verify(token, SECRET);
            socket.user = decoded;
            next();
        } catch {
            next(new Error("Invalid token"));
        }
    });
});

io.on("connection", (socket) => {
    socket.on("join-room", (room) => {
        socket.join(room);
    });

    socket.on("message", ({ room, message }) => {
        socket.to(room).emit("receive-message", {
            from: socket.user.user,
            message,
        });
    });
});

server.listen(PORT, () =>
    console.log(`Server listening on http://localhost:${PORT}`)
);
