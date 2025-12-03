using CareCenter.DAL;
using CareCenter.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace CareCenter.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AvailabilitiesController : ControllerBase
    {
        private readonly IAvailabilityRepository _repo;

        public AvailabilitiesController(IAvailabilityRepository repo)
        {
            _repo = repo;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var items = await _repo.GetAllAsync();
                return Ok(items);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving availabilities", detail = ex.Message });
            }
        }
        [HttpPost]
        public async Task<IActionResult> Add([FromBody] List<AvailabilityDTO> dtos)
        {
            if (dtos == null || !dtos.Any())
                return BadRequest(new { message = "No availabilities provided." });

            var createdList = new List<AvailabilityDTO>();
            var errors = new List<object>();

            foreach (var dto in dtos)
            {
                try
                {
                    if (!dto.Date.HasValue)
                    {
                        errors.Add(new { date = dto.Date, error = "Date is required." });
                        continue;
                    }

                    var created = await _repo.AddAsync(dto);
                    createdList.Add(created);
                }
                catch (InvalidOperationException ex)
                {
                    errors.Add(new { date = dto.Date, error = ex.Message });
                }
                catch (Exception ex)
                {
                    errors.Add(new { date = dto.Date, error = $"Error: {ex.Message}" });
                }
            }

            if (createdList.Count == 0)
                return BadRequest(new { message = "No availabilities could be added.", errors });

            return Ok(new
            {
                message = $"{createdList.Count} availability(ies) added successfully.",
                created = createdList,
                errors = errors.Any() ? errors : null
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] AvailabilityDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var updated = await _repo.UpdateAsync(id, dto);
                if (updated == null)
                    return NotFound(new { message = $"Availability with id {id} not found." });

                return Ok(updated);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating availability", detail = ex.Message });
            }
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var deleted = await _repo.DeleteAsync(id);
                if (!deleted)
                    return NotFound(new { message = $"Availability with id {id} not found." });

                return Ok(new { message = $"Availability with id {id} deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting availability", detail = ex.Message });
            }
        }

        [HttpGet("unbooked")]
        public async Task<IActionResult> GetUnbooked()
        {
            try
            {
                var items = await _repo.GetUnbookedAsync();
                return Ok(items);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving unbooked availabilities", detail = ex.Message });
            }
        }

        [HttpGet("worker/{workerId}")]
        public async Task<IActionResult> GetByWorker(int workerId)
        {
            try
            {
                var items = await _repo.GetByWorkerAsync(workerId);
                return Ok(items);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving worker availabilities", detail = ex.Message });
            }
        }
    }
}
