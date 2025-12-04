using CareCenter.DTOs;
using CareCenter.Models;
using Microsoft.EntityFrameworkCore;

namespace CareCenter.DAL
{
    public class AppointmentRepository : IAppointmentRepository
    {
        private readonly AppDbContext _context;

        public AppointmentRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Appointment> CreateAsync(AppointmentCreateDto dto)
        {
        
            var availability = await _context.Availabilities
                .Include(a => a.Appointment)
                .FirstOrDefaultAsync(a => a.Id == dto.AvailabilityId);

            if (availability == null)
                throw new InvalidOperationException("Availability not found.");

            if (availability.Appointment != null)
                throw new InvalidOperationException("This availability is already booked.");

            TimeSpan? selectedStartTime = null;
            TimeSpan? selectedEndTime = null;

            if (!string.IsNullOrEmpty(dto.SelectedStartTime))
            {
                if (TimeSpan.TryParse(dto.SelectedStartTime, out var startTime))
                {
                    selectedStartTime = startTime;
                }
            }

            if (!string.IsNullOrEmpty(dto.SelectedEndTime))
            {
                if (TimeSpan.TryParse(dto.SelectedEndTime, out var endTime))
                {
                    selectedEndTime = endTime;
                }
            }

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

            return appointment;
        }

        public async Task<IEnumerable<Appointment>> GetByPatientAsync(int patientId)
        {
            return await _context.Appointments
                .Include(a => a.Availability)
                .ThenInclude(av => av.HealthcareWorker)
                .Include(a => a.Tasks)
                .Where(a => a.PatientId == patientId)
                .ToListAsync();
        }

        public async Task<Appointment?> UpdateAsync(int id, AppointmentUpdateDto dto)
        {
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

            if (!string.IsNullOrEmpty(dto.SelectedStartTime))
            {
                if (TimeSpan.TryParse(dto.SelectedStartTime, out var startTime))
                {
                    appointment.SelectedStartTime = startTime;
                }
            }

            if (!string.IsNullOrEmpty(dto.SelectedEndTime))
            {
                if (TimeSpan.TryParse(dto.SelectedEndTime, out var endTime))
                {
                    appointment.SelectedEndTime = endTime;
                }
            }

            await _context.SaveChangesAsync();
            return appointment;
        }

        public async Task<bool> DeleteAsync(int id, string? role = null)
        {
            var appointment = await _context.Appointments
                .Include(a => a.Availability)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (appointment == null)
                return false;

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


        public async Task<IEnumerable<Appointment>> GetByWorkerAsync(int workerId)
        {
            return await _context.Appointments
                .Include(a => a.Availability)
                    .ThenInclude(av => av.HealthcareWorker)
                .Include(a => a.Tasks)
                .Where(a => a.Availability.HealthcareWorkerId == workerId)
                .ToListAsync();
        }

        public async Task<IEnumerable<Appointment>> GetAllAsync()
        {
            return await _context.Appointments
                .Include(a => a.Availability)
                    .ThenInclude(av => av.HealthcareWorker)
                .Include(a => a.Tasks)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();
        }

        public async Task<Appointment?> ApproveAsync(int id)
        {
            var appointment = await _context.Appointments
                .Include(a => a.Availability)
                .Include(a => a.Tasks)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (appointment == null)
                return null;

            appointment.Status = "Approved";
            await _context.SaveChangesAsync();

            return appointment;
        }

        public async Task<Appointment?> RejectAsync(int id)
        {
            var appointment = await _context.Appointments
                .Include(a => a.Availability)
                .Include(a => a.Tasks)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (appointment == null)
                return null;

            _context.Appointments.Remove(appointment);
            await _context.SaveChangesAsync();

            return appointment;
        }
    }
}
