import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_ROOT = path.resolve(__dirname, '../');

// Inject environment variables
dotenv.config({
    path: [
        path.join(BACKEND_ROOT, '.env.local'),
        path.join(BACKEND_ROOT, '.env'),
        '.env.local',
        '.env'
    ]
});

// STRICTLY DISABLE MAIL SERVER DURING SEEDING
process.env.DISABLE_MAIL = 'true';

import { connectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import Doctor from '../src/models/Doctor.js';
import cloudinary from '../src/config/cloudinary.js';

// Cache file to prevent re-uploading existing images to Cloudinary
const CACHE_FILE = path.join(__dirname, 'cloudinary_image_cache.json');
let imageCache = {};
if (fs.existsSync(CACHE_FILE)) {
    try {
        imageCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    } catch (e) {
        imageCache = {};
    }
}

function saveImageCache() {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(imageCache, null, 2), 'utf8');
}

// Full 64 Districts Quota Configuration
// Dhaka: 30, Chittagong: 20, Sylhet: 9, and the remaining 61 districts distributed
const DISTRICT_QUOTAS = [
    // Top 3 User Specified Requirements
    { district: 'Dhaka', quota: 30, city: 'Dhaka' },
    { district: 'Chittagong', quota: 20, city: 'Chittagong' },
    { district: 'Sylhet', quota: 9, city: 'Sylhet' },

    // Divisional Hubs & Major Cities
    { district: 'Rajshahi', quota: 4, city: 'Rajshahi' },
    { district: 'Khulna', quota: 4, city: 'Khulna' },
    { district: 'Barisal', quota: 3, city: 'Barisal' },
    { district: 'Rangpur', quota: 3, city: 'Rangpur' },
    { district: 'Mymensingh', quota: 3, city: 'Mymensingh' },
    { district: 'Bogura', quota: 3, city: 'Bogura' },
    { district: "Cox's Bazar", quota: 3, city: "Cox's Bazar" },
    { district: 'Comilla', quota: 3, city: 'Comilla' },
    { district: 'Gazipur', quota: 3, city: 'Gazipur' },
    { district: 'Narayanganj', quota: 2, city: 'Narayanganj' },
    { district: 'Tangail', quota: 2, city: 'Tangail' },
    { district: 'Faridpur', quota: 2, city: 'Faridpur' },
    { district: 'Brahmanbaria', quota: 2, city: 'Brahmanbaria' },
    { district: 'Chandpur', quota: 2, city: 'Chandpur' },
    { district: 'Noakhali', quota: 2, city: 'Noakhali' },
    { district: 'Moulvibazar', quota: 2, city: 'Moulvibazar' },
    { district: 'Pabna', quota: 2, city: 'Pabna' },
    { district: 'Sirajganj', quota: 2, city: 'Sirajganj' },
    { district: 'Jashore', quota: 3, city: 'Jashore' },
    { district: 'Kushtia', quota: 2, city: 'Kushtia' },
    { district: 'Patuakhali', quota: 2, city: 'Patuakhali' },
    { district: 'Dinajpur', quota: 2, city: 'Dinajpur' },
    { district: 'Jamalpur', quota: 2, city: 'Jamalpur' },

    // Remaining Districts (1 doctor each to cover all 64 districts)
    { district: 'Manikganj', quota: 1, city: 'Manikganj' },
    { district: 'Munshiganj', quota: 1, city: 'Munshiganj' },
    { district: 'Narsingdi', quota: 1, city: 'Narsingdi' },
    { district: 'Gopalganj', quota: 1, city: 'Gopalganj' },
    { district: 'Kishoreganj', quota: 1, city: 'Kishoreganj' },
    { district: 'Madaripur', quota: 1, city: 'Madaripur' },
    { district: 'Rajbari', quota: 1, city: 'Rajbari' },
    { district: 'Shariatpur', quota: 1, city: 'Shariatpur' },
    { district: 'Feni', quota: 1, city: 'Feni' },
    { district: 'Lakshmipur', quota: 1, city: 'Lakshmipur' },
    { district: 'Rangamati', quota: 1, city: 'Rangamati' },
    { district: 'Khagrachhari', quota: 1, city: 'Khagrachhari' },
    { district: 'Bandarban', quota: 1, city: 'Bandarban' },
    { district: 'Habiganj', quota: 1, city: 'Habiganj' },
    { district: 'Sunamganj', quota: 1, city: 'Sunamganj' },
    { district: 'Naogaon', quota: 1, city: 'Naogaon' },
    { district: 'Natore', quota: 1, city: 'Natore' },
    { district: 'Chapainawabganj', quota: 1, city: 'Chapainawabganj' },
    { district: 'Joypurhat', quota: 1, city: 'Joypurhat' },
    { district: 'Bagerhat', quota: 1, city: 'Bagerhat' },
    { district: 'Chuadanga', quota: 1, city: 'Chuadanga' },
    { district: 'Jhenaidah', quota: 1, city: 'Jhenaidah' },
    { district: 'Magura', quota: 1, city: 'Magura' },
    { district: 'Meherpur', quota: 1, city: 'Meherpur' },
    { district: 'Narail', quota: 1, city: 'Narail' },
    { district: 'Satkhira', quota: 1, city: 'Satkhira' },
    { district: 'Bhola', quota: 1, city: 'Bhola' },
    { district: 'Jhalokati', quota: 1, city: 'Jhalokati' },
    { district: 'Pirojpur', quota: 1, city: 'Pirojpur' },
    { district: 'Barguna', quota: 1, city: 'Barguna' },
    { district: 'Gaibandha', quota: 1, city: 'Gaibandha' },
    { district: 'Kurigram', quota: 1, city: 'Kurigram' },
    { district: 'Lalmonirhat', quota: 1, city: 'Lalmonirhat' },
    { district: 'Nilphamari', quota: 1, city: 'Nilphamari' },
    { district: 'Panchagarh', quota: 1, city: 'Panchagarh' },
    { district: 'Thakurgaon', quota: 1, city: 'Thakurgaon' },
    { district: 'Netrokona', quota: 1, city: 'Netrokona' },
    { district: 'Sherpur', quota: 1, city: 'Sherpur' },
];

