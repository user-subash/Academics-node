const router = require('express').Router()

//get all designations
router.get('/', async (req, res)=>
{
    db = req.db
    let designations = []
    db.collection('designations')
    .find()
    .forEach((designation)=>{
      designation._id = designation._id.toString()
      designations.push(designation)
    })
    .then(()=>{
      if(designations.length === 0)
      {
        return res.status(404).json({Message: "No designations added!"})
      }
      return res.status(200).json(designations)
    })
    .catch(()=>
    {
      console.log(error);
      res.status(500).json({Error: "Some internal server error exists"})
    })
})

//add designations
router.post("/", async (req, res)=>
{
    db = req.db
    //check if necessary fields are filled without null
    const designationDetails = {
      Designation: req.body.Designation
    }

    if(designationDetails.Designation == undefined)
    {
      return res.status(400).json({message: "Some fields are missing!"});
    }

    //check for existance of designations
    const DesignationExists = await db.collection('designations').find({Designation: req.body.Designation})
                                                                 .toArray();
    if(DesignationExists.length != 0)
    {
      return res.status(409).json({message: "Designation already exists!"});
    }

    //if designation doesn't exists then proceed for new  designation creation
    await db.collection('designations').insertOne(designationDetails)
    .then((data)=>{
      return res.status(200).json({Message: `${req.body.Designation} added successfully`})
    })
    .catch((err)=>
    {
      console.log(err);
      return res.status(500).json({Error: "Some internal error exists"})
    })
})

module.exports = router