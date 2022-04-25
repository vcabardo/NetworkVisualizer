const  express= require('express')
const app= express()
const server= require('http').createServer(app)
const io= require('socket.io')(server, {cors:{origin: "*"}})

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

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('pages/index');
})

app.get("/view", function(req, res){
    res.render("pages/network", {
        nodes: nodes,
        edges: edges
    });
  });

server.listen(3000, () => {
    console.log('server running on 3000');
})

