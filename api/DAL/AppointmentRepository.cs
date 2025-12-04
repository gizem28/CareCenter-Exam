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

        public async Task<Appointment> CreateAsync(AppointmentCreateDto dto)
        {
            try
            {
                _logger.LogInformation("Creating appointment for PatientId={PatientId}, AvailabilityId={AvailabilityId}",
                    dto.PatientId, dto.AvailabilityId);

                var availability = await _context.Availabilities
                    .Include(a => a.Appointment)
                    .FirstOrDefaultAsync(a => a.Id == dto.AvailabilityId);

                if (availability == null)
                    throw new InvalidOperationException("Availability not found.");

                if (availability.Appointment != null)
                    throw new InvalidOperationException("This availability is already booked.");

                TimeSpan? selectedStartTime = null;

                if (!string.IsNullOrEmpty(dto.SelectedStartTime) &&
                    TimeSpan.TryParse(dto.SelectedStartTime, out var startTime))
                {
                    selectedStartTime = startTime;
                }

                var appointment = new Appointment
                {
                    AvailabilityId = dto.AvailabilityId,
                    PatientId = dto.PatientId,
                    Status = "Pending",
                    ServiceType = dto.ServiceType,
                    CreatedAt = DateTime.UtcNow,
                    RequestedLocalTime = dto.RequestedLocalTime,
                    SelectedStartTime = selectedStartTime,
                };

                _context.Appointments.Add(appointment);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Appointment {AppointmentId} created successfully.", appointment.Id);

                return appointment;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error while creating appointment for AvailabilityId={AvailabilityId}, PatientId={PatientId}",
                    dto.AvailabilityId, dto.PatientId);

                throw; 
            }
        }

        public async Task<IEnumerable<Appointment>> GetByPatientAsync(int patientId)
        {
            try
            {
                _logger.LogInformation("Fetching appointments for PatientId={PatientId}", patientId);

                return await _context.Appointments
                    .Include(a => a.Availability).ThenInclude(av => av.HealthcareWorker)
                    .Include(a => a.Tasks)
                    .Where(a => a.PatientId == patientId)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while fetching appointments for PatientId={PatientId}", patientId);
                throw;
            }
        }

        public async Task<Appointment?> UpdateAsync(int id, AppointmentUpdateDto dto)
        {
            try
            {
                _logger.LogInformation("Updating appointment Id={Id}", id);

                var appointment = await _context.Appointments
                    .Include(a => a.Availability)
                    .Include(a => a.Tasks)
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (appointment == null)
                    return null;

                if (dto.AvailabilityId.HasValue)
                {
                    var newAvailability = await _context.Availabilities
                        .Include(a => a.Appointment)
                        .FirstOrDefaultAsync(a => a.Id == dto.AvailabilityId.Value);

                    if (newAvailability == null)
                        throw new InvalidOperationException("New availability not found.");

                    if (newAvailability.Appointment != null &&
                        newAvailability.Appointment.Id != appointment.Id)
                        throw new InvalidOperationException("This availability is already booked.");

                    appointment.AvailabilityId = newAvailability.Id;
                }

                if (!string.IsNullOrEmpty(dto.Status))
                    appointment.Status = dto.Status;

                if (!string.IsNullOrEmpty(dto.ServiceType))
                    appointment.ServiceType = dto.ServiceType;

                if (dto.VisitNote != null)
                    appointment.VisitNote = dto.VisitNote;

                if (dto.Tasks != null && dto.Tasks.Any())
                {
                    _context.AppointmentTasks.RemoveRange(appointment.Tasks);

                    foreach (var t in dto.Tasks)
                    {
                        appointment.Tasks.Add(new AppointmentTask
                        {
                            Description = t,
                            Status = "Pending",
                            Done = false
                        });
                    }
                }

                if (!string.IsNullOrEmpty(dto.SelectedStartTime) &&
                    TimeSpan.TryParse(dto.SelectedStartTime, out var newStart))
                {
                    appointment.SelectedStartTime = newStart;
                }

                if (!string.IsNullOrEmpty(dto.SelectedEndTime) &&
                    TimeSpan.TryParse(dto.SelectedEndTime, out var newEnd))
                {
                    appointment.SelectedEndTime = newEnd;
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Appointment {Id} updated successfully.", id);

                return appointment;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while updating appointment Id={Id}", id);
                throw;
            }
        }

        public async Task<bool> DeleteAsync(int id, string? role = null)
        {
            try
            {
                _logger.LogInformation("Deleting appointment Id={Id}, Role={Role}", id, role);

                var appointment = await _context.Appointments
                    .Include(a => a.Availability)
                    .Include(a => a.Tasks)
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (appointment == null)
                    return false;

                if (role == "Admin")
                {
                    appointment.Status = "Rejected";
                    await _context.SaveChangesAsync();

                    _logger.LogInformation("Appointment {Id} rejected by Admin.", id);
                    return true;
                }

                if (role == "Patient")
                {
                    appointment.Status = "Cancelled";
                    await _context.SaveChangesAsync();

                    _logger.LogInformation("Appointment {Id} cancelled by Patient.", id);
                    return true;
                }

                if (appointment.Tasks.Any())
                    _context.AppointmentTasks.RemoveRange(appointment.Tasks);

                _context.Appointments.Remove(appointment);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Appointment {Id} permanently deleted.", id);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while deleting appointment Id={Id}", id);
                throw;
            }
        }

        public async Task<IEnumerable<Appointment>> GetByWorkerAsync(int workerId)
        {
            try
            {
                _logger.LogInformation("Fetching appointments for WorkerId={WorkerId}", workerId);

                return await _context.Appointments
                    .Include(a => a.Availability).ThenInclude(av => av.HealthcareWorker)
                    .Include(a => a.Tasks)
                    .Where(a => a.Availability.HealthcareWorkerId == workerId)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while fetching worker appointments WorkerId={WorkerId}", workerId);
                throw;
            }
        }

        public async Task<IEnumerable<Appointment>> GetAllAsync()
        {
            try
            {
                _logger.LogInformation("Fetching ALL appointments");

                return await _context.Appointments
                      .Include(a => a.Availability)
                    .ThenInclude(av => av.HealthcareWorker)
                .Include(a => a.Tasks)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while fetching all appointments");
                throw;
            }
        }

        public async Task<Appointment?> ApproveAsync(int id)
        {
            try
            {
                _logger.LogInformation("Approving appointment Id={Id}", id);

                var appointment = await _context.Appointments
                    .Include(a => a.Availability)
                    .Include(a => a.Tasks)
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (appointment == null)
                    return null;

                appointment.Status = "Approved";
                await _context.SaveChangesAsync();

                _logger.LogInformation("Appointment {Id} approved.", id);

                return appointment;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while approving appointment Id={Id}", id);
                throw;
            }
        }

        public async Task<Appointment?> RejectAsync(int id)
        {
            try
            {
                _logger.LogInformation("Rejecting appointment Id={Id}", id);

                var appointment = await _context.Appointments
                    .Include(a => a.Availability)
                    .Include(a => a.Tasks)
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (appointment == null)
                    return null;

                if (appointment.Tasks.Any())
                    _context.AppointmentTasks.RemoveRange(appointment.Tasks);

                _context.Appointments.Remove(appointment);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Appointment {Id} rejected and deleted.", id);

                return appointment;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while rejecting appointment Id={Id}", id);
                throw;
            }
        }
    }
}
