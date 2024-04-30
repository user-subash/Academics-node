const router = require('express').Router()
const {Collections} = require('../constants')

router.get('/', async (req, res)=>
{
    db = req.db
    //convert id to string
    const pipeline = [
        {
            $addFields: {
                _id: {$toString: '$_id'}
            }
        }
    ]
    let courseCategory = await db.collection(Collections.coursecategory)
                                 .aggregate(pipeline)
                                 .toArray()
    res.status(200).json(courseCategory)
})

router.post('/', async (req, res)=>
{
    db = req.db

    CourseCategory = {
        name: req.body.name
    }
    //check if required fields are got correctly
    if(CourseCategory.name == undefined)
    {
        return res.status(400).json({Message: 'Some fields are missing'});
    }

    //check if course category already exists
    courseCategoryList = await db.collection(Collections.coursecategory)
                           .find({name: req.body.name})
                           .toArray()
    if(courseCategoryList.length != 0)
    {
        return res.status(409).json({Message: 'Couse Category already exists'});
    }

    //if everthing is ok then proceed to create a data in database
    await db.collection(Collections.coursecategory).insertOne(CourseCategory)
    .then((result)=>
    {
        res.status(200).json({Message: 'Course category added successfully!'})
    })
    .catch((err)=>
    {
        res.status(500).json({Error: 'Some internal error exists'})
    })
})

module.exports = router 