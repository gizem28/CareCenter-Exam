namespace CareCenter.DTOs
{
    public class AppointmentUpdateDto
    {
        public int? AvailabilityId { get; set; } // yeni worker’a atamak için
        public string? Status { get; set; } // örn: "Confirmed", "Completed", "Cancelled"
        public string? VisitNote { get; set; } // opsiyonel not
        public List<string>? Tasks { get; set; } // güncellenecek görevler
        public string? SelectedStartTime { get; set; } // güncellenecek başlangıç saati
        public string? SelectedEndTime { get; set; } // güncellenecek bitiş saati
    }
}
