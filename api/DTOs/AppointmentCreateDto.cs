using System.ComponentModel.DataAnnotations;

namespace CareCenter.DTOs
{
    public class AppointmentCreateDto
    {
        [Required]
        public int AvailabilityId { get; set; }
        
        [Required]
        public int PatientId { get; set; }
        
        [Required]
        public DateTime RequestedLocalTime { get; set; }
        
        [Required]
        public string ServiceType { get; set; } = string.Empty;
        
        // Selected start time by the patient (optional - if not provided, uses availability start time)
        public string? SelectedStartTime { get; set; }
    }
}
