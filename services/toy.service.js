
import fs from 'fs'
import { utilService } from './util.service.js'
import { loggerService } from './logger.service.js'

export const toyService = {
    query,
    getById,
    remove,
    save
}

const toys = utilService.readJsonFile('data/toy.json')

function query(filterBy = { name: '', maxPrice: 0, inStock: undefined, labels: '' }, sortBy = { type: '', dir: 1 }) {
    let toysToReturn = toys
    if (filterBy.name) {
        const regExp = new RegExp(filterBy.name, 'i')
        toysToReturn = toysToReturn.filter(toy => regExp.test(toy.name))
    }
    if (filterBy.inStock !== undefined) {
        toysToReturn = toysToReturn.filter(toy => toy.inStock === filterBy.inStock)
    }
    if (filterBy.maxPrice) {
        toysToReturn = toysToReturn.filter(toy => toy.price <= filterBy.maxPrice)
    }
    if (filterBy.labels) {
        toysToReturn = toysToReturn.filter(toy => toy.labels.includes(filterBy.labels))
    }
    if (sortBy.type === 'price') { //numeric
        toysToReturn.sort((b1, b2) => (b1.price - b2.price) * sortBy.dir)
    }
    else if (sortBy.type === 'createdAt') { //numeric
        toysToReturn.sort((b1, b2) => (b1.createdAt - b2.createdAt) * sortBy.dir)
    }
    else if (sortBy.type === 'name') { //abc
        toysToReturn.sort((b1, b2) => (b1.name.localeCompare(b2.name) * sortBy.dir))
    }

    return Promise.resolve(toysToReturn)
}

function getById(toyId) {
    const toy = toys.find(toy => toy._id === toyId)
    return Promise.resolve(toy)
}

function remove(toyId) {
    const idx = toys.findIndex(toy => toy._id === toyId)
    if (idx === -1) return Promise.reject('No Such Toy')
    toys.splice(idx, 1)
    return _saveToysToFile()
}

function save(toy) {
    if (toy._id) {
        const toyToUpdate = toys.find(currToy => currToy._id === toy._id)
        toyToUpdate.name = toy.name
        toyToUpdate.inStock = toy.inStock
        toyToUpdate.price = toy.price
        toyToUpdate.labels = toy.labels
        toy = toyToUpdate
    } else {
        toy._id = utilService.makeId()
        toy.createdAt = Date.now()
        toys.push(toy)
    }

    return _saveToysToFile().then(() => toy)
}


function _saveToysToFile() {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(toys, null, 4)
        fs.writeFile('data/toy.json', data, (err) => {
            if (err) {
                loggerService.error('Cannot write to toys file', err)
                return reject(err)
            }
            resolve()
        })
    })
}
