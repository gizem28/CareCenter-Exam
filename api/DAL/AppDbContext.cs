using CareCenter.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;

namespace CareCenter.DAL
{
    // Entity Framework database context for the application
    public class AppDbContext : IdentityDbContext<AuthUser, IdentityRole, string>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<HealthcareWorker> HealthcareWorkers { get; set; }
        public DbSet<Availability> Availabilities { get; set; }
        public DbSet<Appointment> Appointments { get; set; }
        public DbSet<AppointmentTask> AppointmentTasks { get; set; }
        public DbSet<Patient> Patients { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Availability (1) — (0..1) Appointment
            // Using ClientSetNull: Appointment can be deleted, but Availability remains
            // The navigation property is cleared on the client side, but no action in database
            modelBuilder.Entity<Availability>()
                .HasOne(a => a.Appointment)
                .WithOne(ap => ap.Availability)
                .HasForeignKey<Appointment>(ap => ap.AvailabilityId)
                .OnDelete(DeleteBehavior.Restrict);

      
            modelBuilder.Entity<Appointment>()
                .HasIndex(ap => ap.AvailabilityId)
                .IsUnique();

            // Patient -> AuthUser relationship
            modelBuilder.Entity<Patient>()
                .HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade); 

            // HealthcareWorker -> AuthUser relationship
            modelBuilder.Entity<HealthcareWorker>()
                .HasOne(w => w.User)
                .WithMany()
                .HasForeignKey(w => w.UserId)
                .OnDelete(DeleteBehavior.Cascade); 
        }
    }
}
