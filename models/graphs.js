var mongoose = require("mongoose");

var graphsSchema = new mongoose.Schema({
    nodes: [{
    id : Number,
    label : String
}],
    edges: [{
    from : Number,
    to : Number
}]

});

graphsSchema.statics.listAllGraphs = function() {
    return this.find({});
};

var graphsModel = mongoose.model('graphs', graphsSchema);
module.exports = graphsModel;
