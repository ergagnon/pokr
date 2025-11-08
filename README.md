# Pokr - Agile Planning Poker

[![CI](https://github.com/YOUR_USERNAME/pokr/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/pokr/actions/workflows/ci.yml)
[![Code Quality](https://github.com/YOUR_USERNAME/pokr/actions/workflows/code-quality.yml/badge.svg)](https://github.com/YOUR_USERNAME/pokr/actions/workflows/code-quality.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A real-time collaborative planning poker application for agile teams, built with ASP.NET Core 8.0 and Angular.

## Features

- 🎯 **Real-time Collaboration** - Live updates using SignalR
- 🎴 **Fibonacci Voting** - Standard planning poker cards (1, 2, 3, 5, 8, 13, 21, ?, ☕)
- 👥 **Multi-participant Sessions** - Support for distributed teams
- 📊 **Vote Visualization** - See consensus and vote distribution
- 🔒 **Session Codes** - Secure 6-character session codes
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🎨 **Material Design** - Modern UI with Angular Material

## Tech Stack

### Backend
- ASP.NET Core 8.0
- Entity Framework Core
- SQLite Database
- SignalR for real-time communication
- Swagger/OpenAPI documentation

### Frontend
- Angular 17+
- Angular Material
- RxJS
- TypeScript
- SCSS

## Getting Started

### Prerequisites

- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 20.x or later](https://nodejs.org/)
- [npm](https://www.npmjs.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/pokr.git
   cd pokr
   ```

2. **Backend Setup**
   ```bash
   # Restore dependencies
   dotnet restore
   
   # Apply database migrations
   dotnet ef database update --project Pokr
   
   # Run the backend
   dotnet run --project Pokr/Pokr.csproj --launch-profile https
   ```
   
   The backend will be available at:
   - HTTPS: https://localhost:7001
   - HTTP: http://localhost:5000
   - Swagger: https://localhost:7001/swagger

3. **Frontend Setup**
   ```bash
   cd pokr-frontend
   
   # Install dependencies
   npm install
   
   # Start development server
   npm start
   ```
   
   The frontend will be available at: http://localhost:4200

## Usage

### Creating a Session

1. Navigate to the application
2. Click "Create Session"
3. Enter your name as facilitator
4. Enter a session name
5. Share the generated session code with participants

### Joining a Session

1. Click "Join Session"
2. Enter the 6-character session code
3. Enter your name
4. Start voting on stories!

### Facilitator Actions

- Add user stories to estimate
- Set the active story for voting
- Reveal votes when all participants have voted
- Finalize the agreed-upon estimate
- View session summary and export results

### Participant Actions

- Vote on the current story using Fibonacci cards
- See when other participants have voted (without seeing their votes)
- View revealed votes and consensus
- Change your vote before reveal

## Development

### Running Tests

**Backend Tests**
```bash
dotnet test
```

**Frontend Tests**
```bash
cd pokr-frontend
npm test
```

### Building for Production

**Backend**
```bash
dotnet publish Pokr/Pokr.csproj -c Release -o ./publish
```

**Frontend**
```bash
cd pokr-frontend
npm run build -- --configuration production
```

## Project Structure

```
pokr/
├── .github/
│   └── workflows/          # GitHub Actions CI/CD
├── Pokr/                   # Backend ASP.NET Core project
│   ├── Controllers/        # API controllers
│   ├── Data/              # Database context and repositories
│   ├── DTOs/              # Data transfer objects
│   ├── Exceptions/        # Custom exceptions
│   ├── Hubs/              # SignalR hubs
│   ├── Middleware/        # Custom middleware
│   ├── Models/            # Domain models
│   ├── Services/          # Business logic
│   └── Validation/        # Custom validators
├── Pokr.Tests/            # Backend tests
├── pokr-frontend/         # Angular frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/      # Core services and models
│   │   │   ├── features/  # Feature modules
│   │   │   └── shared/    # Shared components
│   │   └── environments/  # Environment configs
└── README.md
```

## API Documentation

When running in development mode, API documentation is available at:
- Swagger UI: https://localhost:7001/swagger

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## CI/CD

This project uses GitHub Actions for continuous integration and deployment:

- **CI Workflow** - Runs on every push and PR to main/develop
  - Builds backend and frontend
  - Runs all tests
  - Reports test results

- **Code Quality** - Runs CodeQL analysis and dependency review
  - Security scanning
  - Code quality checks
  - Dependency vulnerability scanning

- **Release Workflow** - Triggered on version tags (v*.*.*)
  - Creates production builds
  - Generates release artifacts
  - Publishes GitHub releases

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [ASP.NET Core](https://dotnet.microsoft.com/apps/aspnet)
- UI powered by [Angular](https://angular.io/) and [Angular Material](https://material.angular.io/)
- Real-time communication via [SignalR](https://dotnet.microsoft.com/apps/aspnet/signalr)

## Support

For issues, questions, or contributions, please open an issue on GitHub.

---

Made with ❤️ for agile teams
