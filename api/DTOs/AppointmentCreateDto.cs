namespace CareCenter.DTOs
{
    public class AppointmentCreateDto
    {
        public int AvailabilityId { get; set; }
        public int PatientId { get; set; }
        public DateTime RequestedLocalTime { get; set; }
        
        public string? SelectedStartTime { get; set; }
        public string? SelectedEndTime { get; set; }

        public List<string> Tasks { get; set; } = new();

    }
}
