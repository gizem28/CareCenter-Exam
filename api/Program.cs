using Microsoft.EntityFrameworkCore;
using CareCenter.DAL;
using CareCenter.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using System.Text.Json.Serialization;


var builder = WebApplication.CreateBuilder(args);

// ---------------- DATABASE ----------------
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlite("Data Source=carecenter.db");
});

// ---------------- IDENTITY ----------------
builder.Services.AddIdentity<AuthUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequiredLength = 6;
    options.Password.RequiredUniqueChars = 1;
    options.User.RequireUniqueEmail = true;
    options.SignIn.RequireConfirmedEmail = false; 
})
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

// ---------------- JWT AUTH ----------------
var jwt = builder.Configuration.GetSection("Jwt");
var key = Encoding.UTF8.GetBytes(jwt["Key"] ?? throw new Exception("Jwt:Key missing"));

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = "JwtBearer";
    options.DefaultChallengeScheme = "JwtBearer";
})
.AddJwtBearer("JwtBearer", options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwt["Issuer"],
        ValidAudience = jwt["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ClockSkew = TimeSpan.Zero
    };
});

// ---------------- CORS ----------------
builder.Services.AddCors(options =>
{
    if (builder.Environment.IsDevelopment())
    {
        options.AddPolicy("AllowFrontend", policy =>
        {
            policy.WithOrigins(
                    "http://localhost:5173",
                    "http://localhost:5174",
                    "http://localhost:3000",
                    "http://localhost:5000",
                    "http://localhost:5066",
                    "http://localhost:7022"
                  )
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
    }
    else
    {
        
        options.AddPolicy("AllowFrontend", policy =>
        {
            policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
    }
});

// ---------------- CONTROLLERS + SWAGGER ----------------

builder.Services.AddControllers()
    .AddJsonOptions(x =>
        x.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddScoped<IPatientRepository, PatientRepository>();
builder.Services.AddScoped<IHealthcareWorkerRepository, HealthcareWorkerRepository>();
builder.Services.AddScoped<IAvailabilityRepository, AvailabilityRepository>();
builder.Services.AddScoped<IAppointmentRepository, AppointmentRepository>();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "CareCenter API",
        Version = "v1",
        Description = "Homecare Appointment Management Tool"
    });
});

var app = builder.Build();

// ---------------- DATABASE INITIALIZATION (Development) ----------------
if (app.Environment.IsDevelopment())
{
    using (var scope = app.Services.CreateScope())
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AuthUser>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

        try
        {
            // Create database and tables if they don't exist
           
            await dbContext.Database.EnsureCreatedAsync();
            logger.LogInformation("Database tables created successfully from DbContext models");

            // Seed test users and sample data
            await SeedTestUsersAsync(userManager, roleManager, dbContext);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error initializing database");
            throw;
        }
    }
}

