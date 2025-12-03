using CareCenter.DTOs;

namespace CareCenter.DAL
{
    public interface IAvailabilityRepository
    {
        Task<IEnumerable<AvailabilityDTO>> GetAllAsync();
        Task<AvailabilityDTO> AddAsync(AvailabilityDTO dto);
        Task<AvailabilityDTO?> UpdateAsync(int id, AvailabilityDTO dto);
        Task<bool> DeleteAsync(int id);
        Task<IEnumerable<AvailabilityDTO>> GetUnbookedAsync();
        Task<IEnumerable<AvailabilityDTO>> GetByWorkerAsync(int workerId);
    }
}
