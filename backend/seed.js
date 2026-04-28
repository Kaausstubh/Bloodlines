const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const BloodRequest = require('./models/BloodRequest');
const Donation = require('./models/Donation');

const BASE_LAT = 18.5204; // Pune, India
const BASE_LNG = 73.8567;

const randomOffset = () => (Math.random() - 0.5) * 0.05;

// Use plain password — User model pre-save hook will hash it
const PLAIN_PWD = 'password123';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const CITIES = [
  { name: 'Pune', lat: 18.5204, lng: 73.8567 },
  { name: 'VIT Chennai', lat: 12.8406, lng: 80.1534 },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'Delhi', lat: 28.6139, lng: 77.2090 },
  { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
  { name: 'Lucknow', lat: 26.8467, lng: 80.9462 },
  { name: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
  { name: 'Bhopal', lat: 23.2599, lng: 77.4126 },
  { name: 'Indore', lat: 22.7196, lng: 75.8577 },
  { name: 'Patna', lat: 25.5941, lng: 85.1376 },
  { name: 'Kochi', lat: 9.9312, lng: 76.2673 },
  { name: 'Guwahati', lat: 26.1158, lng: 91.7086 },
  { name: 'Nagpur', lat: 21.1458, lng: 79.0882 },
  { name: 'Nashik', lat: 20.0110, lng: 73.7909 }
];

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Clear existing data
  await User.deleteMany({});
  await BloodRequest.deleteMany({});
  await Donation.deleteMany({});
  console.log('🧹 Cleared existing data');

  const pwd = PLAIN_PWD;

  // Create Admin
  const admin = await User.create({
    name: 'Government Admin',
    email: 'admin@smartblood.gov',
    password: pwd,
    role: 'admin',
    phone: '9000000001',
    location: { type: 'Point', coordinates: [BASE_LNG, BASE_LAT], address: 'Government HQ, Pune' }
  });
  console.log('✅ Admin created');

  // Create Hospitals (At least 1-2 per city)
  let hospitalData = [];
  CITIES.forEach((city, index) => {
    hospitalData.push({
      name: `Dr. ${city.name} Head`,
      email: `hospital${index+1}@smartblood.com`,
      password: pwd,
      role: 'hospital',
      hospitalName: `${city.name} City Hospital`,
      licenseNumber: `HOSP-${city.name.substring(0,3).toUpperCase()}-001`,
      phone: `90000${String(100+index).padStart(5, '0')}`,
      isApprovedByAdmin: true,
      location: { type: 'Point', coordinates: [city.lng + randomOffset()/2, city.lat + randomOffset()/2], address: `Main Road, ${city.name}` }
    });
    if (index % 2 === 0) { // Add a second hospital for some cities
      hospitalData.push({
        name: `Dr. Second ${city.name}`,
        email: `hospital_${index+1}_b@smartblood.com`,
        password: pwd,
        role: 'hospital',
        hospitalName: `${city.name} Care General`,
        licenseNumber: `HOSP-${city.name.substring(0,3).toUpperCase()}-002`,
        phone: `90000${String(200+index).padStart(5, '0')}`,
        isApprovedByAdmin: true,
        location: { type: 'Point', coordinates: [city.lng + randomOffset()/2, city.lat + randomOffset()/2], address: `West Wing, ${city.name}` }
      });
    }
  });

  const hospitals = await User.create(hospitalData);
  console.log('✅ Hospitals created');

  // Create Donors (~15 per city)
  let donorData = [];
  let donorCount = 1;
  const firstNames = ['Rahul', 'Sneha', 'Amit', 'Priya', 'Vikram', 'Anita', 'Suresh', 'Kavita', 'Deepak', 'Meena', 'Rajesh', 'Sunita', 'Ganesh', 'Nitin', 'Rohan', 'Swati', 'Vijay', 'Neelam', 'Ajay', 'Pooja'];
  const lastNames = ['Patil', 'Joshi', 'Kumar', 'Singh', 'Naik', 'Sharma', 'Wagh', 'More', 'Chavan', 'Pawar', 'Kulkarni', 'Doke', 'Shinde', 'Jagtap', 'Deshmukh', 'Rao', 'Reddy', 'Das', 'Iyer', 'Gupta'];

  CITIES.forEach(city => {
    for (let i = 0; i < 15; i++) {
        const bg = BLOOD_GROUPS[Math.floor(Math.random() * BLOOD_GROUPS.length)];
        const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
        const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
        donorData.push({
            name: `${fn} ${ln}`,
            email: `donor${donorCount}@smartblood.com`,
            password: pwd,
            role: 'donor',
            bloodGroup: bg,
            phone: `91000${String(donorCount).padStart(5, '0')}`,
            age: 20 + Math.floor(Math.random() * 30),
            weight: 50 + Math.floor(Math.random() * 40),
            isVerified: Math.random() > 0.3,
            isActive: true,
            donationCount: Math.floor(Math.random() * 10),
            rating: parseFloat((3 + Math.random() * 2).toFixed(1)),
            ratingCount: Math.floor(Math.random() * 20),
            healthStatus: 'healthy',
            availableForDonation: true,
            location: {
                type: 'Point',
                coordinates: [city.lng + randomOffset(), city.lat + randomOffset()],
                address: `Sector ${Math.floor(Math.random() * 20 + 1)}, ${city.name}`
            }
        });
        donorCount++;
    }
  });

  const donors = await User.create(donorData);
  console.log('✅ Donors created');

  // Create Patients (3-5 per city)
  let patientData = [];
  let patientCount = 1;
  CITIES.forEach(city => {
      const pCount = 3 + Math.floor(Math.random() * 3);
      for(let i=0; i<pCount; i++) {
          const bg = BLOOD_GROUPS[Math.floor(Math.random() * BLOOD_GROUPS.length)];
          const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
          const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
          patientData.push({
              name: `${fn} ${ln}`,
              email: `patient${patientCount}@smartblood.com`,
              password: pwd,
              role: 'patient',
              bloodGroup: bg,
              phone: `92000${String(patientCount).padStart(5, '0')}`,
              age: 10 + Math.floor(Math.random() * 60),
              location: { 
                  type: 'Point', 
                  coordinates: [city.lng + randomOffset(), city.lat + randomOffset()], 
                  address: `District ${Math.floor(Math.random() * 10 + 1)}, ${city.name}` 
              }
          });
          patientCount++;
      }
  });

  const patients = await User.create(patientData);
  console.log('✅ Patients created');

  // Create Blood Requests
  let requestData = [];
  patients.forEach((patient, idx) => {
      // 60% chance logic: 60% of patients have an open or active request
      if (Math.random() > 0.4) {
          const isEmergency = Math.random() > 0.7;
          requestData.push({
              requestedBy: patient._id,
              patientName: patient.name,
              bloodGroup: patient.bloodGroup,
              unitsNeeded: 1 + Math.floor(Math.random() * 3),
              urgency: isEmergency ? 'emergency' : (Math.random()>0.5 ? 'urgent' : 'normal'),
              location: patient.location,
              status: 'open',
              contactPhone: patient.phone,
              expiresAt: new Date(Date.now() + (isEmergency ? 12 : 48) * 60 * 60 * 1000)
          });
      }
  });

  await BloodRequest.create(requestData);
  console.log('✅ Blood requests created');

  console.log('\n🎉 Database seeded successfully with ALL India Data!\n');
  console.log('📋 Login Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔑 Admin:    admin@smartblood.gov    / password123');
  console.log('🏥 Hospital: hospital1@smartblood.com / password123');
  console.log('🩸 Donor:    donor1@smartblood.com   / password123');
  console.log('👤 Patient:  patient1@smartblood.com / password123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  process.exit(0);
};

seed().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
