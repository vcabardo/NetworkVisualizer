var express = require('express');
var mongoose = require('mongoose');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

mongoose.connect('mongodb://localhost:27017/', {useNewUrlParser: true}).catch(error => console.log("Something went wrong: " + error));

var model = require("./models/graphs");

var fs = require('fs'),
    readline = require('readline');

var rd = readline.createInterface({
    input: fs.createReadStream('Topo20-power.txt'),
    console: false
});

var edges = [];
var nodes = [];
var nodeCount = 1;
var gettingNodeCount = false;
var buildingNetworkTopo = false;

rd.on('line', function(line) {
    //console.log(line);
    if( line.substring( 0,7 ) == "BEG_000" ) { gettingNodeCount = true;}
    else if( line.substring( 0,7 ) == "END_000" ) { gettingNodeCount = false;
        for (let i = 1; i <= nodeCount; i++){
            nodes.push({id: i, label: "Node"+i})
        }
        console.log(nodes)
    }
    else if( line.substring( 0,7 ) == "BEG_001" ) { buildingNetworkTopo = true;}
    else if( line.substring( 0,7 ) == "END_001" ) { buildingNetworkTopo = false; console.log(edges);}

    else if ( gettingNodeCount == true ) {

            // Getting number of nodes to create
            netParams = line.split(" ");
            nodeCount = netParams[1];
    }
    else if ( buildingNetworkTopo == true ) {
        // Building network topology
        netParams = line.split(" ");
        edges.push({from:netParams[0], to:netParams[1]})
    }
});

io.on('connection', function (socket) {
  var clients = socket.client.conn.emit.length;
  console.log( socket.client.conn.server.clientsCount + " users connected" );
  console.log("clients: " + clients);
});

app.set("view engine", "ejs");
app.use(express.urlencoded());
app.use(express.json());


app.get('/', function(req, res){
  res.render('pages/index');
});

app.get("/view", function(req, res){
  res.render("pages/network", {
      nodes: nodes,
      edges: edges
  });
});

app.get("/upload", function(req, res){
    res.render("pages/upload");
});

app.post('/graphs', function(req, res){
    var newGraph = new model.graphsModel(req.body.graphs);

    newGraph.save().then(function(){
        res.send("Added new graph to database!");
    }).catch(function(err){
        console.error(err.stack)
    });
});

app.use(express.static(__dirname + '/views/pages'));

http.listen(3000, function(){
  console.log('listening on *:3000');
});
