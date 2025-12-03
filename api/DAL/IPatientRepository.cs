using CareCenter.DTOs;

namespace CareCenter.DAL
{
    public interface IPatientRepository
    {
        Task<IEnumerable<PatientDTO>> GetAllAsync();
        Task<PatientDTO?> GetByIdAsync(int id);
        Task<PatientDTO?> GetByEmailAsync(string email);
        Task<PatientDTO> AddAsync(PatientDTO dto);
        Task<bool> UpdateAsync(PatientDTO dto);
        Task<bool> DeleteAsync(int id);
    }
}
