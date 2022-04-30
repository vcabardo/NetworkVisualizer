var mongoose = require("mongoose");

var graphsSchema = new mongoose.Schema({
    name: { type : String , unique : true, required : true },
    coordinates: Boolean,
    nodes: [{
    id : Number,
    label : String,
    x: Number, 
    y: Number
}],
    edges: [{
    from : Number,
    to : Number,
    value : Number
}]

});

graphsSchema.statics.listAllGraphs = function() {
    return this.find({});
};


var graphsModel = mongoose.model('graphs', graphsSchema);
module.exports = graphsModel;
