# AgriLink Platform - Angular Frontend

This is the production-ready Angular frontend client for the AgriLink platform, fully integrated with the Spring Boot microservices backend.

## Development & Startup

### Step 1: Install Dependencies
If you need to install packages manually:
```bash
npm install
```

### Step 2: Start Development Server
Run the dev server:
```bash
npm run start
```
Navigate to `http://localhost:4200/` in your browser. 
The dev server is configured via `proxy.conf.json` to proxy API requests directly to the API Gateway at `http://localhost:9091` to bypass CORS.

### Step 3: Run End-to-End Manual Testing
Follow the detailed startup and testing guide in the global [walkthrough.md](file:///C:/Users/SURIYA%20PRASAAD%20S/.gemini/antigravity-ide/brain/f64ebac9-6f6a-4644-9408-6b3dffe57d56/walkthrough.md) artifact to verify operations.

## Architecture

This application utilizes Angular Standalone Components, routing guards for role protection, interceptors for JWT bearer tokens and automatic token refreshes, and styled components based on a custom slate and emerald-green agricultural styling system.

Refer to the [walkthrough.md](file:///C:/Users/SURIYA%20PRASAAD%20S/.gemini/antigravity-ide/brain/f64ebac9-6f6a-4644-9408-6b3dffe57d56/walkthrough.md) for full endpoint mappings, database seeding profiles, and validation workflows.
