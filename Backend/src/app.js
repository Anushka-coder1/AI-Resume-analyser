const express = require('express');
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express();


app.use(express.json());
app.use(cookieParser())
app.use(cors({
  origin:"https://ai-resume-analyser-ten-zeta.vercel.app/",
  credentials:true
}))

// require all the routes here
const authRoutes = require('./routes/auth.routes.js');
const interviewRouter = require('./routes/interview.routes.js');

// using the routes here
app.use('/api/auth', authRoutes);
app.use('/api/interview', interviewRouter);


module.exports = app;