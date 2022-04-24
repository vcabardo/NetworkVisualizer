var http = require('http');
var fs = require('fs');
var formidable = require('formidable');
 
// html file containing upload form
var upload_html = fs.readFileSync("testUpload.html");
 
// replace this with the location to save uploaded files
var upload_path = "Users/jsy4/Documents/GitHub/WebDevProject/";
http.createServer(function (req, res) {
    if (req.url == '/uploadform') {
      res.writeHead(200);
      res.write(upload_html);
      return res.end();
    } else if (req.url == '/fileupload') {
        var form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {
            // oldpath : temporary folder to which file is saved to
            var oldpath = files.filetoupload.name;
	console.log(oldpath); 
           //var oldpath="Users/jsy4/Documents/GitHub/WebDevProject/testFolder";

	console.log(oldpath); 
            var newpath = upload_path + files.filetoupload.name;
            // copy the file to a new location
            fs.rename(oldpath, newpath, function (err) {
                if (err) throw err;
                // you may respond with another html page
                res.write('File uploaded and moved!');
                res.end();
            });
        });
    } 
}).listen(8086);
