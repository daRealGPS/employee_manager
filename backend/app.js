const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/auth');
const employeesRoutes = require('./routes/employees');
const attendanceRoutes = require('./routes/attendance');
const tasksRoutes = require('./routes/tasks');
const demoRoutes = require('./routes/demo');

const { AppError } = require('./utils/AppError');
const { requestIdMiddleware } = require('./middleware/requestId');
const { requestLogger } = require('./middleware/requestLogger');
const { errorHandler } = require('./middleware/errorHandler');
const { globalApiLimiter } = require('./middleware/rateLimiters');

const allowedOrigins = [
  process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL_PROD
    : process.env.FRONTEND_URL_DEV
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    console.log("CORS Origin:", origin);
    console.log("Allowed:", allowedOrigins);

    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    console.log("CORS BLOCKED:", origin);
    return callback(new AppError(403, "Not allowed by CORS"));
  },
  credentials: true,
};

const app = express();

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.use(cors(corsOptions));
app.use(express.json({ limit: "20kb" }));

app.use(requestIdMiddleware);
app.use(requestLogger);
app.use(globalApiLimiter);

app.use('/auth', authRoutes);
app.use('/employees', employeesRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/tasks', tasksRoutes);
app.use('/demo', demoRoutes);

app.use((req, res, next) => {
  next(new AppError(404, "Not Found"));
});

app.use(errorHandler);

module.exports = app;