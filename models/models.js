var mongoose = require("mongoose");

var graphsSchema = new mongoose.Schema({
    nodes: [{
    id : int,
    label : String
}],
    edges: [{
    from : int,
    to : int
}]
    
});

var graphsModel = mongoose.model('graphs', graphsSchema);
module.exports = graphsModel;
