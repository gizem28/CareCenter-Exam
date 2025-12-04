namespace CareCenter.DTOs
{
    public class AppointmentUpdateDto
    {
        public int? AvailabilityId { get; set; }
        public string? Status { get; set; }
        public string? ServiceType { get; set; }
        public string? SelectedStartTime { get; set; }
        public string? SelectedEndTime { get; set; }
    }
}
