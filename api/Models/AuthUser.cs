using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace CareCenter.Models
{
    public class AuthUser : IdentityUser
    {
        [Required, MaxLength(120)]
        public string FullName { get; set; } = string.Empty;

        
        [Required, MaxLength(40)]
        public string Role { get; set; } = "Client"; 
    }
}
