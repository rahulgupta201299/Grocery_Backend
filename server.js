import express from 'express'
import mongoose from 'mongoose'
import {OAuth2Client} from 'google-auth-library'
import nodemailer from 'nodemailer'
import passwordHash from 'password-hash'
const client=new OAuth2Client('177141942485-mbmruj6ns91r1e8eh02vnm05m3gonop8.apps.googleusercontent.com')
const connection_url="mongodb+srv://rahul2012999:Rahul@1234@cluster0.uqevw.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
const app=express()

app.use((req,res,next)=>{
    res.setHeader("Access-Control-Allow-Origin", "*"),
    res.setHeader("Access-Control-Allow-Headers", "*"),
    next()
})
mongoose.connect(connection_url,{
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
})
const port=process.env.PORT||8000
app.use(express.static('../ecommerce/build'))

app.use(express.json())
app.get('/',(req,res)=>{
    res.status(200).send('')
})
const ProductSchema=mongoose.Schema({
    category: String,
    SubCategory: String,
    image: String,
    name: String,
    discount: Number,
    price: Number,
    unit: String,
    ExtraImages: Array,
    others: Array,
})
const Product=mongoose.model("products", ProductSchema)
app.get('/products',(req,res)=>{
    Product.find((err,data)=>{
        if(err){
            res.status(500).send(err)
        }else{
            res.status(200).send(data)
        }
    })
})
const CategorySchema=mongoose.Schema({
    category: String,
    image: String,
    discount: Number
})
const Category=mongoose.model('category',CategorySchema)
app.get('/category',(req,res)=>{
    Category.find((err,data)=>{
        if(err){
            res.status(500).send(err)
        }
        else{
            res.status(200).send(data)
        }
    })
})
app.get('/products/:id',(req,res)=>{
    Product.find({$or:[{category:req.params.id},{SubCategory:req.params.id}]},(err,data)=>{
        if(err){
            res.status(500).send(err)
        }else{
            res.status(200).send(data)
        }
    })
})
app.get('/products/FindsubCategory/:id',(req,res)=>{
    let map=new Map()
    let arr=[],ans=[]
    Product.find({category:req.params.id},(err,data)=>{
        if(err){
            res.status(500).send(err)
        }else{
            arr=data
        }
       for(let i=0;i<arr.length;i++){
           if(!map.has(arr[i].SubCategory)){
               map.set(arr[i].SubCategory,true)
               ans.push(arr[i].SubCategory)
           }
       }
       res.status(200).send(ans)
    })
    
})
const UserSchema=mongoose.Schema({
    time : { type : Date, default: Date.now },
    name: String,
    email: String,
    password: {
        type: String,select: true
    },
    verified: Boolean
})
const Users=mongoose.model("users",UserSchema)
const googleSchema=mongoose.Schema({
    time : { type : Date, default: Date.now },
    name: String,
    email: String,
    verified: Boolean
})
const googleUser=mongoose.model('googleloginusers',googleSchema)
app.post("/api/googlelogin",(req,res)=>{
    const {tokenID}=req.body
    client.verifyIdToken({idToken: tokenID,audience: '177141942485-mbmruj6ns91r1e8eh02vnm05m3gonop8.apps.googleusercontent.com'}).then(response=>{
        const {email_verified,name,email}=response.payload
        if(email_verified){
            googleUser.find({email:email},(err,data)=>{
                if(err){
                    res.status(500).send(err)
                }
                else if(!data||data.length===0){
                    googleUser.create({
                        name:name,
                        email:email,
                        verified: true
                    })
                }
                res.status(200).send({
                    name: name,
                    email:email,
                    verified: true
                })
            })
        }else{
            res.status(500).send({error:"Something went wrong..."})
        }
        console.log(response.payload)
    })
    
})
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'rahulgupta201299@gmail.com',
      pass: 'rg810943@gmail.com'
    }
  });
  
  
