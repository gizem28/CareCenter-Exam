using CareCenter.DTOs;

namespace CareCenter.DAL
{
    public interface IHealthcareWorkerRepository
    {
        Task<IEnumerable<HealthcareWorkerDTO>> GetAllAsync();
        Task<HealthcareWorkerDTO?> GetByIdAsync(int id);
        Task<HealthcareWorkerDTO?> GetByEmailAsync(string email);
        Task<HealthcareWorkerDTO> AddAsync(HealthcareWorkerDTO dto);
        Task<bool> UpdateAsync(HealthcareWorkerDTO dto);
        Task<bool> DeleteAsync(int id);
    }
}
