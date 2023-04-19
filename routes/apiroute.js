const express = require("express");
const itemModel = require("../models/item");

let router = express.Router();

//Database
//let database = [];
//let id = 100;

// REST API
router.get("/api/shopping", function(req,res){
    let query = {"user": req.session.user}
    if(req.query.type)
    itemModel.find(query).then(function(items){

    }).catch(function(err){
        console.log("Failed in finding items. Reason", err);
        return res.status(500).json({"Message": "Internal server error"})
    })
})

router.post("/api/shopping", function(req, res){
    if(!req.body){
        return res.status(400).json({"Message":"Bad request"})
    }
    if(!req.body.type){
        return res.status(400).json({"Message":"Bad request"})
    }
    let item=({
        "type":req.body.type.toLowerCase(),
        "count":req.body.count,
        "price":req.body.price,
        "id":id,
        "user":req.session.user
    })
    item.save().then(function(item){
        return res.status(201).json(item);
    }).catch(function(err){
        console.log("Failed to save new item. Reason ",err);
        return res.status(500).json({"Message": "Internal server error"})
    })
})

router.delete("/api/shopping", function(req, res){
    itemModel.deleteOne({"_id":req.params.id, "user": req.session.user}).then(function(){
        return res.status(200).json({"Message": "Successn"})
    }).catch(function(err){
        console.log("Failed to remove item id "+req.params.id+". Reason: ", err);
        return res.status(500).json({"Message": "Internal server error"})
    })
})

router.put("/api/shopping/:id", function(req,res){
    if (!req.body){
        return res.status(400).json({"Message": "Bad Request"});
    }
    if(!req.body.type){
        return res.status(400).json({"Message": "Bad request"});
    }
    let item = {
        "type": req.body.type.toLowerCase(),
        "count": req.body.count,
        "price": req.body.price,
        "id": tempId,
        "user": req.session.use
    }
    itemModel.replaceOne({"_id": req.params.id, "user": req.session.user},item).then(function(){
        return res.status(200).json({"Message":"Success"})
    }).catch(function(err){
        console.log("Failed to edit item id "+req.params.id+". Reason", err);
        return res.status(500).json({"Message": "Internal server error"})
    })
})

module.exports = router;