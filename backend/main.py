from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

app = FastAPI()

origins = ["http://localhost:3000", "http://127.0.0.1:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.get("/", response_class=HTMLResponse)
def home():
    return """
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>FastAPI Health Check</title>
        <style>
          body {
            font-family: system-ui, sans-serif;
            background: #f4f5f7;
            color: #102a43;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
          }
          .card {
            background: white;
            border-radius: 18px;
            padding: 2rem;
            box-shadow: 0 18px 65px rgba(15, 23, 42, 0.12);
            max-width: 420px;
          }
          .status {
            margin-top: 1rem;
            padding: 0.9rem 1rem;
            border-radius: 12px;
            background: #e0f7fa;
            color: #0b3c49;
          }
          .status.error {
            background: #ffebee;
            color: #7f1d1d;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>FastAPI health check</h1>
          <p>This page calls <code>/api/health</code> and displays the response.</p>
          <div id="status" class="status">Loading...</div>
        </div>
        <script>
          async function loadHealth() {
            const statusElement = document.getElementById('status');
            try {
              const response = await fetch('/api/health');
              if (!response.ok) {
                throw new Error('Failed to reach health endpoint');
              }
              const json = await response.json();
              statusElement.textContent = JSON.stringify(json);
            } catch (error) {
              statusElement.textContent = 'Error: ' + error.message;
              statusElement.classList.add('error');
            }
          }

          loadHealth();
        </script>
      </body>
    </html>
    """