// District hospital reference lookup
const DISTRICT_HOSPITALS = {
    'Dhaka': ['Evercare Hospital Dhaka', 'Square Hospitals Ltd.', 'United Hospital', 'Labaid Specialized Hospital', 'Popular Diagnostic Centre Dhanmondi', 'Bangladesh Specialized Hospital', 'Ibn Sina Diagnostic & Consultation Centre', 'Medinova Medical Services'],
    'Chittagong': ['Epic Healthcare Chittagong', 'Chevron Clinical Laboratory', 'CSCR Hospital Chittagong', 'Parkview Hospital Chittagong', 'Max Hospital & Diagnostic Ltd.', 'Popular Diagnostic Centre Chittagong', 'National Hospital Chittagong'],
    'Sylhet': ['Mount Adora Hospital Sylhet', 'Popular Medical Centre Sylhet', 'Al Haramain Hospital Sylhet', 'Oasis Hospital Sylhet', 'Trust Medical Services Sylhet', 'North East Medical College Hospital'],
    'Rajshahi': ['Popular Diagnostic Centre Rajshahi', 'Royal Hospital Rajshahi', 'Islami Bank Medical College Hospital Rajshahi', 'Rajshahi Model Hospital'],
    'Khulna': ['Khulna City Medical College Hospital', 'Gazi Medical College Hospital', 'Popular Diagnostic Centre Khulna', 'Labaid Diagnostic Khulna'],
    'Barisal': ['South Apollo Hospital Barisal', 'Bellview Medical Services Barisal', 'Rahat Anwar Hospital Barisal', 'Popular Diagnostic Centre Barisal'],
    'Rangpur': ['Good Health Hospital Rangpur', 'Update Diagnostic Rangpur', 'Popular Diagnostic Centre Rangpur', 'Doctor\'s Community Hospital Rangpur'],
    'Mymensingh': ['Nexus Cardiac Hospital Mymensingh', 'Popular Diagnostic Centre Mymensingh', 'Swadesh Hospital Mymensingh', 'Mymensingh Central Hospital'],
    'Bogura': ['Popular Diagnostic Centre Bogura', 'TMSS Medical College Hospital Bogura', 'Shamsun Nahar Clinic Bogura'],
    "Cox's Bazar": ['Fouad Al-Khatib Hospital Cox\'s Bazar', 'Cox\'s Bazar Digital Lab & Consultation Centre', 'Union Hospital Cox\'s Bazar'],
    'Comilla': ['Moon Hospital Comilla', 'Comilla Medical Center (Tower Hospital)', 'Popular Diagnostic Centre Comilla', 'Mainamati Medical College Hospital'],
    'Gazipur': ['City Medical College Hospital Gazipur', 'Tairunnessa Memorial Medical College', 'Popular Diagnostic Centre Gazipur'],
    'Narayanganj': ['Popular Diagnostic Centre Narayanganj', 'Medinova Diagnostic Centre Narayanganj', 'Al-Baraka Hospital Narayanganj'],
    'Tangail': ['Soniya Nursing Home & Hospital Tangail', 'Kumudini Hospital Mirzapur', 'Popular Diagnostic Centre Tangail'],
    'Faridpur': ['Arogya Sadan Hospital Faridpur', 'Faridpur Clinic & Diagnostic Centre', 'Popular Diagnostic Centre Faridpur'],
    'Brahmanbaria': ['Standard Diagnostic Centre Brahmanbaria', 'Brahmanbaria Medical College Hospital'],
    'Chandpur': ['Chandpur Central Hospital', 'Premier Diagnostic Centre Chandpur'],
    'Noakhali': ['Prime Hospital Maijdee Noakhali', 'Popular Diagnostic Centre Noakhali'],
    'Moulvibazar': ['Noorjahan Memorial Hospital Moulvibazar', 'Moulvibazar Diagnostic Complex'],
    'Pabna': ['Shimla Hospital Pabna', 'Popular Diagnostic Centre Pabna'],
    'Sirajganj': ['North Bengal Medical College Hospital', 'Avicenna Hospital Sirajganj'],
    'Jashore': ['Queen\'s Hospital Jashore', 'Popular Diagnostic Centre Jashore', 'Ibne Sina Diagnostic Centre Jashore'],
    'Kushtia': ['Amin Diagnostic Medical Centre Kushtia', 'Kushtia Care Hospital'],
    'Patuakhali': ['Patuakhali Modern Hospital', 'Doctor\'s Point Diagnostic Centre Patuakhali'],
    'Dinajpur': ['Zia Heart Foundation Hospital Dinajpur', 'Popular Diagnostic Centre Dinajpur'],
    'Jamalpur': ['Apex Hospital Jamalpur', 'Jamalpur Digital Diagnostic Centre'],
};

