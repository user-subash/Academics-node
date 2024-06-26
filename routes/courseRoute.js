const router = require('express').Router()
const {Collections} = require('../constants')

//get all courses
router.get('/', async (req, res)=>
{
    db = req.db
    const pipeline = [
      {
        $addFields: {
          convertedEligibleDepartments: {
            $map: {
              input: '$EligibleDepartments',
              as: 'deptId',
              in: { $toObjectId: '$$deptId' }
            }
          },
          convertedCourseCategory: 
          {
            $toObjectId: '$CourseCategory'
          },
        }
      },
      {
        $lookup: {
          from: 'Departments',
          localField: 'convertedEligibleDepartments',
          foreignField: '_id',
          as: 'eligibleDepartments'
        }
      },
      {
        $lookup: {
          from: 'CourseCategory',
          localField: 'convertedCourseCategory',
          foreignField: '_id',
          as: 'CourseTypeArray'
        }
      },
      {
        $addFields: {
          CourseTypeObj: { $arrayElemAt: ["$CourseTypeArray", 0] }
        }
      },
      {
        $addFields: {
          CourseType: "$CourseTypeObj.name"
        }
      },
      {
        $project: {
          EligibleDepartments: 0,
          convertedEligibleDepartments: 0,
          convertedCourseCategory: 0,
          CourseCategory: 0,
          CourseTypeArray: 0,
          CourseTypeObj: 0 
        }
      }
    ]
    
    
    
    courses = await db.collection(Collections.courses)
    .aggregate(pipeline)
    .toArray()
    .catch((err)=>
    {
        console.log(err)
        return res.status(500).json({Error: 'Some internal error exists'});
    })

    //if course length 0 then return no course exists
    if(courses.length == 0)
    {
        return res.status(404).json({Message: 'No Courses were added'})
    }
    console.log(courses)
    //convert department object id to string
    courses = courses.map((course)=>{
      course.eligibleDepartments.map((department)=>
      {
          department._id = department._id.toString();
          return department
      })
      return course
    })

    return res.status(200).json(courses);
})

//add courses
router.post('/', async (req, res)=>
{
    db = req.db
    //check if all required fields exists
    courseDetails = {
      CourseCode: req.body.CourseCode,
      CourseName: req.body.CourseName,
      Regulation: req.body.Regulation,
      EligibleYear: req.body.EligibleYear,
      EligibleSemester:  req.body.EligibleSemester,
      CourseCategory: req.body.CourseCategory,
      EligibleDepartments: req.body.EligibleDepartments
    }

    for(key in courseDetails)
    {
        if(courseDetails[key] == undefined || courseDetails.EligibleDepartments.length == 0)
          return res.status(400).json({Message: "Some fields are missing"});
    }

    //check if course already exists
    let courses = await db.collection(Collections.courses).find({CourseCode: req.body.CourseCode})
    .toArray()
    if(courses.length != 0)
    {
        return res.status(409).json({Message: `${req.body.CourseCode} Course code already exists in the database!`})
    }

    //If everything is ok then proceed for database conneciton
    db.collection("Courses").insertOne(courseDetails)
    .then((result) =>
    {
        res.status(200).json({Message:"Successfully added the new course!"});
    })
    .catch((errr)=>
    {
        console.log(err)
        res.status(500).json({Error: "Internal server error exists!"});
    })
})


module.exports = router