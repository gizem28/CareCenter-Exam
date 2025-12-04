using System.ComponentModel.DataAnnotations;

namespace CareCenter.Models
{
    public class Appointment
    {
        public int Id { get; set; }

        [Required]
        public int AvailabilityId { get; set; }  
        public Availability Availability { get; set; } = null!;

        [Required]
        public int PatientId { get; set; }      
        public Patient Patient { get; set; } = null!;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public string Status { get; set; } = "Pending";

        [Required]
        public string ServiceType { get; set; } = string.Empty;

        public string? VisitNote { get; set; }

        public DateTime RequestedLocalTime { get; set; }    
        
        // Selected time range by the patient
        public TimeSpan? SelectedStartTime { get; set; }
        public TimeSpan? SelectedEndTime { get; set; }
        
        public ICollection<AppointmentTask> Tasks { get; set; } = new List<AppointmentTask>();
    }

    public class AppointmentTask
    {
        public int Id { get; set; }
        public int AppointmentId { get; set; }
        public Appointment Appointment { get; set; } = null!;

        [Required]
        public string Status { get; set; } = "Pending";
        [Required] public string Description { get; set; } = string.Empty;
        public bool Done { get; set; } 
    }
}
