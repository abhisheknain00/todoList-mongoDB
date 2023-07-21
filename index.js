//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.set("strictQuery", false);

const connectDB = async ()=>{
  try{
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected: '+conn.connection.host);
  } catch (err){
    console.log(err);
  }
}



const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the '+' button to add new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete item."
});

const defaultItems = [item1, item2, item3];


const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", (req, res)=> {

  Item.find()
  .then((foundItems)=>{

    if(foundItems.length === 0){
      Item.insertMany(defaultItems)
        .then(()=>{
          console.log("Successfully saved default items to DB!");
        })
        .catch((err)=>{
          console.log(err);
        });
        
        res.redirect("/");

    }else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }

  })
  .catch((err)=>{
    console.log(err);
  });


});


app.get("/:customListName", (req, res)=>{
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName})
    .then((foundList)=>{
      if(!foundList){
        //create new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
      
        list.save();
        res.redirect("/"+customListName);
      }else{
        //show existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    })
    .catch((err)=>{
      console.log(err);
    });

  

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  } else{
    List.findOne({name: listName})
      .then((foundList)=>{
        foundList.items.push(item);
        foundList.save();
        res.redirect("/"+listName);
      })
      .catch((err)=>{
        console.log(err);
      });
  }

});


app.post("/delete", (req,res)=>{
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndDelete(checkedItemId)
    .then(()=>{
      res.redirect("/");
    });
  } else{
    List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkedItemId}}})
      .then((foundList)=>{
        res.redirect("/"+listName);
      });
  }

})

app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});


connectDB().then(()=>[
  app.listen(PORT, ()=> {
    console.log("Server started on port");
  })
]);