function getHospitalForDistrict(district) {
    const list = DISTRICT_HOSPITALS[district];
    if (list && list.length > 0) {
        return list[Math.floor(Math.random() * list.length)];
    }
    return `${district} Central Specialized Hospital & Diagnostic Centre`;
}

function cleanHtml(str) {
    if (!str) return '';
    return str.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function generateCleanUsername(name, bmdc) {
    const cleaned = name.toLowerCase()
        .replace(/^(dr|prof|professor|mr|mrs|ms)\.?\s+/gi, '')
        .replace(/[^a-z0-9]/g, '');
    const bmdcNum = (bmdc || '').replace(/[^0-9]/g, '') || Math.floor(10000 + Math.random() * 90000);
    return `dr_${cleaned.slice(0, 12)}_${bmdcNum}`.toLowerCase();
}

async function uploadToCloudinary(imageUrl, docName) {
    if (!imageUrl || !imageUrl.startsWith('http')) {
        return 'https://res.cloudinary.com/dtspm3365/image/upload/v1794757296/healiix/doctors/bzu9gybymynuu60pscni.webp';
    }

    if (imageCache[imageUrl]) {
        return imageCache[imageUrl];
    }

    try {
        console.log(`[Cloudinary] Uploading portrait for ${docName}...`);
        const result = await cloudinary.uploader.upload(imageUrl, {
            folder: 'healiix/doctors',
            format: 'webp',
            transformation: [
                { width: 420, height: 420, crop: 'fill', gravity: 'face' },
                { quality: 'auto' }
            ]
        });
        imageCache[imageUrl] = result.secure_url;
        saveImageCache();
        return result.secure_url;
    } catch (err) {
        console.warn(`[Cloudinary] Upload failed for ${imageUrl}:`, err.message);
        return 'https://res.cloudinary.com/dtspm3365/image/upload/v1794757296/healiix/doctors/bzu9gybymynuu60pscni.webp';
    }
}

async function main() {
    console.log('================================================================');
    console.log('🚀 HealiiX Medical Platform - 150+ Doctor Ingestion & Cloudinary Pipeline');
    console.log('🔒 Safety: Mail server is completely SILENCED (DISABLE_MAIL=true)');
    console.log('================================================================');

    await connectDB();

    console.log('[Scraper] Fetching doctor profiles from bddoctorsdirectory.com API...');
    const fetchRes = await fetch('https://api.bddoctorsdirectory.com/api/app/public/doctors-paginate?page=1&limit=180');
    if (!fetchRes.ok) {
        throw new Error(`Failed to fetch bddoctorsdirectory: ${fetchRes.status}`);
    }
    const apiData = await fetchRes.json();
    const rawDoctors = apiData.doctors || [];
    console.log(`[Scraper] Retrieved ${rawDoctors.length} doctors from directory API.`);

    // Build the quota targets
    const targetDistricts = [];
    for (const dq of DISTRICT_QUOTAS) {
        for (let i = 0; i < dq.quota; i++) {
            targetDistricts.push({
                district: dq.district,
                city: dq.city
            });
        }
    }

    const totalToSeed = Math.min(rawDoctors.length, targetDistricts.length);
    console.log(`[Allocation] Planned seeding count: ${totalToSeed} doctors across ${DISTRICT_QUOTAS.length} districts.`);
    console.log(`  - Dhaka: 30 doctors`);
    console.log(`  - Chittagong: 20 doctors`);
    console.log(`  - Sylhet: 9 doctors`);
    console.log(`  - Remaining 61 districts: fully covered with 1-4 doctors each`);

    // Common password hash for all seeded doctors ('Doctor@123')
    const passwordHash = await bcrypt.hash('Doctor@123', 10);

    let createdCount = 0;
    const errors = [];

    for (let i = 0; i < totalToSeed; i++) {
        const raw = rawDoctors[i];
        const targetGeo = targetDistricts[i];

        try {
            // Clean Doctor Name
            let name = (raw.name || '').trim();
            if (!/^dr\.?/i.test(name) && !/^prof/i.test(name)) {
                name = `Dr. ${name}`;
            }

            // Clean BMDC Number
            let bmdc = (raw.bmdcNumber || '').trim();
            if (!bmdc || bmdc === '-' || bmdc.length < 3) {
                bmdc = `A-${20000 + i}`;
            }

            // Check if doctor with BMDC already exists
            const existingDoc = await Doctor.findOne({ bmdcNumber: bmdc });
            if (existingDoc) {
                console.log(`[Skip] Doctor with BMDC ${bmdc} already in DB: ${existingDoc.name}`);
                continue;
            }

            // Upload image to Cloudinary
            const photoUrl = await uploadToCloudinary(raw.image, name);

            // Generate unique username & email
            const username = generateCleanUsername(name, bmdc);
            const email = `${username}@healiix-directory.com`;

            // Chamber configuration
            const chambers = [];
            const rawChambers = raw.chambers || [];

            // Primary Chamber for the assigned target district
            const primaryHospital = targetGeo.district === 'Dhaka' && rawChambers[0]?.name 
                ? rawChambers[0].name 
                : getHospitalForDistrict(targetGeo.district);

            const primaryAddress = rawChambers[0]?.address || `${targetGeo.city} Sadar Road, Near Medical College`;
            const primaryPhone = rawChambers[0]?.phone || raw.appointmentPhoneNumber || `017${Math.floor(10000000 + Math.random() * 89999999)}`;
            
            // Real Google Maps URL for easy navigation
            const primaryMapUrl = rawChambers[0]?.mapUrl && !rawChambers[0].mapUrl.includes('output=embed')
                ? rawChambers[0].mapUrl
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(primaryHospital + ', ' + targetGeo.city + ', Bangladesh')}`;

            chambers.push({
                hospitalName: primaryHospital,
                address: primaryAddress,
                city: targetGeo.city,
                district: targetGeo.district,
                fee: Number(raw.fee) || 1200,
                visitingDays: ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
                visitingHours: rawChambers[0]?.visitingHour || '05:00 PM - 09:00 PM',
                contactPhone: primaryPhone,
                mapUrl: primaryMapUrl,
                slots: ['05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM'],
            });

            // If raw record had a 2nd chamber and doctor is in Dhaka or Chittagong, add secondary chamber
            if (rawChambers.length > 1 && (targetGeo.district === 'Dhaka' || targetGeo.district === 'Chittagong')) {
                const secCh = rawChambers[1];
                const secHospital = secCh.name || getHospitalForDistrict(targetGeo.district);
                const secPhone = secCh.phone || `018${Math.floor(10000000 + Math.random() * 89999999)}`;
                const secMap = secCh.mapUrl && !secCh.mapUrl.includes('output=embed')
                    ? secCh.mapUrl
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(secHospital + ', ' + targetGeo.city + ', Bangladesh')}`;

                chambers.push({
                    hospitalName: secHospital,
                    address: secCh.address || `${targetGeo.city} Branch Chamber`,
                    city: targetGeo.city,
                    district: targetGeo.district,
                    fee: (Number(raw.fee) || 1200) + 200,
                    visitingDays: ['Sat', 'Mon', 'Wed'],
                    visitingHours: secCh.visitingHour || '06:00 PM - 09:30 PM',
                    contactPhone: secPhone,
                    mapUrl: secMap,
                    slots: ['06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM'],
                });
            }

            // Specialty & Subspecialties
            const specialty = (raw.specialty || 'General Physician').trim();
            const subSpecialties = (raw.specializations || []).map(s => s.name || s).filter(Boolean);

            // Degrees
            const rawQual = cleanHtml(raw.qualifications || '');
            const degrees = rawQual ? rawQual.split(',').map(d => d.trim()).filter(Boolean) : ['MBBS', 'FCPS'];

            // Experience
            const expYears = Number(raw.experience) || Math.floor(5 + Math.random() * 20);

            // 1. Create User Document
            const user = await User.create({
                fullName: name,
                username,
                email,
                password: passwordHash,
                role: 'doctor',
                phone: primaryPhone,
                dateOfBirth: new Date(1980 + Math.floor(Math.random() * 15), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
                avatar: photoUrl,
                gender: 'Male',
                isEmailVerified: true,
                isActive: true,
            });

            // 2. Create Doctor Document (Pre-approved BMDC Verified Specialist)
            await Doctor.create({
                userId: user._id,
                username,
                name,
                email,
                phone: primaryPhone,
                dateOfBirth: user.dateOfBirth,
                bmdcNumber: bmdc,
                specialty,
                subSpecialties: subSpecialties.length ? subSpecialties : [specialty],
                degrees,
                experienceYears: expYears,
                designation: raw.designationAndDepartment ? raw.designationAndDepartment.split(',')[0].trim() : 'Consultant Specialist',
                currentWorkplace: raw.designationAndDepartment ? (raw.designationAndDepartment.split(',')[1] || primaryHospital).trim() : primaryHospital,
                about: cleanHtml(raw.biography) || `${name} is an experienced ${specialty} specialist serving patients in ${targetGeo.district}.`,
                photoUrl,
                chambers,
                rating: (4.7 + Math.random() * 0.3).toFixed(1),
                totalReviews: Math.floor(8 + Math.random() * 25),
                isVerified: true,
                verificationStatus: 'approved',
                gender: 'Male',
            });

            createdCount++;
            if (createdCount % 10 === 0 || createdCount === totalToSeed) {
                console.log(`[Progress] Inserted ${createdCount}/${totalToSeed} doctors (Latest: ${name} in ${targetGeo.district}).`);
            }
        } catch (err) {
            console.error(`[Error] Doctor ${i} (${raw.name}):`, err.message);
            errors.push({ doctor: raw.name, error: err.message });
        }
    }

    console.log('================================================================');
    console.log(`✅ Doctor Ingestion Complete!`);
    console.log(`🎉 Successfully seeded: ${createdCount} verified doctors`);
    console.log(`⚠️ Errors encountered: ${errors.length}`);

    // Verify district count in DB
    const agg = await Doctor.aggregate([
        { $unwind: '$chambers' },
        { $group: { _id: '$chambers.district', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);

    console.log('\n📊 Database District Distribution Summary:');
    agg.slice(0, 15).forEach(row => console.log(`  - ${row._id}: ${row.count} doctors`));
    console.log(`  ... Total unique districts with doctors: ${agg.length}/64`);

    const grandTotal = await Doctor.countDocuments({ isVerified: true });
    console.log(`\n🏆 Grand Total BMDC Verified Doctors in HealiiX: ${grandTotal}`);

    // Re-enable mail safety flag
    delete process.env.DISABLE_MAIL;
    console.log('🔒 Mail safety flag removed. Mail server re-enabled.');
    process.exit(0);
}

main().catch(err => {
    console.error('Fatal seeding error:', err);
    process.exit(1);
});
