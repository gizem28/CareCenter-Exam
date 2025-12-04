using CareCenter.Models;
using CareCenter.DTOs;
using CareCenter.DAL;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace CareCenter.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<AuthUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IConfiguration _config;
        private readonly ILogger<AuthController> _logger;
        private readonly IPatientRepository _patientRepository;

        public AuthController(
            UserManager<AuthUser> userManager,
            RoleManager<IdentityRole> roleManager,
            IConfiguration config,
            ILogger<AuthController> logger,
            IPatientRepository patientRepository)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _config = config;
            _logger = logger;
            _patientRepository = patientRepository;
        }

        // ---------- REGISTER ----------
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            try
            {
        
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

           
                if (!await _roleManager.RoleExistsAsync(dto.Role))
                {
                    _logger.LogInformation("Role {Role} does not exist. Creating role.", dto.Role);
                    await _roleManager.CreateAsync(new IdentityRole(dto.Role));
                }

             
                var existingUser = await _userManager.FindByEmailAsync(dto.Email);
                if (existingUser != null)
                {
                    _logger.LogWarning("Registration attempt with already registered email: {Email}", dto.Email);
                    return Conflict(new { message = "Email is already registered" });
                }
                
          
                var user = new AuthUser
                {
                    UserName = dto.Email,
                    Email = dto.Email,
                    FullName = dto.FullName,
                    Role = dto.Role,
                    EmailConfirmed = true
                };

                var result = await _userManager.CreateAsync(user, dto.Password);
                if (!result.Succeeded)

                    return BadRequest(new { message = "Registration failed", errors = result.Errors });

                await _userManager.AddToRoleAsync(user, dto.Role);
                return Ok(new { message = "User registered successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during registration");
                return StatusCode(500, new { message = "An error occurred while registering user", error = ex.Message });
            }
        }

        // ---------- PATIENT REGISTER ----------
        [HttpPost("register-patient")]
        public async Task<IActionResult> RegisterPatient([FromBody] PatientRegisterDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

        
                var existingUser = await _userManager.FindByEmailAsync(dto.Email);
                if (existingUser != null)
                {
                    _logger.LogWarning("Patient registration attempt with already registered email: {Email}", dto.Email);
                    return Conflict(new { message = "Email is already registered" });
                }
                    

          
                if (!await _roleManager.RoleExistsAsync("Patient"))
                    await _roleManager.CreateAsync(new IdentityRole("Patient"));

   
                var user = new AuthUser
                {
                    UserName = dto.Email,
                    Email = dto.Email,
                    FullName = dto.FullName,
                    Role = "Patient",
                    EmailConfirmed = true
                };

                var createResult = await _userManager.CreateAsync(user, dto.Password);
                if (!createResult.Succeeded)
                {
                    _logger.LogWarning("Patient registration failed for email: {Email}", dto.Email);
                    return BadRequest(new { message = "Registration failed", errors = createResult.Errors });
                }
                    

                await _userManager.AddToRoleAsync(user, "Patient");

         
                var existingPatient = await _patientRepository.GetByEmailAsync(dto.Email);
                if (existingPatient != null)
                {
                    _logger.LogInformation("Patient account already exists for email: {Email}", dto.Email);
                    return Ok(new { message = "Patient account already exists. Please login instead." });
                }

   
                if (!DateTime.TryParse(dto.BirthDate, out var birthDate))
                {
            
                    await _userManager.DeleteAsync(user);
                    _logger.LogWarning("Invalid birth date format provided for patient registration: {BirthDate}", dto.BirthDate);
                    return BadRequest(new { message = "Invalid birth date format" });
                }

       
                var patientDto = new PatientDTO
                {
                    UserId = user.Id,
                    FullName = dto.FullName,
                    Email = dto.Email,
                    Address = dto.Address,
                    Phone = dto.Phone,
                    BirthDate = birthDate
                };

                await _patientRepository.AddAsync(patientDto);

                return Ok(new { message = "Patient registered successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during patient registration");
                
       
                var user = await _userManager.FindByEmailAsync(dto.Email);
                if (user != null)
                {
                    await _userManager.DeleteAsync(user);
                }
                _logger.LogError(ex, "Error occurred during patient registration for email: {Email}", dto.Email);
                return StatusCode(500, new { message = "An error occurred while registering patient", error = ex.Message });
            }
        }

        // ---------- FORGOT PASSWORD ----------
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var user = await _userManager.FindByEmailAsync(dto.Email);
                if (user == null)
                {
                 
                    return Ok(new { message = "If the email exists, a password reset link has been sent." });
                }

                // Generate password reset token
                var token = await _userManager.GeneratePasswordResetTokenAsync(user);

        
                return Ok(new
                {
                    message = "If the email exists, a password reset link has been sent."
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during forgot password");
                return StatusCode(500, new { message = "An error occurred while processing your request", error = ex.Message });
            }
        }

        // ---------- RESET PASSWORD ----------
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var user = await _userManager.FindByEmailAsync(dto.Email);
                if (user == null)
                    return BadRequest(new { message = "Invalid email or token" });

                var result = await _userManager.ResetPasswordAsync(user, dto.Token, dto.NewPassword);
                if (!result.Succeeded)
                    return BadRequest(new { message = "Password reset failed", errors = result.Errors });

                return Ok(new { message = "Password has been reset successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during password reset");
                return StatusCode(500, new { message = "An error occurred while resetting password", error = ex.Message });
            }
        }

        // ---------- LOGIN ----------
        // Authenticate user and return JWT token
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var user = await _userManager.FindByEmailAsync(dto.Email);
                if (user == null)
                {
                    _logger.LogWarning("Login attempt with non-existent email: {Email}", dto.Email);
                    return Unauthorized(new { message = "Invalid email or password" });
                }

                _logger.LogInformation("User found: {Email}, Role: {Role}, EmailConfirmed: {EmailConfirmed}",
                    user.Email, user.Role, user.EmailConfirmed);

                var passwordValid = await _userManager.CheckPasswordAsync(user, dto.Password);
                if (!passwordValid)
                {
                    _logger.LogWarning("Invalid password attempt for user: {Email}. Password hash exists: {HasPasswordHash}",
                        dto.Email, !string.IsNullOrEmpty(user.PasswordHash));
                    return Unauthorized(new { message = "Invalid email or password" });
                }

                _logger.LogInformation("Password validated successfully for user: {Email}", dto.Email);

                var token = GenerateJwtToken(user);
                return Ok(new
                {
                    token,
                    role = user.Role,
                    email = user.Email,
                    fullName = user.FullName
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during login");
                return StatusCode(500, new { message = "An error occurred while logging in", error = ex.Message });
            }
        }

        // ---------- TOKEN GENERATION ----------
        private string GenerateJwtToken(AuthUser user)
        {
            var jwtSettings = _config.GetSection("Jwt");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Email!),
                new Claim("uid", user.Id),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim("fullName", user.FullName ?? string.Empty)
            };

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(Convert.ToDouble(jwtSettings["ExpireMinutes"] ?? "60")),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
