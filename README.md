# CareCenter - Healthcare Appoinment Management System

This is a web application for managing healthcare appointments. It help patients book appointments with healthcare workers and workers can manage their availability.

## Features

### For Patients

- Register as patient with email and password
- Login to your account
- View available healthcare workers
- Book appointments for medical care, medication delivery, or companionship
- See your upcoming appointments
- Cancel appointments if needed

### For Healthcare Workers

- Register as healthcare worker (admin need to register)
- Login to your dashboard
- Add your availability (single dates, date ranges, or weekly schedule)
- View your booked appointments
- Mark appointments as completed

### For Administrators

- Manage all patients and healthcare workers
- Approve or reject appointment requests
- View all appointments in the system
- See statistics and reports

## How to Run the Project

### Backend (API)

```bash
cd api
dotnet run
```

### Frontend (React)

```bash
cd carecenter
npm install
npm run dev
```

The app will run on http://localhost:5173

## Technologies Used

- **Frontend**: React, TypeScript, Bootstrap, React Router
- **Backend**: ASP.NET Core, C#, Entity Framework, SQLite
- **Authentication**: JWT tokens
- **Database**: SQLite for development

## Project Structure

```
CareCenter-react/
├── api/                    # Backend ASP.NET Core API
│   ├── Controllers/        # API controllers
│   ├── DAL/               # Data Access Layer
│   ├── DTOs/              # Data Transfer Objects
│   ├── Models/            # Database models
│   └── Migrations/        # Database migrations
├── carecenter/            # Frontend React app
│   ├── src/
│   │   ├── api/           # API client functions
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── pages/         # Page components
│   │   └── services/      # API services
│   └── public/            # Static files
└── README.md
```

## What is Missing or Can be Enhanced

### Missing Features

- Email notifications for appointments
- Password reset functionality (only token generation, no email sending)
- Multi-language support (only English now)
- Appointment reminders
- Rating system for healthcare workers
- Chat functionality between patients and workers

### Can be Enhanced

- Better error handling and user feedback
- More detailed appointment history
- Calendar view for appointments (now only list view)
- Better accessibility (screen reader support)
- More detailed logging and monitoring
- Security improvements (rate limiting, input validation)

# CareCenter API Tests

This directory contains tests for the CareCenter API.

## Test Structure

- **PatientRepositoryTests.cs** - Unit tests for patient data operations
- **HealthcareWorkerRepositoryTests.cs** - Unit tests for healthcare worker operations
- **PatientsControllerIntegrationTests.cs** - Integration tests for patient API endpoints
- **AuthControllerTests.cs** - Integration tests for authentication endpoints
- **AppointmentsControllerTests.cs** - Integration tests for appointment endpoints
- **ModelValidationTests.cs** - Unit tests for data validation rules

## Running Tests

### Using dotnet CLI

```bash
# Run all tests
dotnet test
```
