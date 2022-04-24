var mongoose = require("mongoose");

var graphsSchema = new mongoose.Schema({
    name: { type : String , unique : true, required : true },
    nodes: [{
    id : Number,
    label : String
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
