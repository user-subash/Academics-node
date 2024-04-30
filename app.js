const express = require('express')
const app = express()
const PORT = 3000
const {connectToDB, getDB} = require('./db')

const designationRoute = require('./routes/designationRoute')
const facultyRoute = require('./routes/facultyRoute')
const studentRoute = require('./routes/studentRoute')
const departmentRoute = require('./routes/departmentRoute')
const courseRoute = require('./routes/courseRoute')
const courseCategoryRoute = require('./routes/courseCategoryRoute')

app.use(express.json())
let db

app.use((req, res, next)=>
{
  req.db = getDB()
  next()
})

//if only connection to database exists then only you should be able to listen to incoming requests
connectToDB((err)=>
{
    if(!err)
    {
        console.log("Connected to DB");
        app.listen(PORT, ()=>
        {
            console.log(`Server is running on port ${PORT}`);
        })
        db = getDB()
    }
})

app.use('/designation', designationRoute)
app.use('/student', studentRoute)
app.use('/course', courseRoute)
app.use('/faculty', facultyRoute)
app.use('/department', departmentRoute)
app.use('/courseCategory', courseCategoryRoute)