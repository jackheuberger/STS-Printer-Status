const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({path: './config/.env'});

const app = express();

app.use(cors());
app.use(express.json());

//Connect to MongoDB
connectDB()
const connection = mongoose.connection;
connection.once('open', () => {
    console.log("Connected to MongoDB");
});

//Enable handlebars
app.engine('.hbs', exphbs({
    defaultLayout: 'main',
    extname: '.hbs'
}))
app.set('view engine', '.hbs')

//Routes
app.use('/', require('./routes/index'))

//Set port
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server hosted on port ${port}`);
});
