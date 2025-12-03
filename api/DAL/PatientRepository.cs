using CareCenter.Models;
using CareCenter.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;

namespace CareCenter.DAL
{
    // Repository for patient data operations
    public class PatientRepository : IPatientRepository
    {
        private readonly AppDbContext _context;
        private readonly ILogger<PatientRepository> _logger;
        private readonly UserManager<AuthUser> _userManager;

        // Constructor with database context and user manager
        // Dette kobler opp databasen og brukerhåndteringstjenesten
        public PatientRepository(AppDbContext context, ILogger<PatientRepository> logger, UserManager<AuthUser> userManager)
        {
            _context = context;
            _logger = logger;
            _userManager = userManager;
        }

        // ---------------- GET ALL ----------------
        public async Task<IEnumerable<PatientDTO>> GetAllAsync()
        {
            try
            {
                return await _context.Patients
                    .Select(p => new PatientDTO
                    {
                        Id = p.Id,
                        UserId = p.UserId,
                        FullName = p.FullName,
                        Address = p.Address,
                        Phone = p.Phone,
                        Email = p.Email,
                        BirthDate = p.BirthDate
                    })
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching patients from database");
                throw new Exception("Database error occurred while fetching patients.");
            }
        }

        // ---------------- GET BY ID ----------------
        // Find patient by their unique ID number
        public async Task<PatientDTO?> GetByIdAsync(int id)
        {
            try
            {
                var p = await _context.Patients.FindAsync(id);
                if (p == null) return null;

                return new PatientDTO
                {
                    Id = p.Id,
                    UserId = p.UserId,
                    FullName = p.FullName,
                    Address = p.Address,
                    Phone = p.Phone,
                    Email = p.Email,
                    BirthDate = p.BirthDate
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching patient by ID");
                throw new Exception("Database error occurred while fetching patient.");
            }
        }

        // ---------------- GET BY EMAIL ----------------
        public async Task<PatientDTO?> GetByEmailAsync(string email)
        {
            try
            {
                var p = await _context.Patients
                    .FirstOrDefaultAsync(p => p.Email == email);
                
                if (p == null) return null;

                return new PatientDTO
                {
                    Id = p.Id,
                    UserId = p.UserId,
                    FullName = p.FullName,
                    Address = p.Address,
                    Phone = p.Phone,
                    Email = p.Email,
                    BirthDate = p.BirthDate
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching patient by email");
                throw new Exception("Database error occurred while fetching patient.");
            }
        }

        // ---------------- ADD ----------------
        // Add new patient record - requires valid UserId from AuthUser
        public async Task<PatientDTO> AddAsync(PatientDTO dto)
        {
            try
            {
                // Validate UserId exists
                if (string.IsNullOrEmpty(dto.UserId))
                    throw new InvalidOperationException("UserId is required. Patient must be linked to an AuthUser.");

                var authUser = await _userManager.FindByIdAsync(dto.UserId);
                if (authUser == null)
                    throw new InvalidOperationException($"AuthUser with ID {dto.UserId} not found.");

                // ✅ Duplicate kontrolü - only check for UserId conflicts (one patient per user)
                var exists = await _context.Patients.AnyAsync(p => p.UserId == dto.UserId);

                if (exists)
                    throw new InvalidOperationException("A patient record already exists for this user.");

                var patient = new Patient
                {
                    UserId = dto.UserId,
                    FullName = dto.FullName,
                    Address = dto.Address,
                    Phone = dto.Phone,
                    Email = dto.Email,
                    BirthDate = dto.BirthDate
                };

                _context.Patients.Add(patient);
                await _context.SaveChangesAsync();

                dto.Id = patient.Id;
                return dto;
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Duplicate patient detected or invalid UserId");
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding patient");
                throw new Exception("Database error occurred while adding patient.");
            }
        }

        // ---------------- UPDATE ----------------
        // Update existing patient information in database
        public async Task<bool> UpdateAsync(PatientDTO dto)
        {
            try
            {
                var patient = await _context.Patients.FindAsync(dto.Id);
                if (patient == null) return false;

                patient.FullName = dto.FullName;
                patient.Address = dto.Address;
                patient.Phone = dto.Phone;
                patient.Email = dto.Email;
                patient.BirthDate = dto.BirthDate;

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating patient");
                throw new Exception("Database error occurred while updating patient.");
            }
        }

        // ---------------- DELETE ----------------
        public async Task<bool> DeleteAsync(int id)
        {
            try
            {
                var patient = await _context.Patients.FindAsync(id);
                if (patient == null) return false;

                // Get all appointments for this patient, including their tasks
                var appointments = await _context.Appointments
                    .Include(apt => apt.Tasks)
                    .Where(apt => apt.PatientId == id)
                    .ToListAsync();

                // Delete all appointment tasks first
                foreach (var appointment in appointments)
                {
                    if (appointment.Tasks != null && appointment.Tasks.Any())
                    {
                        _context.AppointmentTasks.RemoveRange(appointment.Tasks);
                    }
                }

                // Delete all appointments for this patient
                if (appointments.Any())
                {
                    _context.Appointments.RemoveRange(appointments);
                }

                // Save changes to delete appointments first
                await _context.SaveChangesAsync();

                // Store UserId before deleting patient
                var userId = patient.UserId;

                // Delete the patient first
                _context.Patients.Remove(patient);
                await _context.SaveChangesAsync();

                // Delete the associated AuthUser (cascade delete would have handled it, but we do it explicitly for clarity)
                if (!string.IsNullOrEmpty(userId))
                {
                    var authUser = await _userManager.FindByIdAsync(userId);
                    if (authUser != null)
                    {
                        var deleteResult = await _userManager.DeleteAsync(authUser);
                        if (!deleteResult.Succeeded)
                        {
                            _logger.LogWarning("Failed to delete AuthUser for patient {PatientId}: {Errors}", 
                                id, string.Join(", ", deleteResult.Errors.Select(e => e.Description)));
                            // Don't throw - patient is already deleted
                        }
                    }
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting patient");
                throw new Exception("Database error occurred while deleting patient.");
            }
        }
    }
}
