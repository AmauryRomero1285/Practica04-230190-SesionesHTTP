import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
import moment from "moment-timezone";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";
import os from "os";

const app = express();
const PORT = 3000;

// Configuración del servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware para sesiones
app.use(
  session({
    secret: "P4-YARM#gokusupersaiyajin-SesionesHTTP-VariablesDeSesión",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }, // Tiempo de vida de la cookie de la sesión
  })
);

// Función para obtener la IP local
const getLocalIP = () => {
  const networkInterfaces = os.networkInterfaces();
  for (const interfaceName in networkInterfaces) {
    const interfaces = networkInterfaces[interfaceName];
    for (const iface of interfaces) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null; // Retorna cuando no se encuentra una IP válida
};

// Función para calcular tiempo de inactividad
const calculateSessionInactivity = (lastAccessedAt) => {
  const now = moment();
  const lastAccessed = moment(lastAccessedAt);
  const duration = moment.duration(now.diff(lastAccessed));
  return `${duration.hours()} horas, ${duration.minutes()} minutos, ${duration.seconds()} segundos`;
};

// Endpoint de bienvenida
app.get("/", (req, res) => {
  return res.status(200).json({
    message: "Bienvenid@ a la API de Control de Sesiones",
    author: "Yared Amaury Romero Martinez",
  });
});

// Endpoint de inicio de sesión
app.post("/login", (req, res) => {
  const { email, nickname, macAddress } = req.body;

  if (!email || !nickname || !macAddress) {
    return res
      .status(400)
      .json({ message: "Se requiere que los campos estén llenos" });
  }

  const sessionId = uuidv4();
  const now = new Date();

  req.session.user = {
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

// Endpoint para cerrar sesión
app.post("/logout", (req, res) => {
  const { sessionId } = req.body;

  if (
    !sessionId ||
    !req.session.user ||
    req.session.user.sessionId !== sessionId
  ) {
    return res
      .status(404)
      .json({ message: "No se ha encontrado una sesión activa" });
  }

  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Error al cerrar sesión");
    }
    res.status(200).json({ message: "Logout exitoso" });
  });
});

// Endpoint de actualización de sesión
app.put("/update", (req, res) => {
  const { sessionId, email, nickname } = req.body;

  if (!req.session.user || req.session.user.sessionId !== sessionId) {
    return res.status(404).json({ message: "No existe una sesión activa" });
  }

  if (email) req.session.user.email = email;
  if (nickname) req.session.user.nickname = nickname;

  req.session.user.lastAccessedAt = new Date();

  res.status(200).json({
    message: "Actualización exitosa",
    session: req.session.user,
  });
});

// Endpoint de estado de la sesión
app.post("/status", (req, res) => {
  const { sessionId } = req.body;
  if (!req.session.user || req.session.user.sessionId !== sessionId) {
    return res.status(404).json({ message: "No hay sesiones activas" });
  }
  const lastAccessedAtFormatted = moment
    .tz(req.session.user.lastAccessedAt, "America/Mexico_City")
    .format("YYYY-MM-DD HH:mm:ss");
  const inactivityTime = calculateSessionInactivity(req.session.user.lastAccessedAt);

  // Respuesta con la información de la sesión y el tiempo de inactividad
  res.status(200).json({
    message: "Sesión activa",
    session: req.session.user,
    lastAccessedAt: lastAccessedAtFormatted,
    inactivityTime,
  });
});

// Endpoint para listar sesiones activas
app.get("/currentSessions", (req, res) => {
  const { sessionId } = req.query;

  // Verificar la sesión local
  if (!req.session.user || req.session.user.sessionId !== sessionId) {
    return res.status(404).json({ message: "No hay sesiones activas" });
  }

  const lastAccessedAtFormatted = moment
    .tz(req.session.user.lastAccessedAt, "America/Mexico_City")
    .format("YYYY-MM-DD HH:mm:ss");
  const inactivityTime = calculateSessionInactivity(req.session.user.lastAccessedAt);

  res.status(200).json({
    message: "Sesión activa",
    session: req.session.user,
    lastAccessedAt: lastAccessedAtFormatted,
    inactivityTime,
  });
});
