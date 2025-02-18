const express = require('express')
const router = express.Router()

const Printer = require('../models/Printer')
const User = require('../models/User')

const path = require('path')
const csv = require('csvtojson')
const logger = require('../scripts/logger')

// Desc: The page where users are listed and can be created
// Route: GET /users/
router.get('/', async (req, res) => {
    if (!req.session.loggedIn) {
        return res.redirect('/login')
        return
    }
    try {
        const users = await User.find({}).lean()
        res.render('user', {
            users
        })
    } catch (err) {
        logger.error(err)
        return res.render('error/505')
    }
})

// Desc: The endpoint at which POST requests are handled to create new users
// Route: POST /users/add
router.post('/add', async (req, res) => {
    try {
        if (req.body.firstname == '' || req.body.firstname == null || req.body.lastname == '' || req.body.lastname == null) {
            req.session.message = {
                type: 'danger',
                title: 'Please fill out ALL the required forms!'
            }
            req.error('User add form incorrect')
            return res.redirect('/users/add')
        } else {
            await User.create(req.body)
            req.session.message = {
                type: 'primary',
                message: 'Success!'
            }
            logger.info('Created user ' + req.body.firstname + ' ' + req.body.lastname)
            return res.redirect('/users/')
        }
    } catch (err) {
        logger.error(err)
        return res.render('error/505')
    }
})

router.get('/import', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/samples', 'users.csv'))
})

router.post('/import', async (req, res) => {
    try {
        // Make sure a file was uploaded
        if (!req.files || Object.keys(req.files).length === 0) {
            req.session.message = {
                type: 'warning',
                title: 'A file was not uploaded!',
                message: ''
            }
            logger.warn('no file uploaded user import')
            return res.redirect('/users')
        }

        // Make sure the file is a csv and that there is 1 file
        if (!(req.files.userImport.name).includes('.csv') || Object.keys(req.files).length > 1) {
            req.session.message = {
                type: 'warning',
                title: 'File import error!',
                message: 'Make sure to upload a CSV and to upload only one file.'
            }
            logger.warn('User import file error')
            return res.redirect('/users')
        }

        const upload = await csv().fromString(req.files.userImport.data.toString('utf8'))
        for (let i = 0; i < upload.length; i++) {
            await User.create(upload[i])
            logger.info('imported user ' + i)
        }
        logger.info('finished importing users')
        return res.redirect('/users')
    } catch (err) {
        logger.error(err)
        return res.render('error/505')
    }
})

// Desc: The endpoint for DELETE requests to delete users.
// Route: DELETE /groups/:id
router.delete('/:id', async (req, res) => {
    try {            
            logger.info("attempting to delete user")
            await User.findByIdAndDelete({ _id: req.params.id })
            req.session.message = {
                type: 'primary',
                message: 'Success!'
            }
            logger.info('deletion successful')
            return res.redirect('/users')

    } catch (err) {
        logger.error(err)
        return res.render('error/505')
    }
})

module.exports = router
