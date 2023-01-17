var db=require('../config/connection')
var collection=require('../config/collection')
const bcrypt=require('bcrypt')
const async = require('hbs/lib/async')
const { ObjectID, ObjectId } = require('bson')
const { reject, promise } = require('bcrypt/promises')
const { response } = require('express')
var objectId=require('mongodb').ObjectId
const Razorpay=require('razorpay')
const { Logger } = require('mongodb')

  var instance = new Razorpay({
    key_id: 'rzp_test_pKLRENWxgUTNjV',
    key_secret: 'Odl3MtVlyg1mMYJ44jIHvnyS',
  });


module.exports={
    doSignup:(userData)=>{
        return new Promise(async(resolve, reject)=>{
            userData.Password =await bcrypt.hash(userData.Password,10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
                userData._id = data.insertedId;
                resolve(userData);
                
            })
        })
   
},
doLogin:(userData)=>{
    return new Promise(async(resolve,reject)=>{
        let loginStatus=false
        let response={}
        let user=await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
     
        if(user){
            bcrypt.compare(userData.Password,user.Password).then((value)=>{
                if(value){
                    console.log("login sucess");
                    response.user=user
                    response.value=true
                    resolve(response)
    
                }else{
                    console.log("login failed");
                resolve({value:false})
                }
 

            })
        }else{
            console.log('login denied');
            resolve({value:false})
        }
  
        

    })
},


addToCart:(prodId,userId)=>{
    let proObj={ 
        item:ObjectID(prodId),
        quantity:1

    }
    return new Promise(async(resolve, reject)=>{
    
    let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectID(userId)})
    if(userCart){
         let proExist=userCart.products.findIndex(product=>product.item==prodId)
           console.log(proExist);

            //  to change the quantity

           if(proExist!=-1){
            db.get().collection(collection.CART_COLLECTION)
            .updateOne({user:ObjectID(userId),'products.item':ObjectID(prodId)},
            {
                $inc:{'products.$.quantity':1}
            }
            ).then(()=>{
                resolve()
            })
        } else{

    
        

        db.get().collection(collection.CART_COLLECTION).updateOne({user:ObjectID(userId)},

        {
            
                $push:{products:proObj}
           
        }
        ).then((response)=>{
            resolve()
        })
    
    }
    }else{
        let cartObj={
            user:ObjectID(userId),
            products:[proObj]

        }
        db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
            resolve()
        })

    }
})
},
getCartProducts:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
            {
                $match:{user:ObjectID(userId)}
            },
            {
                $unwind:'$products'
            },{
                $project:{
                    item:'$products.item',
                    quantity:'$products.quantity'

                }
            },
            {
                $lookup:{
                    from:collection.PRODUCT_COLLECTION,
                    localField:'item',
                    foreignField:'_id',
                    as:'product'
                }

            },
            {  $project:{

                item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
            }



            }
            

            // done in the first way
            // {
            //     $lookup:{
            //         from:collection.PRODUCT_COLLECTION,
            //         let:{prodList:'$products'},
            //         pipeline:[
            //             {
            //                 $match:{
            //                     $expr:{
            //                         $in:['$_id',"$$prodList"]
            //                     }

            //                 }
            //             }
            //         ],
            //         as:'cartItems'
            //     }
            // }



        ]).toArray()
        resolve(cartItems)
    })
},
getCartCount:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        let count=0
        let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
        if (cart){ 
            count=cart.products.length

        }
        resolve(count)
    })
},
changeProductQuantity:(detials)=>{
    // console.log(detials);
    detials.count=parseInt(detials.count)
    detials.quantity=parseInt(detials.quantity)
    return new Promise((resolve,reject)=>{
        if(detials.count==-1 && detials.quantity==1){
           
            db.get().collection(collection.CART_COLLECTION)
        .updateOne({_id:ObjectID(detials.cart)},
        {
            $pull:{products:{item:ObjectID(detials.product)}}
        }
        ).then((response)=>{
            resolve({removeProduct:true})
        })

        }else{
        db.get().collection(collection.CART_COLLECTION)
        .updateOne({_id:ObjectID(detials.cart),'products.item':ObjectID(detials.product)},
        {
            $inc:{'products.$.quantity':detials.count}
        }
        ).then((response)=>{
            resolve({status:true})
        })
   

        }

    })
},
getTotalAmount:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        let total=await db.get().collection(collection.CART_COLLECTION).aggregate([
            {
                $match:{user:ObjectID(userId)}
            },
            {
                $unwind:'$products'
            },
            {
                $project:{
                    item:'$products.item',
                    quantity:'$products.quantity'

                }
            },
            {
                $lookup:{
                    from:collection.PRODUCT_COLLECTION,
                    localField:'item',
                    foreignField:'_id',
                    as:'product'
                }

            },
            {  $project:{

                item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
            }



            },
            {
                $group:{
                    _id:null,
                    total:{$sum:{$multiply: ['$quantity', {$toInt: '$product.Price'}]}}
                }
            }
            

           


        ]).toArray()
        console.log(total);
        resolve(total[0].total)
    })
},
placeOrder:(order,products,total)=>{
    return new Promise((resolve,reject)=>{
        console.log(order,products,total);
        let status=order['payment-method']==='COD'?'placed':'pending'
        let orderObj={
            deliveryDetails:{
                mobile:order.Mobile,
                address:order.Address,
                pincode:order.Pincode
            },
            userId:ObjectID(order.userId),
        PaymentMethod:order['payment-method'],
    products:products,
    totalAmount:total,
status:status ,
date:new Date()       
}

db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
   db.get().collection(collection.CART_COLLECTION).deleteOne({user:ObjectID(order.userId)})
  
 orderObj._id = response.insertedId;
   resolve(orderObj._id);
   console.log("new id is this",response.insertedId);
   
})

    })

},
getCartProductList:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectID(userId)})
     console.log(cart);
     console.log('heyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy');
        resolve(cart.Products)
    })
},
 getUserOrders:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        let orders=await db.get().collection(collection.ORDER_COLLECTION).find({userId:ObjectID(userId)}).toArray()
        console.log(orders);
        resolve(orders)
    })
},
 
