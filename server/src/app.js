const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const tokensRouter = require('./router/tokensRouter');
const authRouter = require('./router/authRouter');
const advertRouter = require('./router/advertRouter');
const userRouter = require('./router/userRouter');

const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

app.use('/api/adverts', advertRouter)
app.use('/api/users', userRouter);
app.use('/api/tokens', tokensRouter);
app.use('/api/auth', authRouter);

module.exports = app;
