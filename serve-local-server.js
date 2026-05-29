const http = require("http");
const fs = require("fs");
const path = require("path");

const port = 8765;
const rootDirectory = __dirname;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".otf": "font/otf",
  ".ttf": "font/ttf",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".webp": "image/webp",
  ".map": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
};

function getContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return mimeTypes[extension] || "application/octet-stream";
}

function sendNotFound(response) {
  response.statusCode = 404;
  response.setHeader("Content-Type", "text/plain; charset=utf-8");
  response.end("Not found");
}

function sendError(response, error) {
  response.statusCode = 500;
  response.setHeader("Content-Type", "text/plain; charset=utf-8");
  response.end("Server error: " + error.message);
}

function trySendFile(response, filePath) {
  fs.stat(filePath, function (statError, stats) {
    if (statError || !stats.isFile()) {
      sendNotFound(response);
      return;
    }

    fs.readFile(filePath, function (readError, data) {
      if (readError) {
        sendError(response, readError);
        return;
      }

      response.statusCode = 200;
      response.setHeader("Content-Type", getContentType(filePath));
      response.end(data);
    });
  });
}

const server = http.createServer(function (request, response) {
  let requestPath = decodeURIComponent(request.url.split("?")[0]);
  if (requestPath === "/") {
    requestPath = "/Web Main Menu/index.html";
  }

  const safePath = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(rootDirectory, safePath);

  if (!filePath.startsWith(rootDirectory)) {
    sendNotFound(response);
    return;
  }

  fs.stat(filePath, function (statError, stats) {
    if (!statError && stats.isDirectory()) {
      const indexPath = path.join(filePath, "index.html");
      trySendFile(response, indexPath);
      return;
    }

    trySendFile(response, filePath);
  });
});

server.on("error", function (error) {
  if (error.code === "EADDRINUSE") {
    console.error("Port " + port + " is already in use.");
    console.error("Close the other server on this port, then run serve-local.bat again.");
  } else {
    console.error("Server error: " + error.message);
  }
  process.exit(1);
});

server.listen(port, function () {
  console.log("Serving " + rootDirectory);
  console.log("http://localhost:" + port);
  console.log("http://localhost:" + port + "/Web%20Main%20Menu/index.html");
});
