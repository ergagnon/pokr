# Pokr Frontend

Angular frontend application for the Agile Planning Poker system.

## Features

- Angular 18 with TypeScript
- Angular Material UI components
- Routing configured for sessions and session details
- Feature-based module structure
- Environment configuration for API endpoints
- Responsive design with Material Design theme

## Project Structure

```
src/
├── app/
│   ├── core/                 # Core services and models
│   │   ├── models/          # TypeScript interfaces
│   │   └── services/        # HTTP services
│   ├── features/            # Feature modules
│   │   ├── sessions/        # Session list and creation
│   │   └── session-detail/  # Session voting interface
│   ├── shared/              # Shared components
│   └── environments/        # Environment configurations
└── assets/                  # Static assets
```

## Development

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### Setup
```bash
npm install
```

### Development Server
```bash
ng serve
```
Navigate to `http://localhost:4200/`

### Build
```bash
ng build
```

## Environment Configuration

- **Development**: API URL points to `https://localhost:7001/api`
- **Production**: API URL points to `/api` (relative)

## Available Routes

- `/sessions` - List all planning sessions
- `/sessions/create` - Create new session
- `/session/:id` - Join and participate in a session

## Material Design Components

The application uses Angular Material with the Indigo-Pink theme and includes:
- Toolbar navigation
- Cards for session display
- Forms with validation
- Buttons and icons
- Progress indicators
- Responsive layout components