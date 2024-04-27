const router = require('express').Router()


//get students
router.get('/', async (req, res)=>
{
    db = req.db
    //aggregate student table and department table using  pipeline
    const pipeline = [
      {
        $addFields: {
          convertedDepartmentField: { $toObjectId: "$Department"}
        }
      },
      {
        $lookup: {
          from : 'Departments',
          localField: 'convertedDepartmentField',
          foreignField: '_id',
          as: 'departmentDetails'
        }
      },
  	{
    	$addFields: {
    	  Department: {$arrayElemAt: ['$departmentDetails.Name', 0]},
        CourseType: {$arrayElemAt: ['$departmentDetails.CourseType', 0]},
        Shorthand: {$arrayElemAt: ['$departmentDetails.Shorthand', 0]},
      	_id: {$toString: '$_id'}
    	}
  	},
      {
        $project: {
          convertedDepartmentField: 0,
          departmentDetails: 0
        }
      }
    ]

    let students = await db.collection('Students')
    .aggregate(pipeline)
    .toArray()
    .catch((err)=>
    {
      console.log(err);
      return res.status(500).json({Error: "Internal server error exists!"});
    })

    //check if student exists in database
    if(students.length == 0)
    {
        return res.status(404).json({Message: "No students in the database"});
    }

    res.status(200).json(students);
})

//add students to the database
router.post('/', async(req, res)=>
{
    db = req.db
    // check for required fields exist
    const studentDetails = {
      StudentName: req.body.StudentName.toUpperCase(),
      StudentEmail: req.body.StudentEmail.toLowerCase(),
      RollNo: req.body.RollNo.toUpperCase(),
      Batch: req.body.Batch,
      Department: req.body.Department,
      CurrentYear: req.body.CurrentYear,
      CurrentSemester: req.body.CurrentSemester,
      CGPA: req.body.CGPA,
      ArrearHistory: req.body.ArrearHistory,
      CurrentArrear: req.body.CurrentArrear,
      Status: req.body.Status,
    }

    for(key in studentDetails)
    {
      if(studentDetails[key] == undefined)
      {
        return res.status(400).json({Error: "Required fields are missing"})
      }
    }

    //check for student exists
    let student = await db.collection('Students').find({$or: [{RollNo: req.body.RollNo}, {StudentEmail: req.body.StudentEmail}]})
    .toArray()
    if(student.length !=0 )
    {
        return res.status(400).json({Message: "Student with these details already exists"})
    }

    //if student not available then add them to database
    await db.collection('Students').insertOne(studentDetails)
    .then(()=>
    {
        res.status(200).json({Message: "Student added successfully"})
    })
    .catch((err)=>
    {
        res.status(500).json({Error: "Something went wrong while adding the student"});
    })
})

module.exports = router