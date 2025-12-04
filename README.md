# CareCenter - Healthcare Appoinment Management System

This is a web application for managing healthcare appointments. It help patients book appointments with healthcare workers and workers can manage their availability.

## Features

### For Patients

- Register as patient 
- Login to your account
- View available healthcare workers
- Book appointments for medical care, medication delivery, or companionship
- See your upcoming appointments
- Cancel appointments if needed

### For Healthcare Workers

- Register as healthcare worker (admin need to register)
- Login to your dashboard
- Add your availability (single dates, date ranges)
- View your booked appointments

### For Administrators

- Manage all patients and healthcare workers(crud)
- Approve or reject appointment requests
- View all appointments in the system

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
│ 
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