app.post('/user/register',(req,res)=>{
    const {name,email,password}=req.body
    const random=Math.floor(100000 + Math.random() * 900000)
    var mailOptions = {
        from: 'rg810943@gmail.com',
        to: email,
        subject: 'Verification Code',
        text: `Dear ${name}, Your Verification code is ${random}`
      };
    Users.find({email:email},(err,data)=>{
        if(err){
            res.status(500).send(err)
        }
        else if(data.length===0){
            Users.create({
                name: name,
                email:email,
                rand: random,
                password: passwordHash.generate(password),
                verified: false,
            })
            transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                  console.log(error);
                } else {
                  console.log('Email sent: ' + info.response);
                }
            });
            res.status(200).send({
                name:name,
                email:email,
                verified:false,
                message: 'You are registered.Please Verify!',
                rand: random,
                account: false
            })
        }
        else{
            res.status(200).send({
                name:name,
                email:email,
                verified: data.verified,
                message: 'This email is already in use. Please Login or try with another account!',
                account: true
            })
        }
    })
})
app.post('/user/verificationCode',(req,res)=>{
    const {email}=req.body;
    Users.find({email:email},(err,data)=>{
        if(err){
            res.status(500).send(err);
        }else{
            Users.updateOne({email:email},{verified:true},(err)=>{
                if(err){
                    res.status(500).send(err)
                }else{
                    res.status(200).send({
                        name: data[0].name,
                        email: data[0].email,
                        verified: true
                    })
                }
            })
        }
    })
})
app.post('/user/login',(req,res)=>{
    const {email,password} = req.body
    const random=Math.floor(100000 + Math.random() * 900000)
    var mailOptions = {
        from: 'rg810943@gmail.com',
        to: email,
        subject: 'Verification Code',
        text: `Dear User, Your Verification code is ${random}`
      };
    Users.find({email:email},(err,data)=>{
        if(err){
            res.status(500).send(err)
        }else if(data.length){
            if(!data[0].verified&&passwordHash.verify(password, data[0].password)){
                transporter.sendMail(mailOptions, function(error, info){
                    if (error) {
                      console.log(error);
                    } else {
                      console.log('Email sent: ' + info.response);
                    }
                });
            }
            res.status(200).send({
                name:data[0].name,
                email:data[0].email,
                verified: data[0].verified,
                password: passwordHash.verify(password, data[0].password),
                account: true
            })
        }else{
            res.status(200).send({
                account:false,
                message: 'Please register!'
            })
        }
    })
})
app.post("/user/resendcode",(req,res)=>{
    const {email}=req.body
    const random=Math.floor(100000 + Math.random() * 900000)
    var mailOptions = {
        from: 'rg810943@gmail.com',
        to: email,
        subject: 'Verification Code',
        text: `Dear User, Your Verification code is ${random}`
      };
    Users.find({email:email},(err,data)=>{
        if(err){
            res.status(500).send(err)
        }else{
            transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                  console.log(error);
                } else {
                  console.log('Email sent: ' + info.response);
                }
            });
            res.status(200).send({
                rand:random,
                name:data[0].name,
                email:data[0].email,
            })
        }
    })
})
app.post('/product/EachItem',(req,res)=>{
    const {id}=req.body
    Product.find({_id:id},(err,data)=>{
        if(err){
            res.status(500).send(err)
        }else{
            res.status(200).send(data)
        }
    })
})
app.get("/search/suggestion",(req,res)=>{
    const search=req.query.name
    Product.find({ $or: [{ name: { $regex:  search, $options: 'i'} }, { category: { $regex:  search, $options: 'i'} },{ SubCategory: { $regex:  search, $options: 'i'} }] }).then(data=>{
        res.status(200).send(data)
    })
})

const userDetailSchema=mongoose.Schema({
    email: String,
    phone: String,
    Address: String,
    Pincode: String,
})
const userDetail=mongoose.model("checkoutdetails",userDetailSchema)
app.get("/user/phone",(req,res)=>{
    const email=req.query.name
    userDetail.find({email:email},(err,data)=>{
        if(err){
            res.status(500).send(err)
        }else{
            if(!data.length){
                res.status(200).send({message:false})
            }else{
                //console.log(data)
                res.status(200).send({
                    message: true,
                    phone: data[0].phone
                })
            }
        }
    })
})
app.post('/user/phone',(req,res)=>{
    const {email,phone}=req.body
    userDetail.find({email:email},(err,data)=>{
        if(err){
            res.status(500).send(err)
        }else{
            if(!data.length){
                userDetail.create({
                    email: email,
                    phone:phone,
                    Address: "",
                    Pincode: ""
                })
                res.status(200).send({message: true})
            }else{
                userDetail.updateOne({email:email},{phone:phone},(err)=>{
                    if(err){
                        res.status(500).send(err)
                    }else{
                        res.status(200).send(data)
                    }
                })
            }
        }
    })
})
app.get("/user/address",(req,res)=>{
    const email=req.query.name
    userDetail.find({email:email},(err,data)=>{
        if(err){
            res.status(500).send(err)
        }else{
            if(!data.length){
                res.status(200).send({message:false})
            }else{
                //console.log(data)
                res.status(200).send({
                    message: true,
                    Address: data[0].Address,
                    Pincode: data[0].Pincode
                })
            }
        }
    })
})
app.post('/user/address',(req,res)=>{
    const {email,address,pincode}=req.body
    userDetail.find({email:email},(err,data)=>{
        if(err){
            res.status(500).send(err)
        }else{
            if(!data.length){
                userDetail.create({
                    email: email,
                    phone:"",
                    Address: address,
                    Pincode: pincode
                })
                res.status(200).send({message: true})
            }else{
                userDetail.updateOne({email:email},{Address:address,Pincode:pincode},(err)=>{
                    if(err){
                        res.status(500).send(err)
                    }else{
                        res.status(200).send(data)
                    }
                })
            }
        }
    })
})

app.listen(port,()=>console.log(`listening to port ${port}`))