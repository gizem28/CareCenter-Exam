using CareCenter.DAL;
using CareCenter.DTOs;
using CareCenter.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

// Unit tests for AppointmentRepository
// Testing appointment database operations with positive and negative test cases
public class AppointmentRepositoryTests
{
    private readonly DbContextOptions<AppDbContext> _options;

    public AppointmentRepositoryTests()
    {
        // Use in-memory database for testing
        _options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString()) // Unique name for each test
            .Options;
    }

    // Helper method to create test data
    private async Task<(AppDbContext context, AppointmentRepository repository, Patient patient, HealthcareWorker worker, Availability availability)> SetupTestData()
    {
        var context = new AppDbContext(_options);
        var repository = new AppointmentRepository(context);

        // Create test patient
        var patient = new Patient
        {
            UserId = "testpatient",
            FullName = "Jørgen Sørensen",
            Email = "jorgen@test.com",
            Address = "Test Address",
            Phone = "12345678",
            BirthDate = new DateTime(1990, 1, 1),
        };
        context.Patients.Add(patient);

        // Create test healthcare worker
        var worker = new HealthcareWorker
        {
            UserId = "workertest",
            FullName = "Jasmine Hansen",
            Email = "jasmine@test.com",
            Phone = "12312312",
            Position = "Sykepleier"
        };
        context.HealthcareWorkers.Add(worker);

        // Create test availability
        var availability = new Availability
        {
            HealthcareWorkerId = worker.Id,
            Date = DateTime.Today.AddDays(1),
            StartTime = new TimeSpan(9, 0, 0),
            EndTime = new TimeSpan(17, 0, 0)
        };
        context.Availabilities.Add(availability);

        await context.SaveChangesAsync();

        return (context, repository, patient, worker, availability);
    }

    [Fact]
    // Test creating a valid appointment (CREATE - Positive)
    public async Task CreateAsync_ValidData_ReturnsAppointmentWithId()
    {
        // Arrange
        var (context, repository, patient, worker, availability) = await SetupTestData();

        var createDto = new AppointmentCreateDto
        {
            AvailabilityId = availability.Id,
            PatientId = patient.Id,
            RequestedLocalTime = DateTime.Today.AddDays(1).AddHours(10),
            SelectedStartTime = "10:00:00",
            ServiceType = "Medical Care"
        };

        // Act
        var result = await repository.CreateAsync(createDto);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.Id > 0);
        Assert.Equal(availability.Id, result.AvailabilityId);
        Assert.Equal(patient.Id, result.PatientId);
        Assert.Equal("Pending", result.Status);
        Assert.Equal("Medical Care", result.ServiceType);
        Assert.Equal(new TimeSpan(10, 0, 0), result.SelectedStartTime);

        // Verify appointment is linked to availability
        var updatedAvailability = await context.Availabilities
            .Include(a => a.Appointment)
            .FirstOrDefaultAsync(a => a.Id == availability.Id);
        Assert.NotNull(updatedAvailability);
        Assert.NotNull(updatedAvailability.Appointment);
        Assert.Equal(result.Id, updatedAvailability.Appointment.Id);

        context.Dispose();
    }

    [Fact]
    // Test creating appointment with already booked availability (CREATE - Negative)
    public async Task CreateAsync_AlreadyBookedAvailability_ThrowsInvalidOperationException()
    {
        // Arrange
        var (context, repository, patient, worker, availability) = await SetupTestData();

        // Create first appointment
        var firstAppointment = new Appointment
        {
            AvailabilityId = availability.Id,
            PatientId = patient.Id,
            Status = "Pending",
            ServiceType = "Medical Care",
            RequestedLocalTime = DateTime.Today.AddDays(1).AddHours(10),
            CreatedAt = DateTime.UtcNow
        };
        context.Appointments.Add(firstAppointment);
        await context.SaveChangesAsync();

        // Link appointment to availability
        availability.Appointment = firstAppointment;
        await context.SaveChangesAsync();

        var createDto = new AppointmentCreateDto
        {
            AvailabilityId = availability.Id,
            PatientId = patient.Id,
            RequestedLocalTime = DateTime.Today.AddDays(1).AddHours(11),
            ServiceType = "Medication Delivery"
        };

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(async () =>
            await repository.CreateAsync(createDto));

        context.Dispose();
    }

    [Fact]
    // Test getting appointments by patient ID (READ - Positive)
    public async Task GetByPatientAsync_ExistingPatient_ReturnsAppointments()
    {
        // Arrange
        var (context, repository, patient, worker, availability) = await SetupTestData();

        // Create multiple appointments for the patient
        var appointment1 = new Appointment
        {
            AvailabilityId = availability.Id,
            PatientId = patient.Id,
            Status = "Pending",
            ServiceType = "Medical Care",
            RequestedLocalTime = DateTime.Today.AddDays(1).AddHours(10),
            CreatedAt = DateTime.UtcNow
        };
        context.Appointments.Add(appointment1);

        // Create another availability and appointment
        var availability2 = new Availability
        {
            HealthcareWorkerId = worker.Id,
            Date = DateTime.Today.AddDays(2),
            StartTime = new TimeSpan(9, 0, 0),
            EndTime = new TimeSpan(17, 0, 0)
        };
        context.Availabilities.Add(availability2);
        await context.SaveChangesAsync();

        var appointment2 = new Appointment
        {
            AvailabilityId = availability2.Id,
            PatientId = patient.Id,
            Status = "Approved",
            ServiceType = "Medication Delivery",
            RequestedLocalTime = DateTime.Today.AddDays(2).AddHours(14),
            CreatedAt = DateTime.UtcNow
        };
        context.Appointments.Add(appointment2);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.GetByPatientAsync(patient.Id);

        // Assert
        Assert.NotNull(result);
        var appointmentsList = result.ToList();
        Assert.Equal(2, appointmentsList.Count);
        Assert.All(appointmentsList, a => Assert.Equal(patient.Id, a.PatientId));
        Assert.Contains(appointmentsList, a => a.Status == "Pending");
        Assert.Contains(appointmentsList, a => a.Status == "Approved");

        context.Dispose();
    }

    [Fact]
    // Test getting appointments for patient with no appointments (READ - Negative)
    public async Task GetByPatientAsync_PatientWithNoAppointments_ReturnsEmptyList()
    {
        // Arrange
        var (context, repository, patient, _, _) = await SetupTestData();

        // Act
        var result = await repository.GetByPatientAsync(patient.Id);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);

        context.Dispose();
    }

    [Fact]
    // Test getting appointments by worker ID (READ - Positive)
    public async Task GetByWorkerAsync_ExistingWorker_ReturnsAppointments()
    {
        // Arrange
        var (context, repository, patient, worker, availability) = await SetupTestData();

        // Create appointment for the worker
        var appointment = new Appointment
        {
            AvailabilityId = availability.Id,
            PatientId = patient.Id,
            Status = "Pending",
            ServiceType = "Personal Care",
            RequestedLocalTime = DateTime.Today.AddDays(1).AddHours(10),
            CreatedAt = DateTime.UtcNow
        };
        context.Appointments.Add(appointment);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.GetByWorkerAsync(worker.Id);

        // Assert
        Assert.NotNull(result);
        var appointmentsList = result.ToList();
        Assert.Single(appointmentsList);
        Assert.Equal(availability.Id, appointmentsList[0].AvailabilityId);
        Assert.Equal(patient.Id, appointmentsList[0].PatientId);

        context.Dispose();
    }

    [Fact]
    // Test updating existing appointment (UPDATE - Positive)
    public async Task UpdateAsync_ExistingAppointment_ReturnsUpdatedAppointment()
    {
        // Arrange
        var (context, repository, patient, worker, availability) = await SetupTestData();

        var appointment = new Appointment
        {
            AvailabilityId = availability.Id,
            PatientId = patient.Id,
            Status = "Pending",
            ServiceType = "Companionship",
            RequestedLocalTime = DateTime.Today.AddDays(1).AddHours(10),
            CreatedAt = DateTime.UtcNow
        };
        context.Appointments.Add(appointment);
        await context.SaveChangesAsync();

        var updateDto = new AppointmentUpdateDto
        {
            Status = "Confirmed",
            ServiceType = "Personal Care",
            SelectedStartTime = "10:30:00"
        };

        // Act
        var result = await repository.UpdateAsync(appointment.Id, updateDto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Confirmed", result.Status);
        Assert.Equal("Personal Care", result.ServiceType);
        Assert.Equal(new TimeSpan(10, 30, 0), result.SelectedStartTime);

        // Verify in database
        var updatedAppointment = await context.Appointments
            .FirstOrDefaultAsync(a => a.Id == appointment.Id);
        Assert.NotNull(updatedAppointment);
        Assert.Equal("Confirmed", updatedAppointment.Status);
        Assert.Equal("Personal Care", updatedAppointment.ServiceType);

        context.Dispose();
    }

    [Fact]
    // Test updating non-existent appointment (UPDATE - Negative)
    public async Task UpdateAsync_NonExistentAppointment_ReturnsNull()
    {
        // Arrange
        var (context, repository, _, _, _) = await SetupTestData();

        var updateDto = new AppointmentUpdateDto
        {
            Status = "Confirmed",
            ServiceType = "Companionship"
        };

        // Act
        var result = await repository.UpdateAsync(999, updateDto); // Non-existent ID

        // Assert
        Assert.Null(result);

        context.Dispose();
    }

    [Fact]
    // Test updating appointment with new availability that is already booked (UPDATE - Negative)
    public async Task UpdateAsync_NewAvailabilityAlreadyBooked_ThrowsInvalidOperationException()
    {
        // Arrange
        var (context, repository, patient, worker, availability) = await SetupTestData();

        // Create original appointment
        var originalAppointment = new Appointment
        {
            AvailabilityId = availability.Id,
            PatientId = patient.Id,
            Status = "Pending",
            ServiceType = "Medical Care",
            RequestedLocalTime = DateTime.Today.AddDays(1).AddHours(10),
            CreatedAt = DateTime.UtcNow
        };
        context.Appointments.Add(originalAppointment);
        await context.SaveChangesAsync();

        // Create another availability that is already booked
        var bookedAvailability = new Availability
        {
            HealthcareWorkerId = worker.Id,
            Date = DateTime.Today.AddDays(3),
            StartTime = new TimeSpan(9, 0, 0),
            EndTime = new TimeSpan(17, 0, 0)
        };
        context.Availabilities.Add(bookedAvailability);
        await context.SaveChangesAsync();

        var bookedAppointment = new Appointment
        {
            AvailabilityId = bookedAvailability.Id,
            PatientId = patient.Id,
            Status = "Approved",
            ServiceType = "Personal Care",
            RequestedLocalTime = DateTime.Today.AddDays(3).AddHours(14),
            CreatedAt = DateTime.UtcNow
        };
        context.Appointments.Add(bookedAppointment);
        bookedAvailability.Appointment = bookedAppointment;
        await context.SaveChangesAsync();

        var updateDto = new AppointmentUpdateDto
        {
            AvailabilityId = bookedAvailability.Id // Try to update to already booked availability
        };

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(async () =>
            await repository.UpdateAsync(originalAppointment.Id, updateDto));

        context.Dispose();
    }

    [Fact]
    // Test deleting appointment as admin (DELETE - Positive)
    public async Task DeleteAsync_AsAdmin_ReturnsTrueAndSetsStatusToRejected()
    {
        // Arrange
        var (context, repository, patient, worker, availability) = await SetupTestData();

        var appointment = new Appointment
        {
            AvailabilityId = availability.Id,
            PatientId = patient.Id,
            Status = "Pending",
            ServiceType = "Medication Delivery",
            RequestedLocalTime = DateTime.Today.AddDays(1).AddHours(10),
            CreatedAt = DateTime.UtcNow
        };
        context.Appointments.Add(appointment);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.DeleteAsync(appointment.Id, "Admin");

        // Assert
        Assert.True(result);

        // Verify status changed to Rejected but appointment still exists
        var deletedAppointment = await context.Appointments.FindAsync(appointment.Id);
        Assert.NotNull(deletedAppointment);
        Assert.Equal("Rejected", deletedAppointment.Status);

        context.Dispose();
    }

    [Fact]
    // Test deleting non-existent appointment (DELETE - Negative)
    public async Task DeleteAsync_NonExistentAppointment_ReturnsFalse()
    {
        // Arrange
        var (context, repository, _, _, _) = await SetupTestData();

        // Act
        var result = await repository.DeleteAsync(999, "Admin"); // Non-existent ID

        // Assert
        Assert.False(result);

        context.Dispose();
    }

}

