using CareCenter.DTOs;
using CareCenter.Models;
using Microsoft.EntityFrameworkCore;

namespace CareCenter.DAL
{
    public class AppointmentRepository : IAppointmentRepository
    {
        private readonly AppDbContext _context;
        private readonly ILogger<AppointmentRepository> _logger;

        public AppointmentRepository(AppDbContext context, ILogger<AppointmentRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        // ---------------- CREATE ----------------
        public async Task<Appointment> CreateAsync(AppointmentCreateDto dto)
        {
            try
            {
                _logger.LogInformation("Creating appointment for PatientId {PatientId}", dto.PatientId);

                var availability = await _context.Availabilities
                    .Include(a => a.Appointment)
                    .FirstOrDefaultAsync(a => a.Id == dto.AvailabilityId);

                if (availability == null)
                {
                    _logger.LogWarning("Availability not found for ID {Id}", dto.AvailabilityId);
                    throw new InvalidOperationException("Availability not found.");
                }

                if (availability.Appointment != null)
                {
                    _logger.LogWarning("Availability {Id} is already booked", dto.AvailabilityId);
                    throw new InvalidOperationException("This availability is already booked.");
                }

                TimeSpan? selectedStartTime = null;
                TimeSpan? selectedEndTime = null;

                if (TimeSpan.TryParse(dto.SelectedStartTime, out var startTime))
                    selectedStartTime = startTime;

                if (TimeSpan.TryParse(dto.SelectedEndTime, out var endTime))
                    selectedEndTime = endTime;

                var appointment = new Appointment
                {
                    AvailabilityId = dto.AvailabilityId,
                    PatientId = dto.PatientId,
                    Status = "Pending",
                    CreatedAt = DateTime.UtcNow,
                    RequestedLocalTime = dto.RequestedLocalTime,
                    SelectedStartTime = selectedStartTime,
                    SelectedEndTime = selectedEndTime,
                };

                foreach (var task in dto.Tasks)
                {
                    appointment.Tasks.Add(new AppointmentTask { Description = task });
                }

                _context.Appointments.Add(appointment);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Appointment {Id} created successfully", appointment.Id);
                return appointment;
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Business rule validation failed during appointment creation");
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while creating appointment");
                throw;
            }
        }

        // ---------------- GET BY PATIENT ----------------
        public async Task<IEnumerable<Appointment>> GetByPatientAsync(int patientId)
        {
            try
            {
                _logger.LogInformation("Fetching appointments for patient {Id}", patientId);

                return await _context.Appointments
                    .Include(a => a.Availability)
                        .ThenInclude(av => av.HealthcareWorker)
                    .Include(a => a.Tasks)
                    .Where(a => a.PatientId == patientId)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching appointments for patient {Id}", patientId);
                throw;
            }
        }

        // ---------------- UPDATE ----------------
        public async Task<Appointment?> UpdateAsync(int id, AppointmentUpdateDto dto)
        {
            try
            {
                _logger.LogInformation("Updating appointment {Id}", id);

                var appointment = await _context.Appointments
                    .Include(a => a.Availability)
                    .Include(a => a.Tasks)
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (appointment == null)
                {
                    _logger.LogWarning("Appointment {Id} not found", id);
                    return null;
                }

                if (dto.AvailabilityId.HasValue)
                {
                    var newAvailability = await _context.Availabilities
                        .Include(a => a.Appointment)
                        .FirstOrDefaultAsync(a => a.Id == dto.AvailabilityId.Value);

                    if (newAvailability == null)
                        throw new InvalidOperationException("New availability not found.");

                    if (newAvailability.Appointment != null && newAvailability.Appointment.Id != appointment.Id)
                        throw new InvalidOperationException("This worker's availability is already booked.");

                    appointment.AvailabilityId = newAvailability.Id;
                }

                if (!string.IsNullOrEmpty(dto.Status))
                    appointment.Status = dto.Status;

                if (!string.IsNullOrEmpty(dto.VisitNote))
                    appointment.VisitNote = dto.VisitNote;

                if (dto.Tasks != null && dto.Tasks.Any())
                {
                    _context.AppointmentTasks.RemoveRange(appointment.Tasks);

                    foreach (var task in dto.Tasks)
                    {
                        appointment.Tasks.Add(new AppointmentTask
                        {
                            Description = task,
                            Status = "Pending",
                            Done = false
                        });
                    }
                }

                if (TimeSpan.TryParse(dto.SelectedStartTime, out var startTime))
                    appointment.SelectedStartTime = startTime;

                if (TimeSpan.TryParse(dto.SelectedEndTime, out var endTime))
                    appointment.SelectedEndTime = endTime;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Appointment {Id} updated successfully", id);
                return appointment;
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Business rule validation failed while updating appointment {Id}", id);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while updating appointment {Id}", id);
                throw;
            }
        }

