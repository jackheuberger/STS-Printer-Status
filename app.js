const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const exphbs = require('express-handlebars')
const methodOverride = require('method-override')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const cron = require('node-cron')

const connectDB = require('./config/db')
const updateValues = require('./scripts/updatePrinters')
const generateTable = require('./scripts/genTable')
const sendEmail = require('./scripts/sendEmail')
const generateReport = require('./scripts/generateReport')

const config = require('./config/config')

// Load /config/env
dotenv.config({
    path: './config/.env'
})

// Define Express app
const app = express()

// Enable CORS
app.use(cors())

// Body parsing
app.use(express.urlencoded({
    extended: false
}))
app.use(express.json())

// Flash messages
app.use(cookieParser('' + process.env.COOKIE_SECRET))
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: '' + process.env.SESSION_SECRET,
    cookie: { maxAge: 60000 }
}))

app.use((req, res, next) => {
    res.locals.message = req.session.message
    delete req.session.message
    next()
})

// Method Override
app.use(methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        const method = req.body._method
        delete req.body._method
        return method
    }
}))

// Connect to MongoDB
connectDB()
mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB')
})

// Serve CSS from /public
// eslint-disable-next-line node/no-path-concat
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')) // redirect bootstrap JS
// eslint-disable-next-line node/no-path-concat
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')) // redirect JS jQuery
// eslint-disable-next-line node/no-path-concat
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')) // redirect CSS bootstrap
// eslint-disable-next-line node/no-path-concat
app.use('/icons', express.static(__dirname + '/node_modules/bootstrap-icons'))

// Enable handlebars
app.engine('.hbs', exphbs({
    defaultLayout: 'main',
    extname: '.hbs'
}))
app.set('view engine', '.hbs')

// Define route extensions
app.use('/', require('./routes/index'))
app.use('/groups', require('./routes/groups'))
app.use('/printers', require('./routes/printers'))
app.use('/users', require('./routes/users'))
app.use('/static', express.static('public/tables'))
app.use('/login', require('./routes/login'))

// Expose port
const port = process.env.PORT || 8080
app.listen(port, () => {
    console.log(`Server hosted on port ${port}`)
})

// Update database values and create new tables every 3 minutes
console.log('scheduling update and generation...')
cron.schedule('*/3 * * * *', async () => {
    await updateValues()
    await generateTable()
}, {})

// Send emails every 3 hours
console.log('scheduling emails...')
cron.schedule('0 */' + config.email_hours + ' * * *', async () => {
    sendEmail().catch(console.error)
}, {})

console.log('scheduling report...')
cron.schedule('0 0 * * 1', async () => {
    await generateReport()
})
