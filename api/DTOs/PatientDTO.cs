using System;
using System.ComponentModel.DataAnnotations;

namespace CareCenter.DTOs
{
  
    public class PatientDTO
    {
        public int Id { get; set; }

        public string? UserId { get; set; } 

        [Required(ErrorMessage = "Full name is required")]
        [StringLength(100, ErrorMessage = "Full name cannot exceed 100 characters")]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Address is required")]
        [StringLength(200, ErrorMessage = "Address cannot exceed 200 characters")]
        public string Address { get; set; } = string.Empty;

        [Required(ErrorMessage = "Phone number is required")]
        [RegularExpression(@"^\d{8}$", ErrorMessage = "Phone number must be 8 digits")]
        public string Phone { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Birth date is required")]
        [DataType(DataType.Date)]
        [CustomValidation(typeof(PatientDTO), nameof(ValidateBirthDate))]
        public DateTime BirthDate { get; set; }

        public static ValidationResult? ValidateBirthDate(DateTime birthDate, ValidationContext context)
        {
            if (birthDate > DateTime.Now)
            {
                return new ValidationResult("Birth date cannot be in the future.");
            }

            if (birthDate < new DateTime(1900, 1, 1))
            {
                return new ValidationResult("Birth date is not realistic.");
            }

            return ValidationResult.Success;
        }
    }
}
