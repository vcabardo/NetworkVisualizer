var express = require('express');
var mongoose = require('mongoose');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var fs = require('fs');
var formidable = require('formidable');
var path = require('path');

mongoose.connect('mongodb://localhost:27017/', {useNewUrlParser: true}).catch(error => console.log("Something went wrong: " + error));

// mongoose.connect('mongodb://localhost:27017/',function(){
//     /* Drop the DB */
//     mongoose.connection.db.dropDatabase();
// });

var model = require("./models/graphs");

var fs = require('fs'),
    readline = require('readline');


var edges = [];
var nodes = [];
var nodeCount = 1;
var gettingNodeCount = false;
var buildingNetworkTopo = false;
var name = 'Test';


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
  model.listAllGraphs().then(function(graphs){
    res.render("pages/network", {
        nodes: nodes,
        edges: edges,
        name: name,
        graphs: graphs
    });
  }).catch(function(error){
      res.error("Something went wrong!" + error );
  });


});

app.get("/upload", function(req, res){
    res.render("pages/upload");
});

app.post("/search", function(req, res){
    model.findOne({name: req.body.name}).then(function(entry){
        if(entry){
        console.log(entry.nodeType1)
            res.send(JSON.stringify({name: entry.name, nodes: entry.nodes,
                                    edges: entry.edges, coordinates: entry.coordinates,
                                    nodeType1: entry.nodeType1, nodeType2: entry.nodeType2}));
        }
    });
});

app.post("/delete", function(req, res){
    model.deleteOne({name: req.body.name}).then(function(entry) {
      model.listAllGraphs().then(function(graphs){
          res.render("pages/list", {graphs:graphs});
      }).catch(function(error){
          res.error("Something went wrong!" + error );
      });
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
        fs.renameSync(oldpath, newpath);

        // TODO: parse uploaded file, save contents to db
        rd = readline.createInterface({
            input: fs.createReadStream(newpath),
            console: false
        });

        edges = [];
        nodes = [];
        nodeType1 = [];
        nodeType2 = [];
        nodeCount = 1;
        gettingNodeCount = false;
        buildingNetworkTopo = false;
        var gettingCoordinates = false;
        var coordinates = false;
        var setType1 = false;
        var setType2 = false;

        rd.on('line', function(line) {
            if( line.substring( 0,7 ) == "BEG_000" ) { gettingNodeCount = true;}
            else if( line.substring( 0,7 ) == "END_000" ) { gettingNodeCount = false;
                for (let i = 1; i <= nodeCount; i++){
                    nodes.push({id: i, label: "Node"+i, x: 0, y:0})
                }
                console.log(nodes)
            }
            else if( line.substring( 0,7 ) == "BEG_001" ) { buildingNetworkTopo = true;}
            else if( line.substring( 0,7 ) == "END_001" ) { buildingNetworkTopo = false; console.log(edges);}

            else if( line.substring( 0,7 ) == "BEG_200" ) {gettingCoordinates = true; coordinates = true}
            else if( line.substring( 0,7 ) == "END_200" ) { gettingCoordinates = false; console.log(nodes);}

            else if( line.substring( 0,7 ) == "BEG_002" ) { setType1 = true;}
            else if( line.substring( 0,7 ) == "END_002" ) { setType1 = false; console.log(nodeType1);}

            else if( line.substring( 0,7 ) == "BEG_003" ) { setType2 = true;}
            else if( line.substring( 0,7 ) == "END_003" ) { setType2 = false; console.log(nodeType2);}

            else if ( gettingNodeCount == true ) {

                    // Getting number of nodes to create
                    netParams = line.split(" ");
                    nodeCount = netParams[1];
            }

            else if ( buildingNetworkTopo == true ) {
                // Building network topology
                netParams = line.split(" ");
                edges.push({from:netParams[0], to:netParams[1], value:netParams[2]})
            }

            else if ( gettingCoordinates == true ) {
                // Building network topology
                netParams = line.split(" ");
                nodes[Number(netParams[0])-1].x = netParams[1];
                nodes[Number(netParams[0])-1].y = netParams[2];
            }

            else if (line.substring( 0,7 ) == "END_101") {
                name = files.filetoupload.originalFilename;
                var query = {'name': req.body.name};
                model.findOneAndUpdate(query,{name: files.filetoupload.originalFilename, coordinates: coordinates, nodes: nodes, edges: edges, nodeType1: nodeType1, nodeType2: nodeType2}, {upsert: true}, function(err, doc) {
                    res.render("pages/fileuploadconfirmation", {
                        nodes: nodes,
                        edges: edges,
                        coordinates: coordinates
                    });
                }).catch(function(err){
                });
                try {
                    fs.unlinkSync(newpath)
                    //file removed
                  } catch(err) {
                    console.error(err)
                  }
            }

            else if ( gettingCoordinates == true ) {
                netParams = line.split(" ");
                nodes[Number(netParams[0])-1].x = netParams[1];
                nodes[Number(netParams[0])-1].y = netParams[2];
            }

            else if ( setType1 == true ) {
                netParams = line.split(" ");
                nodeType1.push(Number(netParams[0]));
                nodes[Number(netParams[0])-1].label = "server" + netParams[0];
            }

            else if ( setType2 == true ) {
                netParams = line.split(" ");
                nodeType2.push(Number(netParams[0]));
                nodes[Number(netParams[0])-1].label = "client" + netParams[0];
            }

            else if (line.substring( 0,7 ) == "END_101") {
                name = files.filetoupload.originalFilename;
                var query = {'name': name};
                model.findOneAndUpdate(query,{name: name,
                                        coordinates: coordinates, nodes: nodes, edges: edges,
                                        nodeType1: nodeType1, nodeType2: nodeType2},
                                        {upsert: true}, function(err, doc) {

                    res.render("pages/fileuploadconfirmation", {
                        nodes: nodes,
                        edges: edges,
                        coordinates: coordinates
                    });
                }).catch(function(err){
                });
                try {
                    fs.unlinkSync(newpath)
                    //file removed
                  } catch(err) {
                    console.error(err)
                  }
            }
        });


    });

});

app.get("/list", function(req,res) {
    model.listAllGraphs().then(function(graphs){
        res.render("pages/list", {graphs:graphs});
        console.log(graphs);
    }).catch(function(error){
        res.error("Something went wrong!" + error );
    });

})

app.use(express.static(__dirname + '/views'));

http.listen(3000, function(){
  console.log('listening on *:3000');
});
