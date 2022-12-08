var express = require('express');
const async = require('hbs/lib/async');
var router = express.Router();
var productHelpers=require('../helpers/product-helpers')

/* GET users listing. */
router.get('/', function(req, res, next) {

  productHelpers.getAllProducts().then((products)=>{
    // console.log(products);


    res.render('admin/view-products',{admin:true,products});
  })
  

  
});




 

router.get('/add-products',function(req,res){


  res.render('admin/add-products')

})






router.post('/add-products',(req,res)=>{
 
  productHelpers.addProduct(req.body,(inseredtId)=>{
    let image=req.files.Image
    const imageName=inseredtId

    image.mv('./public/product-images/'+imageName+'.jpg',(err,done)=>{
      if(!err){
        // res.render("admin/add-products")
        res.redirect("/admin")

      }else{
        console.log(err);
      }
    })

  })

})

router.get('/delete-product/:id',(req,res)=>{
  let proId=req.params.id
  // console.log(proId);
 productHelpers.deleteProduct(proId).then((response)=>{
  res.redirect('/admin/')
 })


})
router.get('/edit-product/:id',async(req,res)=>{
  let product=await productHelpers.getProductDetials(req.params.id)
  // console.log(product);
  res.render('admin/edit-product',{product})
})

router.post('/edit-product/:id',(req,res)=>{
  productHelpers.updateProduct(req.params.id,req.body).then(()=>{
    let id=req.params.id
    res.redirect('/admin')
    if(req.files){
      let image=req.files.Image
    

      image.mv('./public/product-images/'+id+'.jpg',(err,done)=>{
   
      })

    }
  })

})



module.exports = router;
