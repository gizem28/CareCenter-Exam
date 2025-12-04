using CareCenter.DAL;
using CareCenter.DTOs;
using CareCenter.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CareCenter.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AppointmentsController : ControllerBase
    {
        private readonly IAppointmentRepository _repo;
        private readonly AppDbContext _context;

        public AppointmentsController(IAppointmentRepository repo, AppDbContext context)
        {
            _repo = repo;
            _context = context;
        }

        // 1️⃣ Create appointment (Patient)
        // This method handles new appointment bookings from patients
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] AppointmentCreateDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var created = await _repo.CreateAsync(dto);
                return Ok(new { message = "Appointment created successfully", created });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating appointment", detail = ex.Message });
            }
        }

        // 2️⃣ Get appointments for one patient
        [HttpGet("patient/{patientId}")]
        public async Task<IActionResult> GetByPatient(int patientId)
        {
            try
            {
                var appointments = await _repo.GetByPatientAsync(patientId);
                return Ok(appointments);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching appointments", detail = ex.Message });
            }
        }
        // 3️⃣ Update appointment (e.g., change status or reassign worker)
        // Allows changing appointment details, status, or worker assignment
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] AppointmentUpdateDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var updated = await _repo.UpdateAsync(id, dto);
                if (updated == null)
                    return NotFound(new { message = "Appointment not found" });

                return Ok(new { message = "Appointment updated successfully", updated });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating appointment", detail = ex.Message });
            }
        }
        // 4️⃣ Delete appointment
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id, [FromQuery] string? role = null)
        {
            try
            {
                var deleted = await _repo.DeleteAsync(id, role);
                if (!deleted)
                    return NotFound(new { message = "Appointment not found or cannot be deleted" });

                return Ok(new { message = "Appointment deleted successfully" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting appointment", detail = ex.Message });
            }
        }

        // 5️⃣ Get appointments for one worker
        [HttpGet("worker/{workerId}")]
        public async Task<IActionResult> GetByWorker(int workerId)
        {
            try
            {
                var appointments = await _repo.GetByWorkerAsync(workerId);

                if (!appointments.Any())
                    return NotFound(new { message = "No appointments found for this worker." });

                // Helper function to format TimeSpan safely
                string? FormatTimeSpan(TimeSpan? ts)
                {
                    if (ts == null) return null;
                    return ts.Value.ToString(@"hh\:mm\:ss");
                }

                // Daha okunabilir bir JSON döndürmek için sade DTO oluşturabiliriz:
                var result = appointments.Select(a => new
                {
                    a.Id,
                    a.Status,
                    a.ServiceType,
                    Date = a.Availability.Date,
                    WorkerName = a.Availability.HealthcareWorker.FullName,
                    a.PatientId,
                    SelectedStartTime = FormatTimeSpan(a.SelectedStartTime)
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching worker appointments", detail = ex.Message });
            }
        }

        // 6️⃣ Get all appointments (Admin)
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var appointments = await _repo.GetAllAsync();

                if (!appointments.Any())
                    return NotFound(new { message = "No appointments found." });

                // Get patient information
                var patientIds = appointments.Select(a => a.PatientId).Distinct().ToList();
                var patients = await _context.Patients
                    .Where(p => patientIds.Contains(p.Id))
                    .ToDictionaryAsync(p => p.Id, p => p);

                // Helper function to format TimeSpan safely
                string? FormatTimeSpan(TimeSpan? ts)
                {
                    if (ts == null) return null;
                    return ts.Value.ToString(@"hh\:mm\:ss");
                }

                // Include patient information for admin view
                var result = appointments.Select(a => new
                {
                    a.Id,
                    a.Status,
                    a.ServiceType,
                    a.PatientId,
                    PatientName = patients.ContainsKey(a.PatientId) ? patients[a.PatientId].FullName : "Unknown",
                    PatientEmail = patients.ContainsKey(a.PatientId) ? patients[a.PatientId].Email : "",
                    WorkerName = a.Availability?.HealthcareWorker?.FullName ?? "Unknown",
                    WorkerEmail = a.Availability?.HealthcareWorker?.Email ?? "",
                    Date = a.Availability?.Date ?? default(DateTime),
                    SelectedStartTime = FormatTimeSpan(a.SelectedStartTime),
                    a.CreatedAt,
                    AvailabilityId = a.AvailabilityId,
                    Availability = a.Availability != null ? new
                    {
                        a.Availability.Id,
                        a.Availability.Date,
                        StartTime = FormatTimeSpan(a.Availability.StartTime),
                        EndTime = FormatTimeSpan(a.Availability.EndTime)
                    } : null
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching appointments", detail = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        // 7️⃣ Approve appointment (Admin)
        [HttpPost("{id}/approve")]
        public async Task<IActionResult> Approve(int id)
        {
            try
            {
                var updated = await _repo.ApproveAsync(id);
                if (updated == null)
                    return NotFound(new { message = "Appointment not found" });

                return Ok(new { message = "Appointment approved successfully", appointment = updated });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error approving appointment", detail = ex.Message });
            }
        }

        // 8️⃣ Reject appointment (Admin) - releases the slot
        [HttpPost("{id}/reject")]
        public async Task<IActionResult> Reject(int id)
        {
            try
            {
                var updated = await _repo.RejectAsync(id);
                if (updated == null)
                    return NotFound(new { message = "Appointment not found" });

                return Ok(new { message = "Appointment rejected and slot released successfully", appointment = updated });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error rejecting appointment", detail = ex.Message });
            }
        }

    }
}
