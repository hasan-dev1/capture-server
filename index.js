const express = require('express');
const app = express()
const cors = require('cors');
const port = process.env.PORT|| 5000;
require('dotenv').config()
const jwt = require('jsonwebtoken')

app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_USER_PASSWORD}@cluster0.v48zzim.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
});

function varifyjwt(req, res, next){
    const headerInfo = req.headers.authdata;

    if(!headerInfo){
        return res.status(401).send({message:'Unauthorize Access'})
    }

    const token = req.headers.authdata.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_SECRET_TOKEN_CAPTURE, function(err, decoded){
        if(err){
            return res.status(403).send({message:'Forbidden'})
        }
        req.decoded = decoded;
    });
    next()
}

async function run(){
    try{
        const bannerCollection = client.db('captureCollection').collection('banner');
        const servicesCollection = client.db('captureCollection').collection('services');
        const pricingPlanCollection = client.db('captureCollection').collection('pricingplan');
        const previousworkCollection = client.db('captureCollection').collection('previouswork');
        const userreviewCollection = client.db('captureCollection').collection('userreview');

        //jwt
        app.post('/jwt',(req, res)=>{
            const currentuser = req.body.currentuser
            const token = jwt.sign({currentuser}, process.env.ACCESS_SECRET_TOKEN_CAPTURE, { expiresIn: '1h' })
            res.send({token})
        })

        app.get('/homebanner',async(req, res)=>{
            const query = {}
            const result = await bannerCollection.find(query).toArray()
            res.send(result)
        })

        app.get('/services',async (req, res)=>{
            const query = {}
            const result = await servicesCollection.find(query).sort({"addedDate":-1}).limit(3).toArray();
            res.send(result)
        })
        app.post('/services',async (req, res)=>{
            const serviceItem = req.body;
            const result = await servicesCollection.insertOne(serviceItem)
            res.send(result)
        })

        app.get('/allservices',async (req, res)=>{
            const query = {}
            const result = await servicesCollection.find(query).sort({"addedDate":-1}).toArray();
            res.send(result)
        })
        app.get('/allservices/:id',async (req, res)=>{
            const query = {_id:ObjectId(req.params.id)}
            const result = await servicesCollection.findOne(query)
            res.send(result)
        })
        app.get('/pricingplan',async(req, res)=>{
            const query = {};
            const result = await pricingPlanCollection.find(query).toArray()
            res.send(result)
        })
        app.get('/previouswork',async (req, res)=>{
            const query = {}
            const result = await previousworkCollection.find(query).toArray()
            res.send(result)
        })
        app.get('/allreviewduserdata/:id',async (req, res)=>{
            const reviewid = req.params.id;
            const query = {reviewedpostid:reviewid}
            const result = await userreviewCollection.find(query).toArray()
            res.send(result)
        })

        app.get("/userownreview/:email", varifyjwt, async (req, res) => {
            const decoded = req.decoded;
            if(decoded?.currentuser !== req.params.email){
                res.status(403).send({message:'You cant Accese this data'})
            }

            const email = req.params.email
            const query = {useremail:email};
            const result = await userreviewCollection.find(query).toArray();
            res.send(result);
        });
        app.get('/updatereview/:reviewId',async(req, res)=>{
            const id = req.params.reviewId;
            const query = {_id: ObjectId(id)}
            const result = await userreviewCollection.findOne(query);
            res.send(result)

        });
        app.post('/updatereview/:reviewId',async(req, res)=>{
            const id = req.params.reviewId;
            const query = {_id: ObjectId(id)}
            const formInfo = req.body;

            const option = {upsert:true}
            const updatedoc = {
              $set: {
                userimg: formInfo.userimage,
                userwebsite: formInfo.websitename,
                desctext:formInfo.descryption,
                ratingpoint: formInfo.ratingnumber,
              },
            };
            const result = await userreviewCollection.updateOne(query, updatedoc, option)
            res.send(result)
        });
        
        app.delete("/userownreview/:deletepostId", async (req, res) => {
            const deletepostId = req.params.deletepostId;
            const query = {_id:ObjectId(deletepostId)};
            const result = await userreviewCollection.deleteOne(query);
            res.send(result);
        });

        app.get('/updateuserreview/:id',async(req, res)=>{
            const id = await req.params.id;
            const query = {_id: ObjectId(id)}
            const result = await userreviewCollection.findOne(query)
            res.send(result);
        })
    
        app.post('/allreviewduserdata',async (req, res)=>{
            const review = req.body;
            const result = await userreviewCollection.insertOne(review)
            res.send(result)
        })
    }finally{

    }
}

run().catch(err => console.error(err))



app.get('/',(req, res)=>{
    res.send('Your server is conected.')
})
app.listen(port, ()=>{
    console.log(`Your server Running on ${port}`)
})
