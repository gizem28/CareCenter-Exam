using CareCenter.DTOs;
using CareCenter.Models;

namespace CareCenter.DAL
{
    public interface IAppointmentRepository
    {
        Task<Appointment> CreateAsync(AppointmentCreateDto dto);
        Task<IEnumerable<Appointment>> GetByPatientAsync(int patientId);

        Task<Appointment?> UpdateAsync(int id, AppointmentUpdateDto dto);
        Task<bool> DeleteAsync(int id, string? role = null);

        Task<IEnumerable<Appointment>> GetByWorkerAsync(int workerId);

        Task<IEnumerable<Appointment>> GetAllAsync();

        Task<Appointment?> ApproveAsync(int id);

        Task<Appointment?> RejectAsync(int id);
    }
}
