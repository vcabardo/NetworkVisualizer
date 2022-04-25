var express = require('express');
var mongoose = require('mongoose');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var fs = require('fs');
var formidable = require('formidable');
var path = require('path');

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
var name = 'Test';
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
        edges.push({from:netParams[0], to:netParams[1], value:1})
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
      edges: edges, 
      name: name
  });
});

app.get("/upload", function(req, res){
    res.render("pages/upload");
});

app.post("/search", function(req, res){
    model.findOne({name: req.body.name}).then(function(entry){
        res.send(JSON.stringify({name: entry.name, nodes: entry.nodes, edges: entry.edges}));
    });
});

app.post('/graphs', function(req, res){
    console.log("graph: " + req.body.name);
    var query = {'name': req.body.name};

    model.findOneAndUpdate(query, req.body, {upsert: true}, function(err, doc) {
        if (err) return res.send(500, {error: err});
        return res.send('Succesfully saved.');
    });

});

app.post('/upload', function(req, res){
    var form = new formidable.IncomingForm();

    form.uploadDir = __dirname + '/views/fileuploads/';

    form.parse(req, function (err, fields, files) {

        // oldpath : temporary folder to which file is saved to
        var oldpath = files.filetoupload.filepath;
        var newpath = form.uploadDir + files.filetoupload.originalFilename;

        fs.rename(oldpath, newpath, function (err) {
            if (err) throw err;
        });

        // TODO: parse uploaded file, save contents to db
        rd = readline.createInterface({
            input: fs.createReadStream(newpath),
            console: false
        });
        
        edges = [];
        nodes = [];
        nodeCount = 1;
        gettingNodeCount = false;
        buildingNetworkTopo = false;
        
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
            else if (line.substring( 0,7 ) == "END_101") { 
                //res.render("pages/upload");
                name = files.filetoupload.originalFilename;

                var newGraph = new model({name: files.filetoupload.originalFilename, nodes: nodes, edges: edges});
                newGraph.save().then(function(){
                    res.send("Added new graph to database!");
                }).catch(function(err){
                    console.error(err.stack)
                });
            }

            else if ( gettingNodeCount == true ) {
        
                    // Getting number of nodes to create
                    netParams = line.split(" ");
                    nodeCount = netParams[1];
            }
            else if ( buildingNetworkTopo == true ) {
                // Building network topology
                netParams = line.split(" ");
                edges.push({from:netParams[0], to:netParams[1], value:1})
            }
        });
        
    });

});

app.get("/list", function(req,res) {
    model.listAllGraphs().then(function(graphs){
        res.render("pages/list", {graphs:graphs});
    }).catch(function(error){
        res.error("Something went wrong!" + error );
    });

})

app.use(express.static(__dirname + '/views'));

http.listen(3000, function(){
  console.log('listening on *:3000');
});
