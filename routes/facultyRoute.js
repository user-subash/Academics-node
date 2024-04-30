const router = require('express').Router()
const {ObjectId} = require('mongodb')
const {Collections} = require('../constants')

//get all the faculties
router.get("/", async (req, res)=>
{
    db = req.db
    let result = []
    const pipelines = [
      {
        $addFields: {
          convertedFacultyDesignation: { $toObjectId: "$FacultyDesignation" },
          convertedFacultyDepartment: {$toObjectId: "$FacultyDepartment"}
        }
      },
      {
        $lookup: {
          from: "designations",
          localField: "convertedFacultyDesignation",
          foreignField: "_id",
          as: "designation"
        }
      },
      {
        $lookup: {
          from: "Departments",
          localField: "convertedFacultyDepartment",
          foreignField: "_id",
          as: "department"
        }
      },
      {
        $addFields: {
          departmentDetails: {
            $arrayElemAt: ["$department", 0]
          },
          designationDetails: {
            $arrayElemAt: ["$designation", 0]
          }
        }
      },
      {
        $project: {
          FacultyDesignation: 0,
          FacultyDepartment: 0,
          convertedFacultyDesignation: 0,
          convertedFacultyDepartment: 0,
          departmentDetails: {
            _id: 0,
            DepartmentStatus: 0
          },
          designationDetails: 
          {
            _id: 0
          },
          designation: 0,
          department: 0
        }
      }  
  ]
    result = await db.collection(Collections.faculties)
      .aggregate(pipelines)
      .toArray();

    //If faculties not found return no faculty found
    if(result.length === 0 )
    {
      return res.status(404).json({message: "No faculty found!"});
    }

    //convert the object _id to string _id for further processing
    result = result.map((faculty)=>
    {
      faculty._id = faculty._id.toString();
      return faculty;
    })
    res.status(200).json(result);
})

//get faculty by their email id
router.get("/mail/:mail", async (req, res)=>
{
    db = req.db
    //pipelines stage for foreign and primary key lookups
    const pipelines = [
        {
            $match: {FacultyMail: req.params.mail.toLowerCase()}
        },
        {
          $addFields: {
            convertedFacultyDesignation: { $toObjectId: "$FacultyDesignation" },
            convertedFacultyDepartment: {$toObjectId: "$FacultyDepartment"}
          }
        },
        {
          $lookup: {
            from: "designations",
            localField: "convertedFacultyDesignation",
            foreignField: "_id",
            as: "designation"
          }
        },
        {
          $lookup: {
            from: "Departments",
            localField: "convertedFacultyDepartment",
            foreignField: "_id",
            as: "department"
          }
        },
        {
          $addFields: {
            departmentDetails: {
              $arrayElemAt: ["$department", 0]
            },
            designationDetails: {
              $arrayElemAt: ["$designation", 0]
            }
          }
        },
        {
          $project: {
            _id: 0,
            FacultyDesignation: 0,
            FacultyDepartment: 0,
            convertedFacultyDesignation: 0,
            convertedFacultyDepartment: 0,
            departmentDetails: {
              _id: 0,
              DepartmentStatus: 0
            },
            designationDetails: 
            {
              _id: 0
            },
            designation: 0,
            department: 0
          }
        }  
    ]

    //get results from database
    const result = await db.collection(Collections.faculties)
    .aggregate(pipelines)
    .toArray();

    //check for faculties list empty or not
    if(result.length === 0)
    {
      return res.status(404).json({Error: "No faculties found!"});
    }

    //convert the object _id to string _id for further processing
    result = result.map((faculty)=>
    {
        faculty._id = faculty._id.toString();
        return faculty;
    })
    res.status(200).json(result);
})

//get faculty by their department
router.get(('/departments/:department'), async (req, res)=>
{
  db = req.db
  let departments = []
  await db.collection(Collections.departments)
    .find({Name: req.params.department})
    .forEach(department=> departments.push(department))
  
  if(departments.length == 0)
  {
    return res.status(200).json("No departments found for this request");
  }
  else
  {
    let faculties = []
    await db.collection(Collections.faculties)
      .find({FacultyDepartment: departments[0]._id.toString()})
      .forEach((faculty) => {
        //convert faculty id from object to string
        faculty._id =  faculty._id.toString()
        faculties.push(faculty)
      })
    if(faculties.length === 0)
    {
      return res.status(404).json({Message: "No faculties found for this department!"});
    }
    res.status(200).json(faculties)
  }
    
    
})

//add faculties
router.post('/', async (req, res)=>
{
    db = req.db
    //check if all fields are got appropriately
    const facultyData = {
        FacultyName: req.body.FacultyName,
        FacultyMail: req.body.FacultyMail,
        FacultyDesignation: req.body.FacultyDesignation,
        FacultyDepartment: req.body.FacultyDepartment
    }
    for(key in facultyData)
    {
        if(facultyData[key] == undefined)
            return res.status(400).json({Error: "Some fields are missing"});
    }

    //validate the Object Id of string to be stored
    if(!ObjectId.isValid(req.body.FacultyDesignation))
    {
        return res.status(400).json({Warning: 'Designation id not valid!'});
    }
    if(!ObjectId.isValid(req.body.FacultyDepartment))
    {
        return res.status(400).json({Warning: 'Department id not valid!'});
    }

    //check if the faculty mail already exists
    const FacultyExists = await db.collection(Collections.faculties).find({FacultyMail: req.body.FacultyMail})
                                                      .toArray()
    

    if(FacultyExists.length != 0)
    {
        return res.status(409).json({Error: `Faculty with is email ${req.body.FacultyMail} already exists`})
    }

    //add faculty to the db
    await db.collection(Collections.faculties).insertOne(facultyData)
    .then(()=>
    {
        res.status(200).json({Message: "Faculty added successfully"});
    })
    .catch((err)=>
    {
        res.status(500).json({Error: "Inernal server error! contact admin for logs"})
    })
})

module.exports = router