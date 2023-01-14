function addToCart(proId){

    $.ajax({
         url:'add-to-cart/'+proId,
         method:'get',
         success:(response)=>{
            if(response.status){
                let count=$('#cart-count').html()
                count=parseInt(count)+1
                $('#cart-count').html(count)

            }
            alert(response)
         }
    })
}




function cartDelete(cartId,proId){
    $.ajax({
      url:'/deleteCart',
      data:{
        cart:cartId,
        product:proId
      },
      method:'post',
      success:(response)=>{
if(response.removeProduct){
  alert("sucess")
  location.reload()

}
      }



    })
   }