async Task SeedTestUsersAsync(UserManager<AuthUser> userManager, RoleManager<IdentityRole> roleManager, AppDbContext dbContext)
{
    // Create roles if they don't exist
    var roles = new[] { "Admin", "Worker", "Patient" };
    foreach (var role in roles)
    {
        if (!await roleManager.RoleExistsAsync(role))
        {
            await roleManager.CreateAsync(new IdentityRole(role));
        }
    }
    
    // Create test patient user
    var patientEmail = "patient@carecenter.com";
    var patientUser = await userManager.FindByEmailAsync(patientEmail);
    if (patientUser == null)
    {
        var patient = new AuthUser
        {
            UserName = patientEmail,
            Email = patientEmail,
            FullName = "Test Patient",
            Role = "Patient",
            EmailConfirmed = true
        };
        var result = await userManager.CreateAsync(patient, "Patient123!");
        if (result.Succeeded)
        {
            await userManager.AddToRoleAsync(patient, "Patient");
            patientUser = patient; 
        }
    }
    
    // Create test admin user
    var adminEmail = "admin@carecenter.com";
    if (await userManager.FindByEmailAsync(adminEmail) == null)
    {
        var admin = new AuthUser
        {
            UserName = adminEmail,
            Email = adminEmail,
            FullName = "Test Admin",
            Role = "Admin",
            EmailConfirmed = true
        };
        var result = await userManager.CreateAsync(admin, "Admin123!");
        if (result.Succeeded)
        {
            await userManager.AddToRoleAsync(admin, "Admin");
        }
    }
    
    // Create test worker user
    var workerEmail = "worker@carecenter.com";
    var workerUser = await userManager.FindByEmailAsync(workerEmail);
    if (workerUser == null)
    {
        var worker = new AuthUser
        {
            UserName = workerEmail,
            Email = workerEmail,
            FullName = "Test Worker",
            Role = "Worker",
            EmailConfirmed = true
        };
        var result = await userManager.CreateAsync(worker, "Worker123!");
        if (result.Succeeded)
        {
            await userManager.AddToRoleAsync(worker, "Worker");
            workerUser = worker; 
        }
    }
    

    HealthcareWorker? testWorker = null;
    if (workerUser != null && !await dbContext.HealthcareWorkers.AnyAsync(w => w.Email == workerEmail))
    {
        testWorker = new HealthcareWorker
        {
            UserId = workerUser.Id, 
            FullName = "Test Worker",
            Email = workerEmail,
            Phone = "+47 123 45 678",
            Position = "Sykepleier"
        };
        dbContext.HealthcareWorkers.Add(testWorker);
        await dbContext.SaveChangesAsync();
    }
    else
    {
        testWorker = await dbContext.HealthcareWorkers.FirstOrDefaultAsync(w => w.Email == workerEmail);
    }
    
    // Ensure Patient record exists for the test patient user
    Patient? testPatient = null;
    if (patientUser != null)
    {
        testPatient = await dbContext.Patients.FirstOrDefaultAsync(p => p.Email == patientEmail);
        if (testPatient == null)
        {
            testPatient = new Patient
            {
                UserId = patientUser.Id, 
                FullName = "Test Patient",
                Email = patientEmail,
                Phone = "12345678",
                Address = "Test Address 123",
                BirthDate = new DateTime(1980, 1, 1)
            };
            dbContext.Patients.Add(testPatient);
            await dbContext.SaveChangesAsync();
        }
    }
    
    // Seed dummy availabilities and appointments if worker exists
    if (testWorker != null && !await dbContext.Availabilities.AnyAsync(a => a.HealthcareWorkerId == testWorker.Id))
    {
        var today = DateTime.Today;
        var availabilities = new List<Availability>();
        
        for (int i = 0; i < 14; i++)
        {
            var date = today.AddDays(i);
            if (date.DayOfWeek == DayOfWeek.Saturday || date.DayOfWeek == DayOfWeek.Sunday)
                continue;
                
            availabilities.Add(new Availability
            {
                HealthcareWorkerId = testWorker.Id,
                Date = date,
                StartTime = new TimeSpan(9, 0, 0), 
                EndTime = new TimeSpan(17, 0, 0)  
            });
        }
        
    
        availabilities.Add(new Availability
        {
            HealthcareWorkerId = testWorker.Id,
            Date = today.AddDays(15),
            StartTime = null,
            EndTime = null
        });
        
        dbContext.Availabilities.AddRange(availabilities);
        await dbContext.SaveChangesAsync();
        
        // Create a dummy appointment for one of the availabilities (only if no appointments exist and patient exists)
        if (testPatient != null && !await dbContext.Appointments.AnyAsync())
        {
            var bookedAvailability = availabilities.First();
            
            var appointment = new Appointment
            {
                AvailabilityId = bookedAvailability.Id,
                PatientId = testPatient.Id,
                Status = "Pending",
                ServiceType = "Medical Care", // Use one of the valid service types
                CreatedAt = DateTime.UtcNow,
                RequestedLocalTime = bookedAvailability.Date, // Set requested time to the availability date
                SelectedStartTime = new TimeSpan(9, 0, 0),
            };
            
            dbContext.Appointments.Add(appointment);
            await dbContext.SaveChangesAsync();
        }
    }
}

// ---------------- MIDDLEWARE ----------------
app.UseCors("AllowFrontend");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "CareCenter API V1");
    });
}
else
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