        // ---------------- DELETE ----------------
        public async Task<bool> DeleteAsync(int id, string? role = null)
        {
            try
            {
                _logger.LogInformation("Deleting appointment {Id} as role {Role}", id, role);

                var appointment = await _context.Appointments
                    .Include(a => a.Availability)
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (appointment == null)
                {
                    _logger.LogWarning("Appointment {Id} not found", id);
                    return false;
                }

                if (role == "Admin")
                {
                    appointment.Status = "Rejected";
                    await _context.SaveChangesAsync();
                    return true;
                }

                if (role == "Patient")
                {
                    appointment.Status = "Cancelled";
                    await _context.SaveChangesAsync();
                    return true;
                }

                _context.Appointments.Remove(appointment);
                await _context.SaveChangesAsync();

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting appointment {Id}", id);
                throw;
            }
        }

        // ---------------- GET BY WORKER ----------------
        public async Task<IEnumerable<Appointment>> GetByWorkerAsync(int workerId)
        {
            try
            {
                _logger.LogInformation("Fetching appointments for worker {Id}", workerId);

                return await _context.Appointments
                    .Include(a => a.Availability)
                        .ThenInclude(av => av.HealthcareWorker)
                    .Include(a => a.Tasks)
                    .Where(a => a.Availability.HealthcareWorkerId == workerId)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching worker appointments for {Id}", workerId);
                throw;
            }
        }

        // ---------------- GET ALL ----------------
        public async Task<IEnumerable<Appointment>> GetAllAsync()
        {
            try
            {
                _logger.LogInformation("Fetching all appointments");

                return await _context.Appointments
                    .Include(a => a.Availability)
                        .ThenInclude(av => av.HealthcareWorker)
                    .Include(a => a.Tasks)
                    .OrderByDescending(a => a.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching all appointments");
                throw;
            }
        }

        // ---------------- APPROVE ----------------
        public async Task<Appointment?> ApproveAsync(int id)
        {
            try
            {
                _logger.LogInformation("Approving appointment {Id}", id);

                var appointment = await _context.Appointments
                    .Include(a => a.Availability)
                    .Include(a => a.Tasks)
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (appointment == null)
                {
                    _logger.LogWarning("Appointment {Id} not found", id);
                    return null;
                }

                appointment.Status = "Approved";
                await _context.SaveChangesAsync();

                return appointment;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error approving appointment {Id}", id);
                throw;
            }
        }

        // ---------------- REJECT ----------------
        public async Task<Appointment?> RejectAsync(int id)
        {
            try
            {
                _logger.LogInformation("Rejecting appointment {Id}", id);

                var appointment = await _context.Appointments
                    .Include(a => a.Availability)
                    .Include(a => a.Tasks)
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (appointment == null)
                {
                    _logger.LogWarning("Appointment {Id} not found", id);
                    return null;
                }

                _context.Appointments.Remove(appointment);
                await _context.SaveChangesAsync();

                return appointment;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rejecting appointment {Id}", id);
                throw;
            }
        }
    }
}
