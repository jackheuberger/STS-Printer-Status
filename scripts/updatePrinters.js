const snmp = require('snmp-native')

const Printer = require('../models/Printer')

let session // Create global session variable

// This is the function that's called in order to update the values
async function updateValues () {
  console.log('Updating printer values...')
  const printers = await Printer.find() // Get a list of all the printers and iterate over them
  for (let i = 0; i < printers.length; i++) {
    session = new snmp.Session({ host: printers[i].url }) // Create new SNMP session
    // console.log("fetching " + printers[i].location + " values")
    const toner = await fetchToner()
    const paper = await fetchPaper()
    // console.log(toner)
    // console.log(paper)
    printers[i].set('toner', toner)
    printers[i].set('paper', paper)
    await printers[i].save()
  }
  console.log('---Completed---')
}

// Returns an array of length 8 representing all of the toner values. See /models/Printer
function fetchToner () {
  return new Promise((resolve, reject) => {
    const toner = new Array(8)
    session.getSubtree({ oid: [1, 3, 6, 1, 2, 1, 43, 11, 1, 1, 9, 1] }, function (error, varbinds) {
      // If error, reject the promise
      if (error) {
        console.error(error)
        reject(error)
      } else {
        // Create the array and resolve the promise using the array
        for (let i = 0; i < varbinds.length; i++) {
          // console.log(varbinds[i].value)
          toner[i] = parseInt(varbinds[i].value)
        }
        resolve(toner)
      }
    })
  })
}

// Returns an array of length 4 representing paper tray fill
function fetchPaper () {
  return new Promise((resolve, reject) => {
    const paper = new Array(4)
    session.getSubtree({ oid: [1, 3, 6, 1, 2, 1, 43, 8, 2, 1, 10] }, (error, varbinds) => {
      if (error) {
        console.error(error)
        reject(error)
      } else {
        // 5 total tray varbinds, first is for bypass -- can be ignored
        for (let i = 1; i < varbinds.length; i++) {
          paper[i - 1] = varbinds[i].value == '-3'
        }
        resolve(paper)
      }
    })
  })
}

module.exports = updateValues