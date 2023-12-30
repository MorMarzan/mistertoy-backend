import { ObjectId } from 'mongodb'

import { utilService } from '../../services/util.service.js'
import { logger } from '../../services/logger.service.js'
import { dbService } from '../../services/db.service.js'

export const toyService = {
    remove,
    query,
    getById,
    add,
    update,
    addToyMsg,
    removeToyMsg
}

async function query(filterBy = { name: '', maxPrice: Infinity, inStock: undefined, labels: [] }, sortBy = { type: '', dir: 1 }) {
    try {
        const criteria = { '$and': [] }

        if (filterBy.name) {
            criteria.$and.push({ 'name': { '$regex': filterBy.name, '$options': 'i' } })
        }
        if (filterBy.maxPrice !== Infinity) {
            criteria.$and.push({ 'price': { '$lte': filterBy.maxPrice } })
        }
        if (filterBy.inStock !== undefined) {
            criteria.$and.push({ 'inStock': filterBy.inStock })
        }
        if (filterBy.labels.length) {
            criteria.$and.push({ 'labels': { '$in': filterBy.labels } })
        }
        if (criteria.$and.length === 0) {
            delete criteria.$and
        }

        const sortCriteria = {}
        if (sortBy.type) {
            sortCriteria[sortBy.type === 'createdAt' ? '_id' : sortBy.type] = sortBy.dir
        }

        const collection = await dbService.getCollection('toy')
        var toys = await collection.find(criteria).sort(sortCriteria).toArray()
        return toys

    } catch (err) {
        logger.error('cannot find toys', err)
        throw err
    }
}

async function getById(toyId) {
    try {
        const collection = await dbService.getCollection('toy')
        const toy = await collection.findOne({ _id: new ObjectId(toyId) })
        return toy
    } catch (err) {
        logger.error(`while finding toy ${toyId}`, err)
        throw err
    }
}

async function remove(toyId) {
    try {
        const collection = await dbService.getCollection('toy')
        await collection.deleteOne({ _id: new ObjectId(toyId) })
    } catch (err) {
        logger.error(`cannot remove toy ${toyId}`, err)
        throw err
    }
}

async function add(toy) {
    try {
        const collection = await dbService.getCollection('toy')
        await collection.insertOne(toy)
        return toy
    } catch (err) {
        logger.error('cannot insert toy', err)
        throw err
    }
}

async function update(toy) {
    try {
        const toyToSave = {
            name: toy.name,
            inStock: toy.inStock,
            price: +toy.price,
            labels: toy.labels
        }
        const collection = await dbService.getCollection('toy')
        await collection.updateOne({ _id: new ObjectId(toy._id) }, { $set: toyToSave })
        return toy
    } catch (err) {
        logger.error(`cannot update toy ${toy._id}`, err)
        throw err
    }
}

async function addToyMsg(toyId, msg) {
    try {
        msg.id = utilService.makeId()
        const collection = await dbService.getCollection('toy')
        await collection.updateOne({ _id: new ObjectId(toyId) }, { $push: { msgs: msg } })
        return msg
    } catch (err) {
        logger.error(`cannot add toy msg ${toyId}`, err)
        throw err
    }
}

async function removeToyMsg(toyId, msgId) {
    try {
        const collection = await dbService.getCollection('toy')
        await collection.updateOne({ _id: new ObjectId(toyId) }, { $pull: { msgs: { id: msgId } } })
        return msgId
    } catch (err) {
        logger.error(`cannot add toy msg ${toyId}`, err)
        throw err
    }
}