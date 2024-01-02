import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
// import {asyncLocalStorage} from '../../services/als.service.js'
import mongodb from 'mongodb'
const { ObjectId } = mongodb

async function query(filterBy = {}) {
    try {
        const criteria = _buildCriteria(filterBy)
        const collection = await dbService.getCollection('review')
        // const reviews = await collection.find(criteria).toArray()
        var reviews = await collection.aggregate([
            {
                $match: criteria
            },
            {
                $addFields: {
                    convertedUserId: { $toObjectId: "$userId" },
                    convertedToyId: { $toObjectId: "$toyId" }
                }
            },
            {
                $lookup:
                {
                    localField: 'convertedUserId',
                    from: 'user',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup:
                {
                    localField: 'convertedToyId',
                    from: 'toy',
                    foreignField: '_id',
                    as: 'toy'
                }
            },
            {
                $unwind: {
                    path: '$toy',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    convertedUserId: 0,
                    convertedToyId: 0,
                    userId: 0,
                    toyId: 0,
                    "user.isAdmin": 0,
                    "user.score": 0,
                    "user.password": 0,
                    "user.fullname": 0,
                    "toy.labels": 0,
                    "toy.inStock": 0,
                }
            }
        ]).toArray()

        return reviews
    } catch (err) {
        logger.error('cannot find reviews', err)
        throw err
    }

}

async function remove(reviewId, loggedinUser) {
    try {
        const collection = await dbService.getCollection('review')
        // remove only if user is owner/admin
        const criteria = { _id: new ObjectId(reviewId) }
        if (!loggedinUser.isAdmin) criteria.userId = loggedinUser._id
        const { deletedCount } = await collection.deleteOne(criteria)
        return deletedCount
    } catch (err) {
        logger.error(`cannot remove review ${reviewId}`, err)
        throw err
    }
}


async function add(review) {
    try {
        // const reviewToAdd = {
        //     userId: ObjectId(review.userId),
        //     aboutUserId: ObjectId(review.aboutUserId),
        //     txt: review.txt
        // }
        const collection = await dbService.getCollection('review')
        await collection.insertOne(review)
        return review
    } catch (err) {
        logger.error('cannot insert review', err)
        throw err
    }
}

function _buildCriteria(filterBy) {
    const criteria = {}
    if (filterBy.toyId) criteria.toyId = filterBy.toyId
    return criteria
}

export const reviewService = {
    query,
    remove,
    add
}


