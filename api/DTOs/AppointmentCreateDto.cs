namespace CareCenter.DTOs
{
    public class AppointmentCreateDto
    {
        public int AvailabilityId { get; set; }
        public int PatientId { get; set; }
        public DateTime RequestedLocalTime { get; set; }
        
        // Selected time range by the patient (optional - if not provided, uses availability times)
        // Accept as string and convert to TimeSpan in controller
        public string? SelectedStartTime { get; set; }
        public string? SelectedEndTime { get; set; }

        public List<string> Tasks { get; set; } = new();

    }
}
