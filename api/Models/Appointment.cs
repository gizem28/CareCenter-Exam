using System.ComponentModel.DataAnnotations;

namespace CareCenter.Models
{
    public class Appointment
    {
        public int Id { get; set; }

        [Required]
        public int AvailabilityId { get; set; }  // FK -> Availability
        public Availability Availability { get; set; } = null!;

        [Required]
        public int PatientId { get; set; }       // FK -> Patient
        public Patient Patient { get; set; } = null!;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public string Status { get; set; } = "Pending";

        [Required]
        public string ServiceType { get; set; } = string.Empty;

        public DateTime RequestedLocalTime { get; set; }
        
        // Selected time range by the patient
        public TimeSpan? SelectedStartTime { get; set; }
        public TimeSpan? SelectedEndTime { get; set; }
    }
}
