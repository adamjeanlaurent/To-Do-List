const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');
const mongoose = require('mongoose');
const app = express();

//connection to database
mongoose.connect("mongodb://localhost:20717:/todolistDB", {useNewUrlParser: true});

//schema for items in the to do list
const itemsSchema = {
    name: String
};
// model for items in the home to do list (Item collection)
const Item = mongoose.model("Item", itemsSchema);

// Default documents to insert
const laundry = new Item({
    name: "Laundry"
});

const dishes = new Item({
    name: "Dishes"
});

const trash = new Item({
    name: "Trash"
});

// schema for custom list
// the items array is an array of documents, name is the name of the custom route
const listSchema = {
    name: String,
    items: [itemsSchema]
};

// Model for the home route to do list
const List = mongoose.model("List", listSchema);

//array of default documents 
const defaultItems = [laundry, dishes, trash];

app.set("view engine", "ejs"); 
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.get("/",function(req,res){

    // finds all the items in the items (home route) collection, and inserts the defualt items if the collection is empty
    Item.find({},function(err, items){
        if(err){
            console.log(err);
        }
        //if The List is empty, insert default items
        if(items.length === 0){
            //inserts array of default items
            Item.insertMany(defaultItems, function(err){
                if(err){
                    console.log(err);
                }
                else{
                    console.log("Succsessfully Inserted Default Items");
                }
            });
            res.redirect('/');
        }
        else{
            res.render("list", {listTitle: "Today", newItems: items });
        }
    });
});
 
/*
    Handles post requests to the home and custom routes
*/
app.post("/", function(req,res){

    /*
        listName is the title of the to do list, for custom routes it's the name of the route,
        For the home route it is "Today"
    */
    let listName = req.body.list;

    // Name of the item to add
    let itemName = req.body.newItem;

    //newItem document to add to the list
    const newItem = new Item({
        name: itemName
    });

    /*
        -If the listName is "Today", then the post request is from the home route's to do list, in which case,
        the new item is added to the Item collection and redirected to the "/" get route

        -If the listName is anything else, then the post request is from one of the custom routes,
        in which case, we search to find the correct list in the List collection (Which is the collection containing
        the data from the custom routes), push the newItem onto it's array, and then saves it, then we redirect to
        the get route of the custom route, which will render the updated page
    */
    if(listName === "Today"){
        newItem.save();
        res.redirect('/');
    }
    else{
        List.findOne({name : listName}, function(err, foundList){
            if(err){
                console.log(err);
            }
            else{
                // ** Good To Note That 
                foundList.items.push(newItem);
                foundList.save();
                res.redirect("/" + listName);
            }
        });
    }
});

app.post("/delete", function(req,res){
    const checkedItemId = req.body.deleteBox;
    const checkedItemTitle = req.body.listName;

    if(checkedItemTitle === "Today"){
        Item.deleteOne({_id: checkedItemId}, function(err){
            if(err){
                console.log(err);
            }
            else{
                console.log("Successfully Deleted Checked Item");
                res.redirect('/');
            }
        });
    }
    else{
        //runs a query, and pulls from items array that the query returns,  and pulls the item with the id of checkedItemId
        List.findOneAndUpdate({name: checkedItemTitle}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
            if(err){
                console.log(err);
            }
            else{
                res.redirect("/" + checkedItemTitle);
            }
        });
    }
    });

/*
    Check to see if the custom route already exists

    - If it doesn't, a new list is created, saved in to the DB, and a redirect is called

    -If does, then the page is simply rendered
*/
app.get("/:customListName", function(req,res){
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, function(err, foundList){
        if(err){
            console.log(err);
        }
        else{
            if(!foundList){
                // create new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            }
            else{
                //show an existing list
                res.render("list", {listTitle: customListName, newItems: foundList.items});
            }
        }
    });

});

app.listen(3000,function(){
    console.log("Server Running On Port 3000");
});
