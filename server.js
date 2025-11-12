//importing required modules
const EventEmitter = require('events');
const http = require('http');
const fs = require('fs');
const path = require('path');

//instance of eventemitter
const NewsLetter = new EventEmitter();

//event listener for signup event
NewsLetter.on('signup', (contact) => {
    const csvLine = `${contact.name},${contact.email}\n`;
    const csvPath = path.join(__dirname, 'newsletter.csv');

    fs.appendFile(csvPath, csvLine, (err) => {
        if (err) {
            console.error('Error writing to CSV:', err);
        } else {
            console.log('Contact added to newsletter:', contact);
        }
    });
});

//http server and handler
const server = http.createServer((req, res) => {
    
    // stream data request handler
    const chunks = []; //array for data chunks

    //stream request listener for data
    req.on('data', (chunk) => {
        chunks.push(chunk);
    });

    //listening for end event when all data is recieved and handling get request for form
    req.on('end', () => {
        // Handle root URL - redirect to newsletter signup
        if (req.method === 'GET' && req.url === '/') {
            res.writeHead(302, { 'Location': '/newsletter_signup' });
            res.end();
            return;
        }
        
        // BONUS: Handle GET request for form
        if (req.method === 'GET' && req.url === '/newsletter_signup') {
            const htmlForm = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Newsletter Signup</title>
                    <style>
                        body { font-family: Arial; max-width: 500px; margin: 50px auto; }
                        form { display: flex; flex-direction: column; gap: 15px; }
                        input { padding: 10px; font-size: 16px; }
                        button { padding: 10px; background: #007bff; color: white; border: none; cursor: pointer; }
                        #message { margin-top: 20px; padding: 10px; border-radius: 5px; }
                        .success { background: #d4edda; color: #155724; }
                        .error { background: #f8d7da; color: #721c24; }
                    </style>
                </head>
                <body>
                    <h1>Newsletter Signup</h1>
                    <form id="signupForm">
                        <label>Name:</label>
                        <input type="text" name="name" required>
                        <label>Email:</label>
                        <input type="email" name="email" required>
                        <button type="submit">Sign Up</button>
                    </form>
                    <div id="message"></div>

                    <script>
                        document.getElementById('signupForm').addEventListener('submit', async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            const data = Object.fromEntries(formData);

                            try {
                                const response = await fetch('/newsletter_signup', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(data)
                                });

                                const result = await response.json();
                                const messageDiv = document.getElementById('message');
                                messageDiv.className = 'success';
                                messageDiv.textContent = result.message || 'Successfully signed up!';
                                e.target.reset();
                            } catch (error) {
                                const messageDiv = document.getElementById('message');
                                messageDiv.className = 'error';
                                messageDiv.textContent = 'Error: ' + error.message;
                            }
                        });
                    </script>
                </body>
                </html>
            `;
            
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(htmlForm);
            return;
        }
        
        //processing request
        if (req.method === 'POST' && req.url === '/newsletter_signup') {

            //decoding the chunks
            const body = Buffer.concat(chunks).toString();

            //parsing JSON body
            const data = JSON.parse(body);
            const { name, email } = data;

            //emitting the signup event with contact info
            NewsLetter.emit('signup', { name, email });

            //sending response to client
            res.writeHead(200, { 'Content-Type' : 'application/json' });
            res.end(JSON.stringify({ message: 'Successfully signed up!' }));
        } else {

            //handling other routes/methods
            res.writeHead(404, { 'content-Type': 'text/plain' });
            res.end('Not Found');
        }
    });
});

//starting server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on localhost:${PORT}`);
})