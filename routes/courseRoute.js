const router = require('express').Router()

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
          }
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
        $project: {
          EligibleDepartments: 0,
          convertedEligibleDepartments: 0
        }
      }
    ]
    
    courses = await db.collection('Courses')
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
    courseDetials = {
      CourseCode: req.body.CourseCode,
      CourseName: req.body.CourseName,
      Regulation: req.body.Regulation,
      EligibleYear: req.body.EligibleYear,
      EligibleSemester:  req.body.EligibleSemester,
      CourseCategory: req.body.CourseCategory,
      EligibleDepartments: req.body.EligibleDepartments
    }

    for(key in courseDetials)
    {
        if(courseDetials[key] == undefined || courseDetials.EligibleDepartments.length == 0)
          return res.status(400).json({Message: "Some fields are missing"});
    }

    //check if course already exists
    let courses = await db.collection('Courses').find({CourseCode: req.body.CourseCode})
    .toArray()
    if(courses.length != 0)
    {
        return res.status(409).json({Message: `${req.body.CourseCode} Course code already exists in the database!`})
    }

    //If everything is ok then proceed for database conneciton
    db.collection("Courses").insertOne(courseDetials)
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