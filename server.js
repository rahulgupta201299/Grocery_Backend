import express from 'express'
import mongoose from 'mongoose'

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
app.get('/',(req,res)=>{
    res.status(200).send('')
})
app.use(express.json())

const ProductSchema=mongoose.Schema({
    category: String,
    SubCategory: String,
    image: String,
    name: String,
    discount: Number,
    price: Number,
    unit: String,
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
app.listen(port,()=>console.log(`listening to port ${port}`))