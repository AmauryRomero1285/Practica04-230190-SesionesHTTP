import express from "express";
import session from "express-session";
import morgan from 'morgan';
import bodyParser from "body-parser";
import moment from "moment-timezone";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";
import os from "os";

const app = express();
const activeSessions={};

// Configuración del servidor
app.set('port',process.env.PORT||3000);
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('trust proxy',1);

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
  return null; 
};
// Función para obtener la IP 
const getClientIP = (req) => {
  let ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress || 
    req.ip;

  if (ip === "::1" || ip === "0.0.0.0") {
    ip = getLocalIP();
  }
  if (ip.includes("::ffff:")) {
    ip = ip.split("::ffff:")[1];
  }

  return ip;
};



// Función para calcular tiempo de inactividad
const calculateSessionInactivity = (lastAccessedAt) => {
  const now = moment();
  const lastAccessed = moment(lastAccessedAt);
  const duration = moment.duration(now.diff(lastAccessed));
  return `${duration.hours()} horas, ${duration.minutes()} minutos, ${duration.seconds()} segundos`;
};
// Cerrar sesiones inactivas después de 2 minutos
setInterval(() => {
  const now = new Date();
  Object.keys(activeSessions).forEach((sessionId) => {
    const session = activeSessions[sessionId];
    const inactivityTime = (now - new Date(session.lastAccessedAt)) / 1000 / 60;
    if (inactivityTime >= 2) {
      delete activeSessions[sessionId];
    }
  });
}, 60000); 

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

  const sessionData = {
    sessionId,
    email,
    nickname,
    macAddress,
    ip: getClientIP(req),
    createdAt: now,
    lastAccessedAt: now,
  };

  req.session.user = sessionData;
  activeSessions[sessionId] = sessionData;

  res.status(200).json({ message: "Inicio de sesión exitoso", sessionId });
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
delete activeSessions[sessionId];
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

  if (email) activeSessions[sessionId].email = email;
  if (nickname) activeSessions[sessionId].nickname = nickname;

  activeSessions[sessionId].lastAccessedAt = new Date();

  res.status(200).json({
    message: "Actualización exitosa",
    session: activeSessions[sessionId],
  });
});

// Endpoint de estado de la sesión
app.post("/status", (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId || !activeSessions[sessionId]) {
    return res.status(404).json({ message: "No hay sesión activa" });
  }

  const lastAccessedAtFormatted = moment
    .tz(activeSessions[sessionId].lastAccessedAt, "America/Mexico_City")
    .format("YYYY-MM-DD HH:mm:ss");
  const inactivityTime = calculateSessionInactivity(activeSessions[sessionId].lastAccessedAt);

  res.status(200).json({
    message: "Sesión activa",
    session: activeSessions[sessionId],
    lastAccessedAt: lastAccessedAtFormatted,
    inactivityTime,
  });
});

// Endpoint para listar sesiones activas
app.get("/currentSessions", (req, res) => {
  const sessions = Object.values(activeSessions).map(session => ({
    sessionId: session.sessionId,
    email: session.email,
    nickname: session.nickname,
    macAddress: session.macAddress,
    ip: session.ip,
    createdAt: moment(session.createdAt).format("YYYY-MM-DD HH:mm:ss"),
    lastAccessedAt: moment(session.lastAccessedAt,"America/Mexico_city").format("YYYY-MM-DD HH:mm:ss"),
    inactivityTime: calculateSessionInactivity(session.lastAccessedAt),
  }));

  res.status(200).json({
    message: "Sesiones activas en la LAN",
    totalSessions: sessions.length,
    sessions,
  });
});

export default app;
