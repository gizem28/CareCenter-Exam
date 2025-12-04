using System.ComponentModel.DataAnnotations;

namespace CareCenter.Models
{
    public class HealthcareWorker
    {
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty; // FK -> AuthUser
        public AuthUser User { get; set; } = null!;

        [Required(ErrorMessage = "Full name is required")]
        [StringLength(100, ErrorMessage = "Full name cannot exceed 100 characters")]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Phone number is required")]
        [RegularExpression(@"^\d{8}$", ErrorMessage = "Phone number must be 8 digits")]
        public string Phone { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Position is required")]
        public string Position { get; set; } = string.Empty; 

    }
}
