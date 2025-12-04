namespace CareCenter.DTOs
{
    public class AppointmentUpdateDto
    {
        public int? AvailabilityId { get; set; } 
        public string? Status { get; set; } 
        public string? ServiceType { get; set; }
        public string? VisitNote { get; set; } 
        public List<string>? Tasks { get; set; } 
        public string? SelectedStartTime { get; set; } 
        public string? SelectedEndTime { get; set; } 
    }
}
