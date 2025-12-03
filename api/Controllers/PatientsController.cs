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

        public PatientsController(IPatientRepository repo, UserManager<AuthUser> userManager, RoleManager<IdentityRole> roleManager)
        {
            _repo = repo;
            _userManager = userManager;
            _roleManager = roleManager;
        }

        // ✅ GET: api/patients
        // Returns all patients in the system
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
                return StatusCode(500, new { message = "An error occurred while retrieving patients.", detail = ex.Message });
            }
        }

        // ✅ GET: api/patients/{id}
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
                return StatusCode(500, new { message = "An error occurred while retrieving the patient.", detail = ex.Message });
            }
        }

        // ✅ GET: api/patients/email/{email}
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
                return StatusCode(500, new { message = "An error occurred while retrieving the patient.", detail = ex.Message });
            }
        }

        // ✅ POST: api/patients
        [HttpPost]
        public async Task<ActionResult<PatientDTO>> Add([FromBody] PatientDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                // UserId is required - patients must be created via AuthController.RegisterPatient first
                if (string.IsNullOrEmpty(dto.UserId))
                {
                    return BadRequest(new { message = "UserId is required. Patients must register via the authentication endpoint first." });
                }

                // Validate that the AuthUser exists
                var authUser = await _userManager.FindByIdAsync(dto.UserId);
                if (authUser == null)
                {
                    return BadRequest(new { message = $"AuthUser with ID {dto.UserId} not found." });
                }

                // Ensure the AuthUser has the Patient role
                if (!await _userManager.IsInRoleAsync(authUser, "Patient"))
                {
                    return BadRequest(new { message = $"User {dto.UserId} is not registered as a Patient." });
                }

                var result = await _repo.AddAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(409, new { message = "Database update error while adding patient.", detail = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while adding the patient.", detail = ex.Message });
            }
        }

        // ✅ PUT: api/patients/{id}
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
                return StatusCode(409, new { message = "Database update error while updating patient.", detail = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating the patient.", detail = ex.Message });
            }
        }

        // ✅ DELETE: api/patients/{id}
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
                return StatusCode(409, new { message = "Cannot delete patient due to related data.", detail = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while deleting the patient.", detail = ex.Message });
            }
        }

    }
}
