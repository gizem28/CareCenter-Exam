using CareCenter.DTOs;
using CareCenter.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;

namespace CareCenter.DAL
{
    public class HealthcareWorkerRepository : IHealthcareWorkerRepository
    {
        private readonly AppDbContext _context;
        private readonly ILogger<HealthcareWorkerRepository> _logger;
        private readonly UserManager<AuthUser> _userManager;

        public HealthcareWorkerRepository(AppDbContext context, ILogger<HealthcareWorkerRepository> logger, UserManager<AuthUser> userManager)
        {
            _context = context;
            _logger = logger;
            _userManager = userManager;
        }

        // ---------------- GET ALL ----------------
        public async Task<IEnumerable<HealthcareWorkerDTO>> GetAllAsync()
        {
            try
            {
                return await _context.HealthcareWorkers
                    .Select(w => new HealthcareWorkerDTO
                    {
                        Id = w.Id,
                        UserId = w.UserId,
                        FullName = w.FullName,
                        Phone = w.Phone,
                        Email = w.Email,
                        Position = w.Position
                    })
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching healthcare workers");
                throw new Exception("Database error occurred while fetching healthcare workers.");
            }
        }

        // ---------------- GET BY ID ----------------
        public async Task<HealthcareWorkerDTO?> GetByIdAsync(int id)
        {
            try
            {
                var w = await _context.HealthcareWorkers.FindAsync(id);
                if (w == null) return null;

                return new HealthcareWorkerDTO
                {
                    Id = w.Id,
                    UserId = w.UserId,
                    FullName = w.FullName,
                    Phone = w.Phone,
                    Email = w.Email,
                    Position = w.Position
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching healthcare worker by ID");
                throw new Exception("Database error occurred while fetching healthcare worker.");
            }
        }

        // ---------------- GET BY EMAIL ----------------
        public async Task<HealthcareWorkerDTO?> GetByEmailAsync(string email)
        {
            try
            {
                var w = await _context.HealthcareWorkers
                    .FirstOrDefaultAsync(w => w.Email == email);
                
                if (w == null) return null;

                return new HealthcareWorkerDTO
                {
                    Id = w.Id,
                    UserId = w.UserId,
                    FullName = w.FullName,
                    Phone = w.Phone,
                    Email = w.Email,
                    Position = w.Position
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching healthcare worker by email");
                throw new Exception("Database error occurred while fetching healthcare worker.");
            }
        }

        // ---------------- ADD ----------------
        public async Task<HealthcareWorkerDTO> AddAsync(HealthcareWorkerDTO dto)
        {
            try
            {
                
                if (string.IsNullOrEmpty(dto.UserId))
                    throw new InvalidOperationException("UserId is required. Healthcare worker must be linked to an AuthUser.");

                var authUser = await _userManager.FindByIdAsync(dto.UserId);
                if (authUser == null)
                    throw new InvalidOperationException($"AuthUser with ID {dto.UserId} not found.");

              
                var exists = await _context.HealthcareWorkers.AnyAsync(w =>
                    w.UserId == dto.UserId ||
                    w.Email.ToLower() == dto.Email.ToLower() ||
                    w.Phone == dto.Phone ||
                    w.FullName.ToLower() == dto.FullName.ToLower());

                if (exists)
                    throw new InvalidOperationException("A healthcare worker with the same UserId, email, phone, or name already exists.");

                var w = new HealthcareWorker
                {
                    UserId = dto.UserId,
                    FullName = dto.FullName,
                    Phone = dto.Phone,
                    Email = dto.Email,
                    Position = dto.Position
                };

                _context.HealthcareWorkers.Add(w);
                await _context.SaveChangesAsync();

                dto.Id = w.Id;
                return dto;
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Duplicate healthcare worker detected or invalid UserId");
                throw; 
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding healthcare worker");
                throw new Exception("Database error occurred while adding healthcare worker.");
            }
        }

        // ---------------- UPDATE ----------------
        public async Task<bool> UpdateAsync(HealthcareWorkerDTO dto)
        {
            try
            {
                var w = await _context.HealthcareWorkers.FindAsync(dto.Id);
                if (w == null)
                    return false;

                w.FullName = dto.FullName;
                w.Phone = dto.Phone;
                w.Email = dto.Email;
                w.Position = dto.Position;

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating healthcare worker");
                throw new Exception("Database error occurred while updating healthcare worker.");
            }
        }

        // ---------------- DELETE ----------------
        public async Task<bool> DeleteAsync(int id)
        {
            try
            {
                var w = await _context.HealthcareWorkers.FindAsync(id);
                if (w == null)
                    return false;

                // Get all availabilities for this worker, including their appointments and tasks
                var availabilities = await _context.Availabilities
                    .Include(av => av.Appointment)
                        .ThenInclude(apt => apt!.Tasks)
                    .Where(av => av.HealthcareWorkerId == id)
                    .ToListAsync();

                // Delete all appointments and their tasks associated with this worker's availabilities
                foreach (var availability in availabilities)
                {
                    if (availability.Appointment != null)
                    {
                        
                        if (availability.Appointment.Tasks != null && availability.Appointment.Tasks.Any())
                        {
                            _context.AppointmentTasks.RemoveRange(availability.Appointment.Tasks);
                        }
                       
                        _context.Appointments.Remove(availability.Appointment);
                    }
                }

                // Delete all availabilities for this worker
                if (availabilities.Any())
                {
                    _context.Availabilities.RemoveRange(availabilities);
                }

               
                await _context.SaveChangesAsync();

                
                var userId = w.UserId;

              
                _context.HealthcareWorkers.Remove(w);
                await _context.SaveChangesAsync();

                // Delete the associated AuthUser 
                if (!string.IsNullOrEmpty(userId))
                {
                    var authUser = await _userManager.FindByIdAsync(userId);
                    if (authUser != null)
                    {
                        var deleteResult = await _userManager.DeleteAsync(authUser);
                        if (!deleteResult.Succeeded)
                        {
                            _logger.LogWarning("Failed to delete AuthUser for healthcare worker {WorkerId}: {Errors}", 
                                id, string.Join(", ", deleteResult.Errors.Select(e => e.Description)));
                        
                        }
                    }
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting healthcare worker");
                throw new Exception("Database error occurred while deleting healthcare worker.");
            }
        }
    }
}
