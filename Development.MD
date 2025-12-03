1. Diyelim ki 1 Worker Pazartesi musaitim dedi. 2 hasta Pazartesi randevul alacak. 1 i alinca digerinin alamamasi lazim. Bundan dolayi, database de randevu alindigi an musaitlik durumunun guncellenmesi gerekiyor.

2. Diyelim ki 2 Worker Pazartesi musaitim dedi. 2 Hasta Pazartesine randevu almak istedi. Sadece o saatlerin musait oldugunu mu gorecekler? Hangi Workerlarin musait oldugunu da gorecekler mi? Egere goremeyeceklerse rastgele 1 worker mi atayacagiz? Kullanicilarin tanidigi calisani cagirmasi daha makul gibi. O yuzden en azindan liste olarak kimlerin musait oldugunu gorse guzel olur.
   -----listeyi gormesin.

3. Bir patient nasil sign up yapacak. Suan admin sayfasinda add patient diye bir kisim var. Ama burada password ve username belirlenmiyor. O zaman bu kullanici aslinda tam bir kullanici degil. Ideal olani kullanicinin "sign up" diye bir dugmeye tiklayip, sisteme kayd olmasi. O ekranda kullanici kendi sifresini ve kullanici adini belirler. Alternatif olarak admin patient ekler, patient a email gider. Patient emailde linke tiklayip pasword vs belirler. Fakat buda guvenlik acisindan cok makul degil. Bu tip linkler gecici sureli olusturulmali vs. En kolayi "Sign Up" sayfasini admin ekranindan cikarma....

Benzer problem worker olusrturma ile alakali da var. Sifre problemini nasil cozecegiz?

4. Admin systemden healthcare worker ve patient silebilmeli mi? Bununla alakali backend API leri eklenmis. Ekleyebiliriz.
   -----silebilir.

5. Admindashboard icin su api lara ihtiyac var.
   GET /api/service-requests (tum service requestlerini getir)
   GET /api/service-requests/{id} (Bir servis requestinin detaylarini getir)
   GET /api/appointments (tum appointmentlari getir)
   GET /api/appointments/{id} (Bir appointmentin detaylarini getir)
   GET /api/stats (Kac kullanici var, calisan var, servis requesti var vs istatistikler olabilir. Admin dashboard da kullanmak icin. Her defasinda tum kullanicilari cekip bu sayilari hesaplamak mantikli degil.)

6. Aslinda bu apilerin tum hastalari, tum servis requestlerini donmesi makul degil. Normalde ilk 50 yi don vs gibi filtreleme olmali. Yoksa 1000 hasta varsa tum hepsini her zaman cekmek makul degil. Belki son 10 servis requestini getir gibi bir endpoint de yazilabilir. Yahut bir parametreyle kac tane istedigimiz belirtilebilir.
   ------sistemimiz su an az ksiiden olustugu icin bunu dusunmeye gerek yok gibi.v

API endpointleri:
http://localhost:5000/swagger/index.html

Authentication (/api/auth)
POST /api/auth/register - Register a new user
POST /api/auth/login - Login and get JWT token

Patients (/api/patients)
GET /api/patients - Get all patients
GET /api/patients/{id} - Get patient by ID
POST /api/patients - Create a new patient
PUT /api/patients/{id} - Update a patient
DELETE /api/patients/{id} - Delete a patient

Healthcare Workers (/api/healthcareworkers)
GET /api/healthcareworkers - Get all healthcare workers
GET /api/healthcareworkers/{id} - Get healthcare worker by ID
POST /api/healthcareworkers - Create a new healthcare worker
PUT /api/healthcareworkers/{id} - Update a healthcare worker
DELETE /api/healthcareworkers/{id} - Delete a healthcare worker

Availabilities (/api/availabilities)
GET /api/availabilities - Get all availabilities
POST /api/availabilities - Create availability records
Not yet implemented

Belki su ucretsiz componentleri kullanabiliriz. Reactin en buyuk avantaji ucretsiz bir dunya componenti olmasi. Kullanmazsak avantaji kaybetmis oluruz.
https://github.com/jquense/react-big-calendar?tab=readme-ov-file
yahut
https://github.com/wix/react-native-calendars?tab=readme-ov-file
yahut
https://github.com/namespace-ee/react-calendar-timeline/tree/master/examples
