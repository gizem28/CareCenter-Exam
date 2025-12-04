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
            // Availability kontrolü
            var availability = await _context.Availabilities
                .Include(a => a.Appointment)
                .FirstOrDefaultAsync(a => a.Id == dto.AvailabilityId);

            if (availability == null)
                throw new InvalidOperationException("Availability not found.");

            if (availability.Appointment != null)
                throw new InvalidOperationException("This availability is already booked.");

            // Convert string time to TimeSpan if provided
            TimeSpan? selectedStartTime = null;

            if (!string.IsNullOrEmpty(dto.SelectedStartTime))
            {
                if (TimeSpan.TryParse(dto.SelectedStartTime, out var startTime))
                {
                    selectedStartTime = startTime;
                }
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

            return appointment;
        }

        public async Task<IEnumerable<Appointment>> GetByPatientAsync(int patientId)
        {
            return await _context.Appointments
                .Include(a => a.Availability)
                .ThenInclude(av => av.HealthcareWorker)
                .Where(a => a.PatientId == patientId)
                .ToListAsync();
        }

        public async Task<Appointment?> UpdateAsync(int id, AppointmentUpdateDto dto)
        {
            var appointment = await _context.Appointments
                .Include(a => a.Availability)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (appointment == null)
                return null;

            // Admin worker değiştirmek isterse → AvailabilityId güncelle
            if (dto.AvailabilityId.HasValue)
            {
                var newAvailability = await _context.Availabilities
                    .Include(a => a.Appointment)
                    .FirstOrDefaultAsync(a => a.Id == dto.AvailabilityId.Value);

                if (newAvailability == null)
                    throw new InvalidOperationException("New availability not found.");

                // Allow updating if:
                // 1. It's the same availability (current appointment), OR
                // 2. The availability has no other appointment
                if (newAvailability.Appointment != null && newAvailability.Appointment.Id != appointment.Id)
                    throw new InvalidOperationException("This worker's availability is already booked.");

                appointment.AvailabilityId = newAvailability.Id;
            }

            if (!string.IsNullOrEmpty(dto.Status))
                appointment.Status = dto.Status;

            if (!string.IsNullOrEmpty(dto.ServiceType))
                appointment.ServiceType = dto.ServiceType;

            // Update selected start time if provided
            if (!string.IsNullOrEmpty(dto.SelectedStartTime))
            {
                if (TimeSpan.TryParse(dto.SelectedStartTime, out var startTime))
                {
                    appointment.SelectedStartTime = startTime;
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

            // Admin "Reject" etmek isterse sadece status değiştir
            if (role == "Admin")
            {
                appointment.Status = "Rejected";
                await _context.SaveChangesAsync();
                return true;
            }

            // Patient ise sadece kendi randevusunu iptal eder
            if (role == "Patient")
            {
                appointment.Status = "Cancelled";
                await _context.SaveChangesAsync();
                return true;
            }

            // Admin gerçekten tamamen silmek isterse (isteğe bağlı)
            _context.Appointments.Remove(appointment);
            await _context.SaveChangesAsync();
            return true;
        }


        public async Task<IEnumerable<Appointment>> GetByWorkerAsync(int workerId)
        {
            return await _context.Appointments
                .Include(a => a.Availability)
                    .ThenInclude(av => av.HealthcareWorker)
                .Where(a => a.Availability.HealthcareWorkerId == workerId)
                .ToListAsync();
        }

        public async Task<IEnumerable<Appointment>> GetAllAsync()
        {
            return await _context.Appointments
                .Include(a => a.Availability)
                    .ThenInclude(av => av.HealthcareWorker)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();
        }

        public async Task<Appointment?> ApproveAsync(int id)
        {
            var appointment = await _context.Appointments
                .Include(a => a.Availability)
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
                .FirstOrDefaultAsync(a => a.Id == id);

            if (appointment == null)
                return null;

            // Delete the appointment to release the availability slot
            // The availability will become available again for booking
            _context.Appointments.Remove(appointment);
            await _context.SaveChangesAsync();

            return appointment;
        }
    }
}
