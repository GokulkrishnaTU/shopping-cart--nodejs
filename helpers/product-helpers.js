const { promiseCallback } = require('express-fileupload/lib/utilities');
var db=require('../config/connection')
var collection=require('../config/collection');
const async = require('hbs/lib/async');
const { promise, reject } = require('bcrypt/promises');
const { ObjectID } = require('bson');
var objectId=require('mongodb').ObjectId

module.exports={

    addProduct:(product,callback)=>{
        // console.log(product);

        db.get().collection('list').insertOne(product).then((data)=>{
            callback(data.insertedId)
        })


    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },


    deleteProduct:(proId)=>{
        return new Promise((resolve,reject)=>{
            console.log(proId);
            console.log(ObjectID( proId));
        db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:ObjectID(proId)}).then((response)=>{
            console.log(response);
            resolve(response)
        })
        })

    },

  getProductDetials:(proId)=>{
        return new Promise((resolve,reject)=>{
            // console.log(proId);
            // console.log(ObjectID( proId));
        db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:ObjectID(proId)}).then((product)=>{
            resolve(product)
        })
        })

    },

    updateProduct:(proId,proDetails)=>{
       
        return new Promise((resolve,reject)=>{
    
        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:ObjectID(proId)},{
            $set:{
                  Name:proDetails.Name,
                  Description:proDetails.Description,
                  Price:proDetails.Price,
                  Category:proDetails.Category


            }
        }).then((response)=>{
            resolve()
        })
        })

    },



}