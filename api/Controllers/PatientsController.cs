using CareCenter.DAL;
using CareCenter.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using CareCenter.Models;

namespace CareCenter.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PatientsController : ControllerBase
    {
        private readonly IPatientRepository _repo;
        private readonly UserManager<AuthUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly ILogger<PatientsController> _logger;

        public PatientsController(IPatientRepository repo, UserManager<AuthUser> userManager, RoleManager<IdentityRole> roleManager, ILogger<PatientsController> logger)
        {
            _repo = repo;
            _userManager = userManager;
            _roleManager = roleManager;
            _logger = logger;
        }

        //  GET: api/patients
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PatientDTO>>> GetAll()
        {
            try
            {
                var patients = await _repo.GetAllAsync();
                return Ok(patients);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while retrieving patients.");
                return StatusCode(500, new { message = "An error occurred while retrieving patients.", detail = ex.Message });
            }
        }

        //  GET: api/patients/{id}
        [HttpGet("{id:int}")]
        public async Task<ActionResult<PatientDTO>> GetById(int id)
        {
            try
            {
                var dto = await _repo.GetByIdAsync(id);
                if (dto == null)
                    return NotFound(new { message = $"Patient with ID {id} not found." });

                return Ok(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while retrieving patient with ID {Id}.", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the patient.", detail = ex.Message });
            }
        }

        //  GET: api/patients/email/{email}
        [HttpGet("email/{email}")]
        public async Task<ActionResult<PatientDTO>> GetByEmail(string email)
        {
            try
            {
                var dto = await _repo.GetByEmailAsync(email);
                if (dto == null)
                    return NotFound(new { message = $"Patient with email {email} not found." });

                return Ok(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while retrieving patient with email {Email}.", email);
                return StatusCode(500, new { message = "An error occurred while retrieving the patient.", detail = ex.Message });
            }
        }

        //  POST: api/patients
        [HttpPost]
        public async Task<ActionResult<PatientDTO>> Add([FromBody] PatientDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
           
                if (string.IsNullOrEmpty(dto.UserId))
                {
                    return BadRequest(new { message = "UserId is required. Patients must register via the authentication endpoint first." });
                }

                
                var authUser = await _userManager.FindByIdAsync(dto.UserId);
                if (authUser == null)
                {
                    _logger.LogWarning("AuthUser with ID {UserId} not found while adding patient.", dto.UserId);
                    return BadRequest(new { message = $"AuthUser with ID {dto.UserId} not found." });
                }

              
                if (!await _userManager.IsInRoleAsync(authUser, "Patient"))
                {
                    return BadRequest(new { message = $"User {dto.UserId} is not registered as a Patient." });
                }

                var result = await _repo.AddAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Invalid operation while adding patient.");
                return BadRequest(new { message = ex.Message });
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Database update error while adding patient.");
                return StatusCode(409, new { message = "Database update error while adding patient.", detail = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while adding patient.");
                return StatusCode(500, new { message = "An error occurred while adding the patient.", detail = ex.Message });
            }
        }

        //  PUT: api/patients/{id}
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] PatientDTO dto)
        {
            if (id != dto.Id)
                return BadRequest(new { message = "URL id does not match body id." });

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var success = await _repo.UpdateAsync(dto);
                if (!success)
                    return NotFound(new { message = $"Patient with ID {id} not found." });

                return NoContent();
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Database update error while updating patient with ID {Id}.", id);
                return StatusCode(409, new { message = "Database update error while updating patient.", detail = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while updating patient with ID {Id}.", id);
                return StatusCode(500, new { message = "An error occurred while updating the patient.", detail = ex.Message });
            }
        }

        //  DELETE: api/patients/{id}
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var success = await _repo.DeleteAsync(id);
                if (!success)
                    return NotFound(new { message = $"Patient with ID {id} not found." });

                return NoContent();
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Database update error while deleting patient with ID {Id}.", id);
                return StatusCode(409, new { message = "Cannot delete patient due to related data.", detail = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while deleting patient with ID {Id}.", id);
                return StatusCode(500, new { message = "An error occurred while deleting the patient.", detail = ex.Message });
            }
        }

    }
}
