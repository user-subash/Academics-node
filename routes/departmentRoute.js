const router = require('express').Router()

//get all the departments
router.get("/", (req, res) => {
    db = req.db
    let departments = [];
    db.collection('Departments')
    .find({}, {}) 
    .forEach((department) => 
    {
        department._id = department._id.toString(); // convert id to string for json response
        departments.push(department)
    })
    .then(() => {
    if(departments.length === 0)
    {
        return res.status(404).send("No Departments Found");
    }
    res.status(200).json(departments);
    })
    .catch((err) => {
        res.status(500).json({ error: "Internal server error" });
    });
});

//add departments
router.post('/', async (req, res)=>
{
    db = req.db
    //check for fields missing or inappropriate fields in request
    const DepartmentData = {
      Name: req.body.Name,
      Shorthand: req.body.Shorthand,
      DepartmentStatus: req.body.DepartmentStatus,
      CourseType: req.body.CourseType
    }
    for(key in DepartmentData)
    {
      if(DepartmentData[key] == undefined)
        return res.status(400).json({Error: "Some fields are missing!"});
    }

    //check for departement existence
    const DepartmentExists = await db.collection('Departments').find({Name: DepartmentData.Name.toUpperCase()})
                                                 .toArray();
    if(DepartmentExists.length != 0)
    {
        return res.status(409).json({Error: `${DepartmentData.Name} Department already exists!`})
    }

    //if departemnt doesn't exists then proceed for new department creation
    db.collection('Departments').insertOne(DepartmentData)
    .then((data) =>  
    {
       res.status(200).send(`${DepartmentData.Name} department added successfully`)
    })
    .catch((err) =>    
    {
       console.error(err);
       res.status(500).json({Error: "Something went wrong couldn't add department"});
    });
})

module.exports = router