getOrderProducts:(orderId)=>{
return new Promise (async(resolve,reject)=>{
    let orderItems=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
            $match:{_id:ObjectID(orderId)}
        },
        {
            $unwind:'$products'
        },
        {
            $project:{
                item:'$products.item',
                quantity:'$products.quantity'
            }
        },
        {
            $lookup:{
                from:collection.PRODUCT_COLLECTION,
                localField:'item',
                foreignField:'_id',
                as:'product'
            }
        },
        {
            $project:{
                item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
            }
        }
    ]).toArray()
    console.log(orderItems);
    resolve(orderItems)
})
},




generateRazorpay:(orderId,total)=>{
    console.log(orderId);
    console.log(total);

    return new Promise((resolve,reject)=>{

var options = {
  amount: total*100,
  currency: "INR",
  receipt: ""+orderId
};
    
instance.orders.create(options,(err,order)=>{
    if(err){
        console.log(err);
    }else{
    console.log("new order:",order);
    resolve(order)
}
})

    })
},


verifyPayment:(details)=>{
    return new Promise((resolve,reject)=>{
        const crypto=require('crypto');
        let hmac=crypto.createHmac('sha256','Odl3MtVlyg1mMYJ44jIHvnyS')
        hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
     hmac=hmac.digest('hex')
     if(hmac==details['payment[razorpay_signature]']){
        resolve()
     }else{
        reject()
     }
    })
},
changePaymentStatus:(orderId)=>{


    return new Promise((resolve,reject)=>{
        db.get().collection(collection.ORDER_COLLECTION)
        .updateOne({_id:objectId( orderId)},
        {
            $set:{
                status:'placed'
            }
        }
        ).then(()=>{
            resolve()
        })
})
},

lowerToHigh: ()=>{
    return new Promise(async(resolve,reject)=>{
      let products= await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([{$sort:{Price:1}}]).toArray()
      resolve(products)
    })

},

highTolow: ()=>{
    return new Promise(async(resolve,reject)=>{
      let products= await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([{$sort:{Price:-1}}]).toArray()
      resolve(products)
    })

},

deleteCart:(fullId)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(fullId.cart)},
        {
            $pull:{products:{item:objectId(fullId.product)}}
        }
        ).then((response)=>{
            resolve({removeProduct:true})
        })
   

    
})


},

showImage:(imgId)=>{
    return new Promise(async(resolve,reject)=>{
      var item=await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(imgId)})
      resolve(item)
    })

}


}