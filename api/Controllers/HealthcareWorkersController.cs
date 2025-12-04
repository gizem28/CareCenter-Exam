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
    public class HealthcareWorkersController : ControllerBase
    {
        private readonly IHealthcareWorkerRepository _repo;
        private readonly UserManager<AuthUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly ILogger<HealthcareWorkersController> _logger;

        public HealthcareWorkersController(
            IHealthcareWorkerRepository repo,
            UserManager<AuthUser> userManager,
            RoleManager<IdentityRole> roleManager,
            ILogger<HealthcareWorkersController> logger)
        {
            _repo = repo;
            _userManager = userManager;
            _roleManager = roleManager;
            _logger = logger;
        }

        //  GET: api/healthcareworkers
        [HttpGet]
        public async Task<ActionResult<IEnumerable<HealthcareWorkerDTO>>> GetAll()
        {
            try
            {
                var workers = await _repo.GetAllAsync();
                return Ok(workers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving healthcare workers");
                return StatusCode(500, new { message = "An error occurred while retrieving healthcare workers.", detail = ex.Message });
            }
        }

        //  GET: api/healthcareworkers/5
        [HttpGet("{id:int}")]
        public async Task<ActionResult<HealthcareWorkerDTO>> GetById(int id)
        {
            try
            {
                var dto = await _repo.GetByIdAsync(id);
                if (dto == null)
                    return NotFound(new { message = $"Healthcare worker with ID {id} not found." });

                return Ok(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving healthcare worker with ID {Id}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the healthcare worker.", detail = ex.Message });
            }
        }

        //  GET: api/healthcareworkers/email/{email}
        [HttpGet("email/{email}")]
        public async Task<ActionResult<HealthcareWorkerDTO>> GetByEmail(string email)
        {
            try
            {
                var dto = await _repo.GetByEmailAsync(email);
                if (dto == null)
                    return NotFound(new { message = $"Healthcare worker with email {email} not found." });

                return Ok(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving healthcare worker with email {Email}", email);
                return StatusCode(500, new { message = "An error occurred while retrieving the healthcare worker.", detail = ex.Message });
            }
        }

        //  POST: api/healthcareworkers
        [HttpPost]
        public async Task<ActionResult<HealthcareWorkerDTO>> Create([FromBody] HealthcareWorkerDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                string? password = null;
                
              
                if (string.IsNullOrEmpty(dto.UserId))
                {
                   
                    var existingUser = await _userManager.FindByEmailAsync(dto.Email);
                    if (existingUser != null)
                    {
                        _logger.LogWarning("User with email {Email} already exists", dto.Email);
                        return Conflict(new { message = "A user with this email already exists" });
                    }

                    
                    if (!await _roleManager.RoleExistsAsync("Worker"))
                        await _roleManager.CreateAsync(new IdentityRole("Worker"));

                    var authUser = new AuthUser
                    {
                        UserName = dto.Email,
                        Email = dto.Email,
                        FullName = dto.FullName,
                        Role = "Worker",
                        EmailConfirmed = true 
                    };

               
                    if (!string.IsNullOrWhiteSpace(dto.Password) && dto.Password.Length >= 6)
                    {
                        password = dto.Password;
                    }
                    else
                    {
                   
                        return BadRequest(new { message = "Password is required and must be at least 6 characters" });
                    }
                    
                    var createResult = await _userManager.CreateAsync(authUser, password!);
                    if (!createResult.Succeeded)
                    {
                        _logger.LogError("Failed to create authentication account for worker {Email}. Errors: {Errors}", dto.Email, createResult.Errors.Select(e => e.Description));
                        return BadRequest(new { message = "Failed to create authentication account", errors = createResult.Errors.Select(e => e.Description) });
                    }

                    _logger.LogInformation("Successfully created AuthUser for worker {Email} with ID {UserId}",
                        dto.Email, authUser.Id);

                    await _userManager.AddToRoleAsync(authUser, "Worker");
                    dto.UserId = authUser.Id;
                }

                var created = await _repo.AddAsync(dto);
                
                if (!string.IsNullOrEmpty(password))
                {
                    var response = new
                    {
                        id = created.Id,
                        fullName = created.FullName,
                        email = created.Email,
                        phone = created.Phone,
                        position = created.Position,
                        password = password,
                        message = "Worker created successfully. Please share the password with the worker."
                    };
                    return CreatedAtAction(nameof(GetById), new { id = created.Id }, response);
                }

                return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Invalid operation while creating healthcare worker.");
                return BadRequest(new { message = ex.Message });
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Database update error while creating healthcare worker.");
                return StatusCode(409, new { message = "Database update error while creating healthcare worker.", detail = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while creating healthcare worker.");
                return StatusCode(500, new { message = "An error occurred while creating healthcare worker.", detail = ex.Message });
            }
        }

        //  PUT: api/healthcareworkers/5
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] HealthcareWorkerDTO dto)
        {
            if (id != dto.Id)
                return BadRequest(new { message = "URL id does not match body id." });

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var ok = await _repo.UpdateAsync(dto);
                if (!ok)
                    return NotFound(new { message = $"Healthcare worker with ID {id} not found." });

                return NoContent();
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Database update error while updating healthcare worker with ID {Id}.", id);
                return StatusCode(409, new { message = "Database update error while updating healthcare worker.", detail = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while updating healthcare worker with ID {Id}.", id);
                return StatusCode(500, new { message = "An error occurred while updating healthcare worker.", detail = ex.Message });
            }
        }

        //  DELETE: api/healthcareworkers/5
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var ok = await _repo.DeleteAsync(id);
                if (!ok)
                    return NotFound(new { message = $"Healthcare worker with ID {id} not found." });

                return NoContent();
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Database update error while deleting healthcare worker with ID {Id}.", id);
                return StatusCode(409, new { message = "Cannot delete healthcare worker due to related data.", detail = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while deleting healthcare worker with ID {Id}.", id);
                return StatusCode(500, new { message = "An error occurred while deleting healthcare worker.", detail = ex.Message });
            }
        }
    }
}
