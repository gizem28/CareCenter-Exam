using CareCenter.Models;
using CareCenter.DTOs;
using Microsoft.EntityFrameworkCore;

namespace CareCenter.DAL
{
    public class AvailabilityRepository : IAvailabilityRepository
    {
        private readonly AppDbContext _context;
        private readonly ILogger<AvailabilityRepository> _logger;

        public AvailabilityRepository(AppDbContext context, ILogger<AvailabilityRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        // ---------------- GET ALL ----------------
        public async Task<IEnumerable<AvailabilityDTO>> GetAllAsync()
        {
            try
            {
                return await _context.Availabilities
                    .Include(a => a.Appointment)
                    .Select(a => new AvailabilityDTO
                    {
                        Id = a.Id,
                        HealthcareWorkerId = a.HealthcareWorkerId,
                        Date = a.Date,
                        StartTime = a.StartTime,
                        EndTime = a.EndTime,
                        IsBooked = a.Appointment != null
                    })
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching availabilities");
                throw new Exception("Database error occurred while fetching availabilities.");
            }
        }

        // ---------------- ADD ----------------
        public async Task<AvailabilityDTO> AddAsync(AvailabilityDTO dto)
        {
            try
            {
                if (!dto.Date.HasValue)
                    throw new InvalidOperationException("Date is required.");

                var dateToAdd = dto.Date.Value;

                // 1️⃣ Geçmiş tarih kontrolü (lokal saat)
                if (dateToAdd.Date < DateTime.Now.Date)
                    throw new InvalidOperationException($"Cannot add past date: {dateToAdd:yyyy-MM-dd}");

                // 2️⃣ Maksimum 30 gün ileri kontrolü
                if ((dateToAdd.Date - DateTime.Now.Date).TotalDays > 30)
                    throw new InvalidOperationException($"Availability can only be added up to 30 days ahead (invalid: {dateToAdd:yyyy-MM-dd}).");

                // 3️⃣ Aynı güne ikinci giriş varsa hata
                var exists = await _context.Availabilities.AnyAsync(a =>
                    a.HealthcareWorkerId == dto.HealthcareWorkerId &&
                    a.Date.Date == dateToAdd.Date);

                if (exists)
                {
                    throw new InvalidOperationException($"Availability already exists for date: {dateToAdd:yyyy-MM-dd}");
                }

                // 4️⃣ Ekleme
                var availability = new Availability
                {
                    HealthcareWorkerId = dto.HealthcareWorkerId,
                    Date = dateToAdd,
                    StartTime = dto.StartTime,
                    EndTime = dto.EndTime
                };

                _context.Availabilities.Add(availability);
                await _context.SaveChangesAsync();

                return new AvailabilityDTO
                {
                    Id = availability.Id,
                    HealthcareWorkerId = availability.HealthcareWorkerId,
                    Date = availability.Date,
                    StartTime = availability.StartTime,
                    EndTime = availability.EndTime,
                    IsBooked = false
                };
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Validation or duplicate error while adding availability");
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Database error while adding availability");
                throw new Exception("Database error occurred while adding availability.");
            }
        }
        public async Task<AvailabilityDTO?> UpdateAsync(int id, AvailabilityDTO dto)
        {
            var entity = await _context.Availabilities
                .Include(a => a.Appointment)
                .FirstOrDefaultAsync(a => a.Id == id);
            
            if (entity == null)
                return null;

            // Validation - use Date if provided, otherwise keep existing
            var dateToUpdate = dto.Date ?? entity.Date;
            
            if (dateToUpdate.Date < DateTime.Today)
                throw new InvalidOperationException("Cannot update to a past date.");

            if ((dateToUpdate.Date - DateTime.Today).TotalDays > 30)
                throw new InvalidOperationException("Date cannot be more than 30 days in the future.");

            // Update fields
            entity.Date = dateToUpdate;
            if (dto.StartTime.HasValue)
                entity.StartTime = dto.StartTime;
            if (dto.EndTime.HasValue)
                entity.EndTime = dto.EndTime;

            await _context.SaveChangesAsync();

            return new AvailabilityDTO
            {
                Id = entity.Id,
                HealthcareWorkerId = entity.HealthcareWorkerId,
                Date = entity.Date,
                StartTime = entity.StartTime,
                EndTime = entity.EndTime,
                IsBooked = entity.Appointment != null
            };
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var entity = await _context.Availabilities.FindAsync(id);
            if (entity == null)
                return false;

            _context.Availabilities.Remove(entity);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<AvailabilityDTO>> GetUnbookedAsync()
        {
            var results = await _context.Availabilities
                .Include(a => a.Appointment)
                .Include(a => a.HealthcareWorker)
                .Where(a => a.Appointment == null && a.Date >= DateTime.Today) // Only unbooked and future dates
                .Select(a => new AvailabilityDTO
                {
                    Id = a.Id,
                    HealthcareWorkerId = a.HealthcareWorkerId,
                    Date = a.Date,
                    StartTime = a.StartTime,
                    EndTime = a.EndTime,
                    IsBooked = false,
                    HealthcareWorkerName = a.HealthcareWorker.FullName,
                    HealthcareWorkerPosition = a.HealthcareWorker.Position
                })
                .ToListAsync();

            // Order in memory to avoid SQLite TimeSpan ordering limitation
            return results
                .OrderBy(a => a.Date)
                .ThenBy(a => a.StartTime ?? TimeSpan.Zero)
                .ToList();
        }

        public async Task<IEnumerable<AvailabilityDTO>> GetByWorkerAsync(int workerId)
        {
            try
            {
                return await _context.Availabilities
                    .Include(a => a.Appointment)
                    .Where(a => a.HealthcareWorkerId == workerId)
                    .Select(a => new AvailabilityDTO
                    {
                        Id = a.Id,
                        HealthcareWorkerId = a.HealthcareWorkerId,
                        Date = a.Date,
                        StartTime = a.StartTime,
                        EndTime = a.EndTime,
                        IsBooked = a.Appointment != null
                    })
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching availabilities for worker {WorkerId}", workerId);
                throw new Exception("Database error occurred while fetching worker availabilities.");
            }
        }
    }
}
