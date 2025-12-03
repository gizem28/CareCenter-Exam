using System.ComponentModel.DataAnnotations;

namespace CareCenter.Models
{
    public class Availability
    {
        public int Id { get; set; }

        [Required]
        public int HealthcareWorkerId { get; set; }
        public HealthcareWorker HealthcareWorker { get; set; } = null!;

        [Required(ErrorMessage = "Date is required")]
        [DataType(DataType.Date)]
        public DateTime Date { get; set; }

        // Time slots (optional - null means all day available)
        public TimeSpan? StartTime { get; set; }
        public TimeSpan? EndTime { get; set; }

        public Appointment? Appointment { get; set; } // null ise "unbooked"
    }
}
