using System.ComponentModel.DataAnnotations;

namespace CareCenter.DTOs
{
    public class AvailabilityDTO
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "HealthcareWorkerId is required")]
        public int HealthcareWorkerId { get; set; }

        [Required(ErrorMessage = "Date is required")]
        [DataType(DataType.Date)]
        public DateTime? Date { get; set; }

        public TimeSpan? StartTime { get; set; }
        public TimeSpan? EndTime { get; set; }

        // Status
        public bool IsBooked { get; set; }

        public string? HealthcareWorkerName { get; set; }
        public string? HealthcareWorkerPosition { get; set; }
    }
}
