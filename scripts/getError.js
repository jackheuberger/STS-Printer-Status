const snmp = require('snmp-native')
const logger = require('./logger')

const Printer = require('../models/Printer')

let session // Create global session variable

// This is the function that's called in order to update the values
async function updateValues () {
    try {
        const printers = await Printer.find() // Get a list of all the printers and iterate over them
        i = 0
        logger.info('attempting query for ' + printers[i].location)
            try {
                //checkpoint1
                logger.info(session = new snmp.Session({ host: printers[i].url, timeouts: [8000] })) // Create new SNMP session
                session = new snmp.Session({ host: printers[i].url, timeouts: [8000] })
                logger.info('Past Checkpoint 1')
                //checkpoint2
                const toner = await fetchToner(printers[i].location)
                logger.info('Past Checkpoint 2')
                //checkpoint3
                const paper = await fetchPaper(printers[i].location)
                logger.info('Past Checkpoint 3')
                printers[i].set('toner', toner)
                printers[i].set('paper', paper)
                await printers[i].save()
                logger.info('successfully queried ' + printers[i].location)
            } catch (err) {
                logger.error(printers[i].location + ' ' + err)
                printers[i].set('toner', [0,0,0,0,0,0,0,0])
                printers[i].set('paper', [0,0,0,0])
                await printers[i].save()
            }
        
        logger.info('Finished updating printer values')
    } catch (err) {
        logger.error('scripts/updatePrinters updateValues ' + err)
    }
}

// Returns an array of length 8 representing all of the toner values. See /models/Printer
function fetchToner (location) {

    logger.info(`attempting toner fetch for ${location}`)

    return new Promise((resolve, reject) => {

        logger.info('creating new array')

        const toner = new Array(8)
        logger.info('getting subtree')

        logger.info(
        session.getSubtree({ oid: [1, 3, 6, 1, 2, 1, 43, 11, 1, 1, 9, 1]}, function (error, varbinds) {
            
            logger.info('subtree generated')

            // If error, reject the promise
            if (error) {
                logger.error("error fetching toner for " + location + " " + error)
                reject(error)
            } else {
                // Create the array and resolve the promise using the array
                for (let i = 0; i < varbinds.length; i++) {
                    toner[i] = parseInt(varbinds[i].value)
                }
                logger.info(`toner fetch for ${location} successful: ${toner}`)
                resolve(toner)
            }
        }))
    })
}

// Returns an array of length 4 representing paper tray fill
function fetchPaper (location) {
    return new Promise((resolve, reject) => {
        const paper = new Array(4)
        session.getSubtree({ oid: [1, 3, 6, 1, 2, 1, 43, 8, 2, 1, 10]}, (error, varbinds) => {
            if (error) {
                logger.error("error fetching paper for " + location + " " + error)
                reject(error)
            } else {
                // 5 total tray varbinds, first is for bypass -- can be ignored
                for (let i = 1; i < varbinds.length; i++) {
                    // eslint-disable-next-line eqeqeq
                    paper[i - 1] = varbinds[i].value == '-3'
                }
                logger.info(`paper fetch for ${location} successful: ${paper}`)
                resolve(paper)
            }
        })
    })
}

module.exports = getError
