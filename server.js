const express = require("express");
const router = require("./routes/apiroute");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const mongoose = require("mongoose");
const userModel = require("./models/user");
const sessionModel = require("./models/session");

let app = express();

app.use(express.json());

//MONGOOSE CONNECTION

const mongo_url = process.env.MONGODB_URL;
const mongo_user = process.env.MONGODB_USER;
const mongo_password = process.env.MONGODB_PASSWORD;

//LOGIN DATABASES
const url = "mongodb+srv://"+mongo_user+":"+mongo_password+"@"+mongo_url+"/shoppingdatabase?retryWrites=true&w=majority"


mongoose.connect(url).then(
    () => console.log("Connected to mongodb"),
	(error) => console.log("Failed to connect to mongodb. Reason:",error)
)
    

mongoose.set("toJson", {virtuals:true})

const time_to_live_diff = 3600000

let port = process.env.PORT || 3001;

//LOGIN MIDDLEWARE

createToken = () => {
	let token = crypto.randomBytes(64);
	return token.toString("hex");
}

isUserLogged = (req,res,next) => {
	if(!req.headers.token) {
		return res.status(403).json({"Message":"Forbidden"})
	}
    sessionModel.findOne({"token": req.headers.token}).then(function(session){
        if(!session){
            return res.status(403).json({"Message":"Forbidden"});
        }
        let now = Date.now();
        if(now > session.ttl){
            sessionModel.deleteOne({"_id": session._id}).then(function(){
                return res.status(403).json({"Message":"Forbidden"})
            }).catch(function(err){
                console.log("Failed to remove session in isUserLogged. Reason: ",err);
                return res.status(403).json({"Message":"Forbidden"})
            })
        } else {
            session.ttl = now + time_to_live_diff;
            req.session = {};
            req.session.user = session.user;
            session.save().then(function(){
                return next();
            }).catch(function(err){
                console.log("Failed to update session in isUserLogged. Reason". err)
                return next();
            })
        }

    }).catch(function(err){
        console.log("Failed to find session in isUserLogged. Reason ",err);
        return res.status(403).json({"Message": "Forbidden"});
    })
}

//register
app.post("/register",function(req,res) {
	if(!req.body) {
		return res.status(400).json({"Message":"Bad Request"});
	}
	if(!req.body.username || !req.body.password) {
		return res.status(400).json({"Message":"Bad Request"});
	}
	if(req.body.username.length < 4 || req.body.password.length < 8) {
		return res.status(400).json({"Message":"Bad Request"});
	}
	bcrypt.hash(req.body.password,14,function(err,hash) {
		if(err) {
			return res.status(500).json({"Message":"Internal server error"})
		}
		let user = new userModel({
			"username":req.body.username,
			"password":hash
		})
		user.save().then(function(user) {
			return res.status(200).json({"Message":"Register success"});
		}).catch(function(err) {
			if(err.code === 11000) {
				return res.status(409).json({"Message":"Username already in use"})
			}
			return res.status(500).json({"Message":"Internal server error"})
		})
	})
})

//login
app.post("/login",function(req,res) {
	if(!req.body) {
		return res.status(400).json({"Message":"Bad Request"});
	}
	if(!req.body.username || !req.body.password) {
		return res.status(400).json({"Message":"Bad Request"});
	}
	if(req.body.username.length < 4 || req.body.password.length < 8) {
		return res.status(400).json({"Message":"Bad Request"});
	}
	userModel.findOne({"username":req.body.username}).then(function(user) {
		if(!user) {
			return res.status(401).json({"Message":"Unauthorized"});
		}
		bcrypt.compare(req.body.password,user.password,function(err,success) {
			if(err) {
				console.log("Comparing passwords failed. Reason",err);
				return res.status(500).json({"Message":"Internal server error"})
			}
			if(!success) {
				return res.status(401).json({"Message":"Unauthorized"})
			}
			let token = createToken();
			let now = Date.now();
			let session = new sessionModel({
				user:req.body.username,
				ttl:now+time_to_live_diff,
				token:token
			})
			session.save().then(function(session) {
				return res.status(200).json({"token":token})
			}).catch(function(err) {
				return res.status(500).json({"Message":"Internal server error"})
			})
		})
	}).catch(function(err) {
		return res.status(500).json({"Message":"Internal server error"})	
	})
});

//logout
app.post("/logout",function(req,res) {
	if(!req.headers.token) {
		return res.status(404).json({"Message":"Not found"})
	}
    sessionModel.deleteOne({"token":req.headers.token}).then(function(){
        return res.status(200).json({"Message": "Logged out"})
    }).catch(function(err){
        console.log("Failed to remove session in logout. Reason", err)
        return res.status(200).json({"Message": "Logged out"})
    })
})

app.use("/api",isUserLogged,router);

app.listen(port);

console.log("Running in port",port);

