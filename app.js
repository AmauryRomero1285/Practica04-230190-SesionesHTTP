import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
import moment from "moment";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";
import os from "os";

const app = express();
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Sesiones almacenadas en memoria (RAM)
const sessions = {};
app.use(
  session({
    secret: "P4-YARM#gokusupersaiyajin-SesionesHTTP-VariablesDeSesión",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 5 * 60 * 1000 },
  })
);

app.get("/", (req, res) => {
  return res.status(200).json({
    message: "Bienvenid@ a la API de Control de Sesiones",
    author: "Yared Amaury Romero Martinez",
  });
});

// Función de utilidad que nos permitirá acceder a la información de la interfaz de red
const getLocalIP = () => {
  const networkInterfaces = os.networkInterfaces();
  for (const interfaceName in networkInterfaces) {
    const interfaces = networkInterfaces[interfaceName];
    for (const iface of interfaces) {
      // IPv4 y no interna
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null; // Retorna cuando no se encuentra una IP válida
};

// Login Endpoint
app.post("/login", (req, res) => {
  const { email, nickname, macAddress } = req.body;

  if (!email || !nickname || !macAddress) {
    return res
      .status(400)
      .json({ message: "Se requiere que los campos estén llenos" });
  }
  const sessionId = uuidv4();
  const now = new Date();

  sessions[sessionId] = {
    sessionId,
    email,
    nickname,
    macAddress,
    ip: getLocalIP(),
    createdAt: now,
    lastAccessedAt: now,
  };

  res.status(200).json({
    message: "Inicio de sesión exitoso.",
    sessionId,
  });
});

// Logout Endpoint
app.post("/logout", (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId || !sessions[sessionId]) {
    return res
      .status(404)
      .json({ message: "No se ha encontrado una sesión activa" });
  }

  delete sessions[sessionId];
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Error al cerrar sesión");
    }
  });

  res.status(200).json({ message: "Logout exitoso" });
});

// Update Endpoint
app.post("/update", (req, res) => {
  const { sessionId, email, nickname } = req.body;

  if (!sessionId || !sessions[sessionId]) {
    return res.status(404).json({ message: "No existe una sesión activa" });
  }

  if (email) sessions[sessionId].email = email;
  if (nickname) sessions[sessionId].nickname = nickname;

  sessions[sessionId].lastAccessedAt = new Date();

  res.status(200).json({
    message: "Actualización exitosa",
  });
});

// Status Endpoint
app.post("/status", (req, res) => {
  const sessionId = req.query.sessionId;
  if (!sessionId || !sessions[sessionId]) {
    return res.status(404).json({ message: "No hay sesiones activas" });
  }
  res.status(200).json({
    message: "Sesión activa",
    session: sessions[sessionId],
  });
});
